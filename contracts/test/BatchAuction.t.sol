// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BatchAuction.sol";
import "../src/ShieldSOL.sol";
import "../src/ShieldUSDC.sol";

contract BatchAuctionTest is Test {
    BatchAuction auction;
    ShieldSOL shSOL;
    ShieldUSDC shUSDC;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address settler = makeAddr("settler");

    uint256 constant PRICE_SCALE = 1e6;

    function setUp() public {
        shSOL = new ShieldSOL();
        shUSDC = new ShieldUSDC();
        auction = new BatchAuction();
        auction.initialize(address(shSOL), address(shUSDC), 30);

        // Mint tokens (18 decimals)
        shSOL.mint(alice, 1000 ether);
        shUSDC.mint(alice, 1_000_000 ether);
        shSOL.mint(bob, 1000 ether);
        shUSDC.mint(bob, 1_000_000 ether);

        // Approve auction contract
        vm.prank(alice);
        shSOL.approve(address(auction), type(uint256).max);
        vm.prank(alice);
        shUSDC.approve(address(auction), type(uint256).max);
        vm.prank(bob);
        shSOL.approve(address(auction), type(uint256).max);
        vm.prank(bob);
        shUSDC.approve(address(auction), type(uint256).max);
    }

    // Test 1: Initialize config
    function test_initialize() public view {
        assertEq(address(auction.tokenA()), address(shSOL));
        assertEq(address(auction.tokenB()), address(shUSDC));
        assertEq(auction.batchDuration(), 30);
        assertEq(auction.currentBatchId(), 0);
    }

    // Test 2: Alice deposits SOL
    function test_aliceDepositsSOL() public {
        vm.prank(alice);
        auction.deposit(100 ether, 0);

        (uint256 balA,,,) = auction.getUserBalance(alice);
        assertEq(balA, 100 ether);
    }

    // Test 3: Bob deposits USDC
    function test_bobDepositsUSDC() public {
        vm.prank(bob);
        auction.deposit(0, 50_000 ether);

        (, uint256 balB,,) = auction.getUserBalance(bob);
        assertEq(balB, 50_000 ether);
    }

    // Test 4: Open batch
    function test_openBatch() public {
        auction.openBatch();

        (uint64 openAt, uint64 closeAt,, uint8 buyCount, uint8 sellCount, BatchAuction.BatchStatus status) = auction.getBatch(0);
        assertEq(uint8(status), uint8(BatchAuction.BatchStatus.Open));
        assertEq(closeAt, openAt + 30);
        assertEq(buyCount, 0);
        assertEq(sellCount, 0);
    }

    // Test 5: Alice sells 100 SOL at price 120
    function test_aliceSellsSOL() public {
        vm.prank(alice);
        auction.deposit(100 ether, 0);
        auction.openBatch();

        vm.prank(alice);
        auction.submitOrder(0, BatchAuction.Side.Sell, 120 * PRICE_SCALE, 100 ether);

        // tokenALocked should be 100 ether (3rd return value)
        (,, uint256 aLocked,) = auction.getUserBalance(alice);
        assertEq(aLocked, 100 ether);
    }

    // Test 6: Bob buys 100 SOL at price 150
    function test_bobBuysSOL() public {
        vm.prank(bob);
        // Lock = 100 ether * 150e6 / 1e6 = 15_000 ether USDC needed
        auction.deposit(0, 20_000 ether);
        auction.openBatch();

        vm.prank(bob);
        auction.submitOrder(0, BatchAuction.Side.Buy, 150 * PRICE_SCALE, 100 ether);

        // tokenBLocked = 100e18 * 150e6 / 1e6 = 15_000e18
        (,,, uint256 bLocked) = auction.getUserBalance(bob);
        assertEq(bLocked, 15_000 ether);
    }

    // Test 7: Settle batch (clearing price = 135)
    function test_settleBatch() public {
        _setupAndSettle();

        (,, uint256 clearingPrice,,, BatchAuction.BatchStatus status) = auction.getBatch(0);
        assertEq(uint8(status), uint8(BatchAuction.BatchStatus.Settled));
        assertEq(clearingPrice, 135 * PRICE_SCALE);
    }

    // Test 8: Alice withdraws USDC proceeds after settlement
    function test_aliceWithdrawsProceeds() public {
        _setupAndSettle();

        // Alice sold 100 SOL at clearing price 135
        // proceeds = 100e18 * 135e6 / 1e6 = 13_500e18
        (, uint256 aliceB,,) = auction.getUserBalance(alice);
        assertEq(aliceB, 13_500 ether);

        vm.prank(alice);
        auction.withdraw(0, aliceB);

        (, uint256 aliceBAfter,,) = auction.getUserBalance(alice);
        assertEq(aliceBAfter, 0);
    }

    // Test 9: Bob withdraws SOL proceeds after settlement
    function test_bobWithdrawsProceeds() public {
        _setupAndSettle();

        // Bob bought 100 SOL
        (uint256 bobA,,,) = auction.getUserBalance(bob);
        assertEq(bobA, 100 ether);

        vm.prank(bob);
        auction.withdraw(bobA, 0);

        (uint256 bobAAfter,,,) = auction.getUserBalance(bob);
        assertEq(bobAAfter, 0);
    }

    // Test 10: Cancel order and verify unlock
    function test_cancelOrder() public {
        vm.prank(alice);
        auction.deposit(100 ether, 0);
        auction.openBatch();

        vm.prank(alice);
        auction.submitOrder(0, BatchAuction.Side.Sell, 120 * PRICE_SCALE, 100 ether);

        (,, uint256 lockedBefore,) = auction.getUserBalance(alice);
        assertEq(lockedBefore, 100 ether);

        vm.prank(alice);
        auction.cancelOrder(0);

        (,, uint256 lockedAfter,) = auction.getUserBalance(alice);
        assertEq(lockedAfter, 0);
    }

    // Test 11: Batch with no crossing (all unfilled)
    function test_noCrossing() public {
        vm.prank(alice);
        auction.deposit(100 ether, 0);
        vm.prank(bob);
        auction.deposit(0, 20_000 ether);

        auction.openBatch();

        // Alice sells at 200, Bob buys at 100 -- no crossing
        vm.prank(alice);
        auction.submitOrder(0, BatchAuction.Side.Sell, 200 * PRICE_SCALE, 100 ether);
        vm.prank(bob);
        auction.submitOrder(0, BatchAuction.Side.Buy, 100 * PRICE_SCALE, 100 ether);

        vm.warp(block.timestamp + 31);
        auction.settleBatch(0);

        (,, uint256 clearingPrice,,, BatchAuction.BatchStatus status) = auction.getBatch(0);
        assertEq(clearingPrice, 0);
        assertEq(uint8(status), uint8(BatchAuction.BatchStatus.Settled));

        // Funds should be unlocked
        (uint256 aBalA,, uint256 aLockedA,) = auction.getUserBalance(alice);
        assertEq(aLockedA, 0);
        assertEq(aBalA, 100 ether);
    }

    // Test 12: Max 20 orders enforcement
    function test_maxOrdersEnforcement() public {
        auction.openBatch();

        for (uint256 i = 0; i < 20; i++) {
            address trader = makeAddr(string(abi.encodePacked("trader", i)));
            shSOL.mint(trader, 10 ether);
            vm.startPrank(trader);
            shSOL.approve(address(auction), type(uint256).max);
            auction.deposit(10 ether, 0);
            auction.submitOrder(0, BatchAuction.Side.Sell, (100 + i) * PRICE_SCALE, 10 ether);
            vm.stopPrank();
        }

        address extra = makeAddr("extra");
        shSOL.mint(extra, 10 ether);
        vm.startPrank(extra);
        shSOL.approve(address(auction), type(uint256).max);
        auction.deposit(10 ether, 0);
        vm.expectRevert(BatchAuction.TooManyOrders.selector);
        auction.submitOrder(0, BatchAuction.Side.Sell, 200 * PRICE_SCALE, 10 ether);
        vm.stopPrank();
    }

    // Test 13: Cannot submit after batch closes
    function test_cannotSubmitAfterClose() public {
        vm.prank(alice);
        auction.deposit(100 ether, 0);
        auction.openBatch();

        vm.warp(block.timestamp + 31);

        vm.prank(alice);
        vm.expectRevert(BatchAuction.BatchNotOpen.selector);
        auction.submitOrder(0, BatchAuction.Side.Sell, 120 * PRICE_SCALE, 100 ether);
    }

    // Test 14: Cannot settle before batch expires
    function test_cannotSettleBeforeExpiry() public {
        vm.prank(alice);
        auction.deposit(100 ether, 0);
        auction.openBatch();

        vm.prank(alice);
        auction.submitOrder(0, BatchAuction.Side.Sell, 120 * PRICE_SCALE, 100 ether);

        vm.expectRevert(BatchAuction.BatchStillOpen.selector);
        auction.settleBatch(0);
    }

    // --- Helper ---
    function _setupAndSettle() internal {
        vm.prank(alice);
        auction.deposit(100 ether, 0);
        vm.prank(bob);
        auction.deposit(0, 20_000 ether);

        auction.openBatch();

        vm.prank(alice);
        auction.submitOrder(0, BatchAuction.Side.Sell, 120 * PRICE_SCALE, 100 ether);
        vm.prank(bob);
        auction.submitOrder(0, BatchAuction.Side.Buy, 150 * PRICE_SCALE, 100 ether);

        vm.warp(block.timestamp + 31);
        auction.settleBatch(0);
    }
}
