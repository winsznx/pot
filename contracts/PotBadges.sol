// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title PotBadges — backer + creator achievement collection issued by the Pot protocol
/// @notice Two badge kinds:
///         - Backer: minted once per (user, pot) when the user has actually contributed
///         - Creator: minted once per (creator, pot) after the creator has successfully withdrawn
/// @dev Mints are gated by the Pot contract address. Token URI defers to a `baseURI/<tokenId>`
///      pattern so metadata can be served from a static gateway or IPFS.
contract PotBadges is ERC721, Ownable {
    using Strings for uint256;

    enum BadgeKind {
        Backer,
        Creator
    }

    struct BadgeMeta {
        BadgeKind kind;
        uint256 potId;
        uint64 mintedAt;
    }

    address public pot;
    uint256 public nextTokenId;

    mapping(uint256 => BadgeMeta) public badgeMeta;
    mapping(address => mapping(uint256 => bool)) public claimedBacker;
    mapping(address => mapping(uint256 => bool)) public claimedCreator;

    string private _baseURIValue;

    event PotUpdated(address indexed oldPot, address indexed newPot);
    event BackerBadgeMinted(uint256 indexed tokenId, address indexed to, uint256 indexed potId);
    event CreatorBadgeMinted(uint256 indexed tokenId, address indexed to, uint256 indexed potId);
    event BaseURIUpdated(string newBaseURI);

    error NotPot();
    error PotNotSet();
    error AlreadyClaimed();
    error ZeroAddress();

    constructor() ERC721("Pot Badges", "POTB") Ownable(msg.sender) {}

    modifier onlyPot() {
        if (msg.sender != pot) revert NotPot();
        if (pot == address(0)) revert PotNotSet();
        _;
    }

    function setPot(address newPot) external onlyOwner {
        if (newPot == address(0)) revert ZeroAddress();
        emit PotUpdated(pot, newPot);
        pot = newPot;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseURIValue = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function mintBacker(address to, uint256 potId) external onlyPot returns (uint256 tokenId) {
        if (claimedBacker[to][potId]) revert AlreadyClaimed();
        claimedBacker[to][potId] = true;
        tokenId = ++nextTokenId;
        _safeMint(to, tokenId);
        badgeMeta[tokenId] = BadgeMeta(BadgeKind.Backer, potId, uint64(block.timestamp));
        emit BackerBadgeMinted(tokenId, to, potId);
    }

    function mintCreator(address to, uint256 potId) external onlyPot returns (uint256 tokenId) {
        if (claimedCreator[to][potId]) revert AlreadyClaimed();
        claimedCreator[to][potId] = true;
        tokenId = ++nextTokenId;
        _safeMint(to, tokenId);
        badgeMeta[tokenId] = BadgeMeta(BadgeKind.Creator, potId, uint64(block.timestamp));
        emit CreatorBadgeMinted(tokenId, to, potId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIValue;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        BadgeMeta memory m = badgeMeta[tokenId];
        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";
        // baseURI/<kind>/<potId>/<tokenId>.json
        string memory kind = m.kind == BadgeKind.Backer ? "backer" : "creator";
        return string.concat(
            base,
            kind,
            "/",
            m.potId.toString(),
            "/",
            tokenId.toString(),
            ".json"
        );
    }
}
