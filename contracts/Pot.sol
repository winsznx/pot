// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IPotBadges {
    function mintBacker(address to, uint256 potId) external returns (uint256);
    function mintCreator(address to, uint256 potId) external returns (uint256);
}

/// @title Pot — onchain pots for cUSD-denominated fundraisers on Celo
/// @notice Create a pot, share the link, watch it fill in real time. Withdraw when target is hit
///         or refunds activate after a missed deadline.
/// @dev Single contract. Daily check-in and referral logic is folded in here intentionally — the
///      whole protocol stays inside one audited surface.
contract Pot is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /* -------------------------------- types ------------------------------- */

    enum PotStatus {
        Active,
        Withdrawn,
        Refunded,
        Cancelled
    }

    struct PotData {
        address creator;
        uint64 deadline; //  unix timestamp; 0 means no deadline (pot stays open until withdraw)
        bool refundIfMissed; //  if true & deadline passed without target, contributors can refund
        PotStatus status;
        uint256 target; //  cUSD wei; 0 means open-ended (no target)
        uint256 raised;
        bytes32 metadataHash; //  keccak256 of the off-chain metadata blob (story/title/img URL)
    }

    /* --------------------------------- state ------------------------------ */

    IERC20 public immutable cUSD;
    address public treasury;
    IPotBadges public badges;

    uint256 public protocolFeeBps; //  basis points
    uint256 public endorseCost; //  cUSD wei per endorsement
    uint256 public pinCostPerDay; //  cUSD wei per day pinned
    uint256 public nextPotId;

    uint256 public constant MAX_PROTOCOL_FEE_BPS = 500; // 5% hard cap
    uint256 public constant MAX_PIN_DAYS = 30;
    uint256 public constant CHECK_IN_COOLDOWN = 20 hours;
    uint256 public constant CHECK_IN_GRACE = 48 hours;

    mapping(uint256 => PotData) private _pots;
    mapping(uint256 => mapping(address => uint256)) public contributionOf;
    mapping(uint256 => address[]) private _contributorList;

    mapping(uint256 => uint256) public pinEscrow; //  unspent pin balance per pot
    mapping(uint256 => uint64) public pinExpiresAt;
    mapping(uint256 => uint16) public endorsementCount;
    mapping(uint256 => mapping(address => bool)) public hasEndorsed;
    mapping(uint256 => uint16) public upvoteCount;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint16) public flagCount;
    mapping(uint256 => mapping(address => bool)) public hasFlagged;

    // user retention layer (intentionally not abstracted out — keeps the surface auditable)
    mapping(address => uint64) public lastCheckIn;
    mapping(address => uint16) public streak;
    mapping(address => uint256) public freeCredits;
    mapping(address => address) public referrerOf;
    mapping(address => uint32) public referralCount;

    /* -------------------------------- events ------------------------------ */

    event PotCreated(
        uint256 indexed potId,
        address indexed creator,
        uint256 target,
        uint64 deadline,
        bool refundIfMissed,
        bytes32 metadataHash
    );
    event Contributed(uint256 indexed potId, address indexed backer, uint256 amount);
    event Matched(
        uint256 indexed potId,
        address indexed matcher,
        address indexed backer,
        uint256 amount
    );
    event Withdrawn(
        uint256 indexed potId,
        address indexed creator,
        uint256 grossAmount,
        uint256 fee
    );
    event Refunded(uint256 indexed potId, address indexed backer, uint256 amount);
    event Cancelled(uint256 indexed potId);
    event MetadataUpdated(uint256 indexed potId, bytes32 oldHash, bytes32 newHash);
    event DeadlineExtended(uint256 indexed potId, uint64 oldDeadline, uint64 newDeadline);

    event Endorsed(uint256 indexed potId, address indexed endorser, uint256 cost);
    event Pinned(uint256 indexed potId, address indexed pinner, uint256 daysCount, uint256 cost);
    event Unpinned(
        uint256 indexed potId,
        address indexed unpinner,
        uint256 refundedDays,
        uint256 refundAmount
    );
    event PinEarningsSwept(uint256 indexed potId, uint256 amount);
    event Tipped(uint256 indexed potId, address indexed tipper, uint256 amount);
    event Voted(uint256 indexed potId, address indexed voter);
    event Flagged(uint256 indexed potId, address indexed flagger, bytes32 reasonCode);
    event Tagged(uint256 indexed potId, address indexed tagger, bytes32 indexed tag);

    event CheckedIn(address indexed user, uint16 streak, uint256 reward);
    event Referred(address indexed user, address indexed referrer);
    event AchievementUnlocked(address indexed user, bytes32 indexed id, uint64 timestamp);

    event ProtocolFeeUpdated(uint256 oldBps, uint256 newBps);
    event EndorseCostUpdated(uint256 oldCost, uint256 newCost);
    event PinCostUpdated(uint256 oldCost, uint256 newCost);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event BadgesUpdated(address indexed oldBadges, address indexed newBadges);

    /* -------------------------------- errors ------------------------------ */

    error ZeroAddress();
    error ZeroAmount();
    error InvalidDeadline();
    error PotNotActive();
    error PotNotWithdrawn();
    error NotCreator();
    error TargetNotMet();
    error DeadlineNotPassed();
    error RefundsDisabled();
    error NoContribution();
    error AlreadyEndorsed();
    error AlreadyVoted();
    error AlreadyFlagged();
    error AlreadyReferred();
    error CannotReferSelf();
    error TooManyDays();
    error NotPinned();
    error PinStillActive();
    error CheckInTooSoon();
    error FeeTooHigh();
    error BadgesNotSet();
    error AlreadyHasContributions();

    /* ------------------------------ constructor --------------------------- */

    constructor(IERC20 _cUSD, address _treasury) Ownable(msg.sender) {
        if (address(_cUSD) == address(0) || _treasury == address(0)) revert ZeroAddress();
        cUSD = _cUSD;
        treasury = _treasury;
        protocolFeeBps = 100; // 1%
        endorseCost = 0.1 ether; // 0.1 cUSD assuming 18 decimals
        pinCostPerDay = 1 ether; // 1 cUSD / day
    }

    /* --------------------------------- admin ------------------------------ */

    function setProtocolFeeBps(uint256 newBps) external onlyOwner {
        if (newBps > MAX_PROTOCOL_FEE_BPS) revert FeeTooHigh();
        emit ProtocolFeeUpdated(protocolFeeBps, newBps);
        protocolFeeBps = newBps;
    }

    function setEndorseCost(uint256 newCost) external onlyOwner {
        emit EndorseCostUpdated(endorseCost, newCost);
        endorseCost = newCost;
    }

    function setPinCostPerDay(uint256 newCost) external onlyOwner {
        emit PinCostUpdated(pinCostPerDay, newCost);
        pinCostPerDay = newCost;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setBadges(address newBadges) external onlyOwner {
        if (newBadges == address(0)) revert ZeroAddress();
        emit BadgesUpdated(address(badges), newBadges);
        badges = IPotBadges(newBadges);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /* ------------------------------- core flow ---------------------------- */

    /// @notice Open a new pot.
    /// @param target cUSD wei target. 0 = open-ended.
    /// @param deadline Unix timestamp. 0 = no deadline.
    /// @param refundIfMissed If true and deadline passes without target, contributors can pull refunds.
    /// @param metadataHash keccak256 of the off-chain metadata blob.
    function createPot(
        uint256 target,
        uint64 deadline,
        bool refundIfMissed,
        bytes32 metadataHash
    ) external whenNotPaused returns (uint256 potId) {
        if (deadline != 0 && deadline <= block.timestamp) revert InvalidDeadline();

        potId = nextPotId++;
        _pots[potId] = PotData({
            creator: msg.sender,
            deadline: deadline,
            refundIfMissed: refundIfMissed,
            status: PotStatus.Active,
            target: target,
            raised: 0,
            metadataHash: metadataHash
        });

        emit PotCreated(potId, msg.sender, target, deadline, refundIfMissed, metadataHash);
        emit AchievementUnlocked(msg.sender, "first_pot_or_more", uint64(block.timestamp));
    }

    /// @notice Contribute cUSD to a pot. Requires prior cUSD approval.
    function contribute(uint256 potId, uint256 amount) external nonReentrant whenNotPaused {
        _contribute(potId, msg.sender, amount);
    }

    /// @notice Match someone else's contribution dollar-for-dollar to a pot. Real
    ///         donor-matching dynamic; the matched backer must have already contributed.
    function matchContribution(uint256 potId, address backer, uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (backer == address(0)) revert ZeroAddress();
        if (contributionOf[potId][backer] == 0) revert NoContribution();
        _contribute(potId, msg.sender, amount);
        emit Matched(potId, msg.sender, backer, amount);
    }

    function _contribute(uint256 potId, address from, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) revert PotNotActive();
        if (p.deadline != 0 && block.timestamp > p.deadline) revert PotNotActive();

        if (contributionOf[potId][from] == 0) {
            _contributorList[potId].push(from);
        }
        contributionOf[potId][from] += amount;
        p.raised += amount;

        cUSD.safeTransferFrom(from, address(this), amount);
        emit Contributed(potId, from, amount);
    }

    /// @notice Creator pulls accumulated contributions. Allowed when:
    ///         - target == 0 (open-ended), OR
    ///         - raised >= target, OR
    ///         - deadline passed and refundIfMissed is false
    function withdraw(uint256 potId) external nonReentrant whenNotPaused {
        PotData storage p = _pots[potId];
        if (msg.sender != p.creator) revert NotCreator();
        if (p.status != PotStatus.Active) revert PotNotActive();

        bool deadlineHit = p.deadline != 0 && block.timestamp > p.deadline;
        bool targetHit = p.target == 0 || p.raised >= p.target;
        bool canWithdraw = targetHit || (deadlineHit && !p.refundIfMissed);

        if (!canWithdraw) {
            if (p.raised < p.target) revert TargetNotMet();
            revert DeadlineNotPassed();
        }

        uint256 gross = p.raised;
        uint256 fee = (gross * protocolFeeBps) / 10000;
        uint256 net = gross - fee;

        p.status = PotStatus.Withdrawn;
        p.raised = 0;

        if (fee > 0) cUSD.safeTransfer(treasury, fee);
        cUSD.safeTransfer(p.creator, net);

        emit Withdrawn(potId, p.creator, gross, fee);
    }

    /// @notice Pull-based refund for individual contributors after a failed pot.
    function refund(uint256 potId) external nonReentrant whenNotPaused {
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) revert PotNotActive();
        if (!p.refundIfMissed) revert RefundsDisabled();
        if (p.deadline == 0 || block.timestamp <= p.deadline) revert DeadlineNotPassed();
        if (p.target != 0 && p.raised >= p.target) revert TargetNotMet();

        uint256 amount = contributionOf[potId][msg.sender];
        if (amount == 0) revert NoContribution();

        contributionOf[potId][msg.sender] = 0;
        p.raised -= amount;
        cUSD.safeTransfer(msg.sender, amount);

        emit Refunded(potId, msg.sender, amount);
    }

    /// @notice Cancel an empty pot. Only the creator, only if no contributions.
    function cancelPot(uint256 potId) external whenNotPaused {
        PotData storage p = _pots[potId];
        if (msg.sender != p.creator) revert NotCreator();
        if (p.status != PotStatus.Active) revert PotNotActive();
        if (p.raised != 0) revert AlreadyHasContributions();

        p.status = PotStatus.Cancelled;
        emit Cancelled(potId);
    }

    function updateMetadata(uint256 potId, bytes32 newHash) external whenNotPaused {
        PotData storage p = _pots[potId];
        if (msg.sender != p.creator) revert NotCreator();
        if (p.status != PotStatus.Active) revert PotNotActive();
        bytes32 oldHash = p.metadataHash;
        p.metadataHash = newHash;
        emit MetadataUpdated(potId, oldHash, newHash);
    }

    function extendDeadline(uint256 potId, uint64 newDeadline) external whenNotPaused {
        PotData storage p = _pots[potId];
        if (msg.sender != p.creator) revert NotCreator();
        if (p.status != PotStatus.Active) revert PotNotActive();
        if (newDeadline <= block.timestamp) revert InvalidDeadline();
        if (p.deadline != 0 && newDeadline <= p.deadline) revert InvalidDeadline();

        uint64 oldDeadline = p.deadline;
        p.deadline = newDeadline;
        emit DeadlineExtended(potId, oldDeadline, newDeadline);
    }

    /* -------------------------- curation (paid) --------------------------- */

    /// @notice Endorse a pot for cUSD. Splits 80% creator / 20% treasury.
    function endorsePot(uint256 potId) external nonReentrant whenNotPaused {
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) revert PotNotActive();
        if (hasEndorsed[potId][msg.sender]) revert AlreadyEndorsed();

        hasEndorsed[potId][msg.sender] = true;
        endorsementCount[potId]++;

        uint256 cost = endorseCost;
        uint256 toCreator = (cost * 80) / 100;
        uint256 toTreasury = cost - toCreator;

        if (toCreator > 0) cUSD.safeTransferFrom(msg.sender, p.creator, toCreator);
        if (toTreasury > 0) cUSD.safeTransferFrom(msg.sender, treasury, toTreasury);

        emit Endorsed(potId, msg.sender, cost);
    }

    /// @notice Pay to pin a pot to the discovery feed for `daysCount` days. Funds escrow in
    ///         the contract; on unpin, the unspent portion refunds proportionally to the
    ///         caller. Used portion sweeps to treasury via `sweepPinEarnings` once the pin
    ///         expires.
    function pinPot(uint256 potId, uint256 daysCount) external nonReentrant whenNotPaused {
        if (daysCount == 0 || daysCount > MAX_PIN_DAYS) revert TooManyDays();
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) revert PotNotActive();

        uint256 cost = daysCount * pinCostPerDay;
        cUSD.safeTransferFrom(msg.sender, address(this), cost);
        pinEscrow[potId] += cost;

        uint64 base = pinExpiresAt[potId] > block.timestamp
            ? pinExpiresAt[potId]
            : uint64(block.timestamp);
        pinExpiresAt[potId] = base + uint64(daysCount * 1 days);

        emit Pinned(potId, msg.sender, daysCount, cost);
    }

    /// @notice Creator unpins a pot early. Pro-rata refund of unused full days back to creator.
    function unpinPot(uint256 potId) external nonReentrant whenNotPaused {
        PotData storage p = _pots[potId];
        if (msg.sender != p.creator) revert NotCreator();
        if (pinExpiresAt[potId] <= block.timestamp) revert NotPinned();

        uint256 remainingSecs = pinExpiresAt[potId] - block.timestamp;
        uint256 remainingDays = remainingSecs / 1 days;
        if (remainingDays == 0) revert NotPinned();

        uint256 refundAmount = remainingDays * pinCostPerDay;
        if (refundAmount > pinEscrow[potId]) refundAmount = pinEscrow[potId];

        pinEscrow[potId] -= refundAmount;
        pinExpiresAt[potId] = uint64(block.timestamp);
        cUSD.safeTransfer(msg.sender, refundAmount);

        emit Unpinned(potId, msg.sender, remainingDays, refundAmount);
    }

    /// @notice After a pin expires, anyone can sweep the used portion to the treasury.
    function sweepPinEarnings(uint256 potId) external whenNotPaused {
        if (pinExpiresAt[potId] > block.timestamp) revert PinStillActive();
        uint256 amount = pinEscrow[potId];
        if (amount == 0) revert NoContribution();
        pinEscrow[potId] = 0;
        cUSD.safeTransfer(treasury, amount);
        emit PinEarningsSwept(potId, amount);
    }

    /// @notice Tip the creator directly. No escrow path — pure forward.
    function tipCreator(uint256 potId, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        PotData storage p = _pots[potId];
        if (p.creator == address(0)) revert PotNotActive();
        cUSD.safeTransferFrom(msg.sender, p.creator, amount);
        emit Tipped(potId, msg.sender, amount);
    }

    /* ------------------------- curation (free) ---------------------------- */

    function votePot(uint256 potId) external whenNotPaused {
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) revert PotNotActive();
        if (hasVoted[potId][msg.sender]) revert AlreadyVoted();
        hasVoted[potId][msg.sender] = true;
        upvoteCount[potId]++;
        emit Voted(potId, msg.sender);
    }

    function flagPot(uint256 potId, bytes32 reasonCode) external whenNotPaused {
        if (hasFlagged[potId][msg.sender]) revert AlreadyFlagged();
        hasFlagged[potId][msg.sender] = true;
        flagCount[potId]++;
        emit Flagged(potId, msg.sender, reasonCode);
    }

    function tagPot(uint256 potId, bytes32 tag) external whenNotPaused {
        emit Tagged(potId, msg.sender, tag);
    }

    /* ------------------------------ retention ----------------------------- */

    /// @notice Daily check-in. One call per 20h cooldown. Streak resets after a 48h gap.
    function checkIn() external whenNotPaused {
        uint64 last = lastCheckIn[msg.sender];
        uint64 nowTs = uint64(block.timestamp);
        if (last != 0 && nowTs < last + CHECK_IN_COOLDOWN) revert CheckInTooSoon();

        if (last == 0 || nowTs > last + CHECK_IN_GRACE) {
            streak[msg.sender] = 1;
        } else {
            streak[msg.sender]++;
        }
        lastCheckIn[msg.sender] = nowTs;

        uint16 s = streak[msg.sender];
        uint256 reward = 1;
        if (s % 30 == 0) reward = 10;
        else if (s % 7 == 0) reward = 3;

        freeCredits[msg.sender] += reward;
        emit CheckedIn(msg.sender, s, reward);

        if (s == 7) emit AchievementUnlocked(msg.sender, "weekly_streak", nowTs);
        if (s == 30) emit AchievementUnlocked(msg.sender, "monthly_streak", nowTs);
    }

    function setReferrer(address ref) external whenNotPaused {
        if (referrerOf[msg.sender] != address(0)) revert AlreadyReferred();
        if (ref == msg.sender) revert CannotReferSelf();
        if (ref == address(0)) revert ZeroAddress();
        referrerOf[msg.sender] = ref;
        referralCount[ref]++;
        freeCredits[ref] += 1;
        emit Referred(msg.sender, ref);
    }

    /* -------------------------------- badges ------------------------------ */

    function claimBackerBadge(uint256 potId) external whenNotPaused returns (uint256) {
        if (address(badges) == address(0)) revert BadgesNotSet();
        if (contributionOf[potId][msg.sender] == 0) revert NoContribution();
        return badges.mintBacker(msg.sender, potId);
    }

    function claimCreatorBadge(uint256 potId) external whenNotPaused returns (uint256) {
        if (address(badges) == address(0)) revert BadgesNotSet();
        PotData storage p = _pots[potId];
        if (msg.sender != p.creator) revert NotCreator();
        if (p.status != PotStatus.Withdrawn) revert PotNotWithdrawn();
        return badges.mintCreator(msg.sender, potId);
    }

    /* --------------------------------- views ------------------------------ */

    function getPot(uint256 potId) external view returns (PotData memory) {
        return _pots[potId];
    }

    function getContributors(uint256 potId) external view returns (address[] memory) {
        return _contributorList[potId];
    }

    function getContribution(uint256 potId, address user) external view returns (uint256) {
        return contributionOf[potId][user];
    }

    function isPinned(uint256 potId) external view returns (bool) {
        return pinExpiresAt[potId] > block.timestamp;
    }

    function isWithdrawable(uint256 potId) external view returns (bool) {
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) return false;
        bool deadlineHit = p.deadline != 0 && block.timestamp > p.deadline;
        bool targetHit = p.target == 0 || p.raised >= p.target;
        return targetHit || (deadlineHit && !p.refundIfMissed);
    }

    function isRefundable(uint256 potId) external view returns (bool) {
        PotData storage p = _pots[potId];
        if (p.status != PotStatus.Active) return false;
        if (!p.refundIfMissed) return false;
        if (p.deadline == 0 || block.timestamp <= p.deadline) return false;
        if (p.target == 0) return false;
        return p.raised < p.target;
    }
}
