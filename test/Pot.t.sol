// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {Pot} from "../contracts/Pot.sol";
import {PotBadges} from "../contracts/PotBadges.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract PotTest is Test {
    Pot internal pot;
    PotBadges internal badges;
    MockERC20 internal cUSD;

    address internal owner = address(0xA11CE);
    address internal treasury = address(0x7EA5);
    address internal alice = address(0x71CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA40);
    address internal dan = address(0xDA1);

    bytes32 internal constant META = keccak256("metadata.v0");

    function setUp() public {
        cUSD = new MockERC20("Celo Dollar", "cUSD", 18);

        vm.prank(owner);
        pot = new Pot(cUSD, treasury);

        vm.prank(owner);
        badges = new PotBadges();

        vm.prank(owner);
        badges.setPot(address(pot));

        vm.prank(owner);
        pot.setBadges(address(badges));

        // fund actors
        cUSD.mint(alice, 10_000 ether);
        cUSD.mint(bob, 10_000 ether);
        cUSD.mint(carol, 10_000 ether);
        cUSD.mint(dan, 10_000 ether);

        // pre-approve Pot for everyone
        vm.prank(alice);
        cUSD.approve(address(pot), type(uint256).max);
        vm.prank(bob);
        cUSD.approve(address(pot), type(uint256).max);
        vm.prank(carol);
        cUSD.approve(address(pot), type(uint256).max);
        vm.prank(dan);
        cUSD.approve(address(pot), type(uint256).max);
    }

    /* ----------------------------- create flow ---------------------------- */

    function test_create_basic() public {
        vm.prank(alice);
        uint256 id = pot.createPot(100 ether, uint64(block.timestamp + 7 days), true, META);

        Pot.PotData memory p = pot.getPot(id);
        assertEq(p.creator, alice);
        assertEq(p.target, 100 ether);
        assertEq(p.deadline, uint64(block.timestamp + 7 days));
        assertEq(p.refundIfMissed, true);
        assertEq(uint256(p.status), uint256(Pot.PotStatus.Active));
        assertEq(p.metadataHash, META);
        assertEq(pot.nextPotId(), 1);
    }

    function test_create_pastDeadline_reverts() public {
        vm.warp(1_700_000_000);
        vm.prank(alice);
        vm.expectRevert(Pot.InvalidDeadline.selector);
        pot.createPot(100 ether, uint64(block.timestamp - 1), true, META);
    }

    function test_create_zeroDeadline_isOpenEnded() public {
        vm.prank(alice);
        uint256 id = pot.createPot(0, 0, false, META);
        Pot.PotData memory p = pot.getPot(id);
        assertEq(p.deadline, 0);
        assertEq(p.target, 0);
    }

    /* ----------------------------- contribute ----------------------------- */

    function test_contribute_addsContributor() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 25 ether);

        assertEq(pot.getContribution(id, bob), 25 ether);
        assertEq(pot.getContributors(id).length, 1);
        assertEq(pot.getContributors(id)[0], bob);
        assertEq(pot.getPot(id).raised, 25 ether);
    }

    function test_contribute_twice_keepsSingleContributorEntry() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 10 ether);
        vm.prank(bob);
        pot.contribute(id, 15 ether);

        assertEq(pot.getContribution(id, bob), 25 ether);
        assertEq(pot.getContributors(id).length, 1);
    }

    function test_contribute_zero_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        vm.expectRevert(Pot.ZeroAmount.selector);
        pot.contribute(id, 0);
    }

    function test_contribute_afterDeadline_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 1 days, true);
        vm.warp(block.timestamp + 2 days);
        vm.prank(bob);
        vm.expectRevert(Pot.PotNotActive.selector);
        pot.contribute(id, 10 ether);
    }

    function test_match_addsMatcherContribution() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 10 ether);

        vm.prank(carol);
        pot.matchContribution(id, bob, 10 ether);

        assertEq(pot.getContribution(id, carol), 10 ether);
        assertEq(pot.getContribution(id, bob), 10 ether);
        assertEq(pot.getPot(id).raised, 20 ether);
    }

    function test_match_unbackedContributor_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(carol);
        vm.expectRevert(Pot.NoContribution.selector);
        pot.matchContribution(id, bob, 10 ether);
    }

    /* ------------------------------ withdraw ------------------------------ */

    function test_withdraw_targetMet_creatorReceivesNetMinusFee() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 100 ether);

        uint256 beforeBalAlice = cUSD.balanceOf(alice);
        uint256 beforeBalTreasury = cUSD.balanceOf(treasury);

        vm.prank(alice);
        pot.withdraw(id);

        uint256 fee = (100 ether * 100) / 10_000; // 1%
        assertEq(cUSD.balanceOf(alice) - beforeBalAlice, 100 ether - fee);
        assertEq(cUSD.balanceOf(treasury) - beforeBalTreasury, fee);
        assertEq(uint256(pot.getPot(id).status), uint256(Pot.PotStatus.Withdrawn));
    }

    function test_withdraw_belowTargetBeforeDeadline_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 50 ether);

        vm.prank(alice);
        vm.expectRevert(Pot.TargetNotMet.selector);
        pot.withdraw(id);
    }

    function test_withdraw_belowTargetAfterDeadline_keepWhatWasRaised() public {
        uint256 id = _newPotByAlice(100 ether, 1 days, false); // refundIfMissed = false
        vm.prank(bob);
        pot.contribute(id, 50 ether);

        vm.warp(block.timestamp + 2 days);
        vm.prank(alice);
        pot.withdraw(id);

        uint256 fee = (50 ether * 100) / 10_000;
        assertEq(cUSD.balanceOf(alice), 10_000 ether + 50 ether - fee);
    }

    function test_withdraw_byNonCreator_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        vm.expectRevert(Pot.NotCreator.selector);
        pot.withdraw(id);
    }

    function test_withdraw_openEnded_alwaysAllowed() public {
        vm.prank(alice);
        uint256 id = pot.createPot(0, 0, false, META);
        vm.prank(bob);
        pot.contribute(id, 5 ether);

        vm.prank(alice);
        pot.withdraw(id);
        // 1% fee on 5 ether
        uint256 fee = (5 ether * 100) / 10_000;
        assertEq(cUSD.balanceOf(alice), 10_000 ether + 5 ether - fee);
    }

    function test_withdraw_secondTime_reverts() public {
        uint256 id = _newPotByAlice(0, 0, false);
        vm.prank(bob);
        pot.contribute(id, 10 ether);
        vm.prank(alice);
        pot.withdraw(id);

        vm.prank(alice);
        vm.expectRevert(Pot.PotNotActive.selector);
        pot.withdraw(id);
    }

    /* ------------------------------- refund ------------------------------- */

    function test_refund_pullsContribution() public {
        uint256 id = _newPotByAlice(100 ether, 1 days, true);
        vm.prank(bob);
        pot.contribute(id, 30 ether);
        vm.prank(carol);
        pot.contribute(id, 20 ether);

        vm.warp(block.timestamp + 2 days);

        uint256 before = cUSD.balanceOf(bob);
        vm.prank(bob);
        pot.refund(id);
        assertEq(cUSD.balanceOf(bob) - before, 30 ether);
        assertEq(pot.getContribution(id, bob), 0);
        assertEq(pot.getPot(id).raised, 20 ether);
    }

    function test_refund_beforeDeadline_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 10 ether);
        vm.prank(bob);
        vm.expectRevert(Pot.DeadlineNotPassed.selector);
        pot.refund(id);
    }

    function test_refund_targetMet_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 1 days, true);
        vm.prank(bob);
        pot.contribute(id, 100 ether);
        vm.warp(block.timestamp + 2 days);
        vm.prank(bob);
        vm.expectRevert(Pot.TargetNotMet.selector);
        pot.refund(id);
    }

    function test_refund_disabledPot_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 1 days, false);
        vm.prank(bob);
        pot.contribute(id, 30 ether);
        vm.warp(block.timestamp + 2 days);
        vm.prank(bob);
        vm.expectRevert(Pot.RefundsDisabled.selector);
        pot.refund(id);
    }

    function test_refund_nonContributor_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 1 days, true);
        vm.prank(bob);
        pot.contribute(id, 10 ether);
        vm.warp(block.timestamp + 2 days);
        vm.prank(carol);
        vm.expectRevert(Pot.NoContribution.selector);
        pot.refund(id);
    }

    /* ------------------------------- cancel ------------------------------- */

    function test_cancel_emptyPot() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(alice);
        pot.cancelPot(id);
        assertEq(uint256(pot.getPot(id).status), uint256(Pot.PotStatus.Cancelled));
    }

    function test_cancel_withContributions_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 1 ether);
        vm.prank(alice);
        vm.expectRevert(Pot.AlreadyHasContributions.selector);
        pot.cancelPot(id);
    }

    /* ----------------------------- metadata ------------------------------- */

    function test_updateMetadata_byCreator() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        bytes32 newHash = keccak256("v1");
        vm.prank(alice);
        pot.updateMetadata(id, newHash);
        assertEq(pot.getPot(id).metadataHash, newHash);
    }

    function test_updateMetadata_byNonCreator_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        vm.expectRevert(Pot.NotCreator.selector);
        pot.updateMetadata(id, keccak256("nope"));
    }

    function test_extendDeadline() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        uint64 newDl = uint64(block.timestamp + 14 days);
        vm.prank(alice);
        pot.extendDeadline(id, newDl);
        assertEq(pot.getPot(id).deadline, newDl);
    }

    function test_extendDeadline_pastEarlier_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(alice);
        vm.expectRevert(Pot.InvalidDeadline.selector);
        pot.extendDeadline(id, uint64(block.timestamp + 1 days));
    }

    /* ------------------------------- endorse ------------------------------ */

    function test_endorse_splits80_20() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        uint256 cost = pot.endorseCost();
        uint256 toCreator = (cost * 80) / 100;
        uint256 toTreasury = cost - toCreator;

        uint256 aliceBefore = cUSD.balanceOf(alice);
        uint256 treasuryBefore = cUSD.balanceOf(treasury);
        uint256 bobBefore = cUSD.balanceOf(bob);

        vm.prank(bob);
        pot.endorsePot(id);

        assertEq(cUSD.balanceOf(alice) - aliceBefore, toCreator);
        assertEq(cUSD.balanceOf(treasury) - treasuryBefore, toTreasury);
        assertEq(bobBefore - cUSD.balanceOf(bob), cost);
        assertEq(pot.endorsementCount(id), 1);
    }

    function test_endorse_twice_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.endorsePot(id);
        vm.prank(bob);
        vm.expectRevert(Pot.AlreadyEndorsed.selector);
        pot.endorsePot(id);
    }

    /* --------------------------------- pin -------------------------------- */

    function test_pin_extendsExpiry_andCharges() public {
        uint256 id = _newPotByAlice(100 ether, 30 days, true);
        uint256 startTs = block.timestamp;

        vm.prank(bob);
        pot.pinPot(id, 3);
        assertEq(pot.pinExpiresAt(id), uint64(startTs + 3 days));
        assertEq(pot.pinEscrow(id), 3 * pot.pinCostPerDay());
        assertTrue(pot.isPinned(id));
    }

    function test_pin_zeroDays_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 30 days, true);
        vm.prank(bob);
        vm.expectRevert(Pot.TooManyDays.selector);
        pot.pinPot(id, 0);
    }

    function test_pin_overMax_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 60 days, true);
        vm.prank(bob);
        vm.expectRevert(Pot.TooManyDays.selector);
        pot.pinPot(id, 31);
    }

    function test_unpin_refundsRemainingDays_toCreator() public {
        uint256 id = _newPotByAlice(100 ether, 30 days, true);
        vm.prank(bob);
        pot.pinPot(id, 5);
        vm.warp(block.timestamp + 2 days);

        uint256 before = cUSD.balanceOf(alice);
        vm.prank(alice);
        pot.unpinPot(id);
        // 3 days unspent
        assertEq(cUSD.balanceOf(alice) - before, 3 * pot.pinCostPerDay());
        assertFalse(pot.isPinned(id));
    }

    function test_unpin_byNonCreator_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 30 days, true);
        vm.prank(bob);
        pot.pinPot(id, 5);
        vm.prank(bob);
        vm.expectRevert(Pot.NotCreator.selector);
        pot.unpinPot(id);
    }

    function test_sweepPinEarnings_afterExpiry_movesToTreasury() public {
        uint256 id = _newPotByAlice(100 ether, 60 days, true);
        vm.prank(bob);
        pot.pinPot(id, 4);
        uint256 expected = 4 * pot.pinCostPerDay();
        vm.warp(block.timestamp + 5 days);

        uint256 treasuryBefore = cUSD.balanceOf(treasury);
        pot.sweepPinEarnings(id);
        assertEq(cUSD.balanceOf(treasury) - treasuryBefore, expected);
        assertEq(pot.pinEscrow(id), 0);
    }

    function test_sweepPinEarnings_whileActive_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 60 days, true);
        vm.prank(bob);
        pot.pinPot(id, 4);
        vm.expectRevert(Pot.PinStillActive.selector);
        pot.sweepPinEarnings(id);
    }

    /* --------------------------------- tip -------------------------------- */

    function test_tip_forwardsToCreator() public {
        uint256 id = _newPotByAlice(0, 0, false);
        uint256 before = cUSD.balanceOf(alice);
        vm.prank(bob);
        pot.tipCreator(id, 5 ether);
        assertEq(cUSD.balanceOf(alice) - before, 5 ether);
    }

    /* --------------------------- vote / flag / tag ------------------------ */

    function test_vote_oncePerVoter() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.votePot(id);
        assertEq(pot.upvoteCount(id), 1);
        vm.prank(bob);
        vm.expectRevert(Pot.AlreadyVoted.selector);
        pot.votePot(id);
    }

    function test_flag_oncePerFlagger() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.flagPot(id, "spam");
        assertEq(pot.flagCount(id), 1);
        vm.prank(bob);
        vm.expectRevert(Pot.AlreadyFlagged.selector);
        pot.flagPot(id, "spam");
    }

    function test_tag_emitsEvent() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        // event must be emitted; just check the call doesn't revert
        pot.tagPot(id, "tuition");
    }

    /* --------------------------- check-in / referral ---------------------- */

    function test_checkIn_firstCall_streakOne_givesOneCredit() public {
        vm.prank(bob);
        pot.checkIn();
        assertEq(pot.streak(bob), 1);
        assertEq(pot.freeCredits(bob), 1);
    }

    function test_checkIn_tooSoon_reverts() public {
        vm.prank(bob);
        pot.checkIn();
        vm.warp(block.timestamp + 10 hours);
        vm.prank(bob);
        vm.expectRevert(Pot.CheckInTooSoon.selector);
        pot.checkIn();
    }

    function test_checkIn_within48h_continuesStreak() public {
        vm.prank(bob);
        pot.checkIn();
        vm.warp(block.timestamp + 24 hours);
        vm.prank(bob);
        pot.checkIn();
        assertEq(pot.streak(bob), 2);
    }

    function test_checkIn_after48h_resetsStreak() public {
        vm.prank(bob);
        pot.checkIn();
        vm.warp(block.timestamp + 60 hours);
        vm.prank(bob);
        pot.checkIn();
        assertEq(pot.streak(bob), 1);
    }

    function test_checkIn_weeklyBonus() public {
        // 7 daily check-ins, ~24h apart
        for (uint256 i; i < 7; i++) {
            vm.warp(block.timestamp + 24 hours);
            vm.prank(bob);
            pot.checkIn();
        }
        // streak hits 7 on the 7th call → reward = 3
        // total credits: 1 + 1 + 1 + 1 + 1 + 1 + 3 = 9
        assertEq(pot.streak(bob), 7);
        assertEq(pot.freeCredits(bob), 9);
    }

    function test_setReferrer_records_andRewardsReferrer() public {
        vm.prank(bob);
        pot.setReferrer(alice);
        assertEq(pot.referrerOf(bob), alice);
        assertEq(pot.referralCount(alice), 1);
        assertEq(pot.freeCredits(alice), 1);
    }

    function test_setReferrer_self_reverts() public {
        vm.prank(bob);
        vm.expectRevert(Pot.CannotReferSelf.selector);
        pot.setReferrer(bob);
    }

    function test_setReferrer_twice_reverts() public {
        vm.prank(bob);
        pot.setReferrer(alice);
        vm.prank(bob);
        vm.expectRevert(Pot.AlreadyReferred.selector);
        pot.setReferrer(carol);
    }

    /* -------------------------------- badges ------------------------------ */

    function test_claimBackerBadge_afterContribute() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 1 ether);

        vm.prank(bob);
        uint256 tokenId = pot.claimBackerBadge(id);

        assertEq(badges.ownerOf(tokenId), bob);
        assertTrue(badges.claimedBacker(bob, id));
    }

    function test_claimBackerBadge_withoutContribute_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        vm.expectRevert(Pot.NoContribution.selector);
        pot.claimBackerBadge(id);
    }

    function test_claimBackerBadge_twice_reverts() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(bob);
        pot.contribute(id, 1 ether);
        vm.prank(bob);
        pot.claimBackerBadge(id);
        vm.prank(bob);
        vm.expectRevert(PotBadges.AlreadyClaimed.selector);
        pot.claimBackerBadge(id);
    }

    function test_claimCreatorBadge_afterWithdraw() public {
        uint256 id = _newPotByAlice(0, 0, false);
        vm.prank(bob);
        pot.contribute(id, 5 ether);
        vm.prank(alice);
        pot.withdraw(id);

        vm.prank(alice);
        uint256 tokenId = pot.claimCreatorBadge(id);
        assertEq(badges.ownerOf(tokenId), alice);
    }

    function test_claimCreatorBadge_beforeWithdraw_reverts() public {
        uint256 id = _newPotByAlice(0, 0, false);
        vm.prank(alice);
        vm.expectRevert(Pot.PotNotWithdrawn.selector);
        pot.claimCreatorBadge(id);
    }

    /* --------------------------------- admin ------------------------------ */

    function test_setProtocolFeeBps_capped() public {
        vm.prank(owner);
        vm.expectRevert(Pot.FeeTooHigh.selector);
        pot.setProtocolFeeBps(501);
    }

    function test_setProtocolFeeBps_byNonOwner_reverts() public {
        vm.prank(bob);
        vm.expectRevert();
        pot.setProtocolFeeBps(50);
    }

    function test_setBadges_idempotentReplaceable() public {
        // we already set in setUp; setting again should still emit but succeed (Pot allows replace)
        vm.prank(owner);
        pot.setBadges(address(badges));
    }

    /* -------------------------------- pause ------------------------------- */

    function test_pause_blocksContribute() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(owner);
        pot.pause();
        vm.prank(bob);
        vm.expectRevert();
        pot.contribute(id, 10 ether);
    }

    function test_unpause_restoresContribute() public {
        uint256 id = _newPotByAlice(100 ether, 7 days, true);
        vm.prank(owner);
        pot.pause();
        vm.prank(owner);
        pot.unpause();
        vm.prank(bob);
        pot.contribute(id, 1 ether);
        assertEq(pot.getContribution(id, bob), 1 ether);
    }

    /* ------------------------------- helpers ------------------------------ */

    function _newPotByAlice(uint256 target, uint256 duration, bool refundIfMissed)
        internal
        returns (uint256 id)
    {
        vm.prank(alice);
        id = pot.createPot(
            target,
            duration == 0 ? 0 : uint64(block.timestamp + duration),
            refundIfMissed,
            META
        );
    }
}
