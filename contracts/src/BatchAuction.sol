// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BatchAuction {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant PRICE_SCALE = 1e6;
    uint8 public constant MAX_ORDERS = 20;

    // --- Enums ---
    enum Side { Buy, Sell }
    enum OrderStatus { None, Pending, Filled, Unfilled }
    enum BatchStatus { None, Open, Settled }

    // --- Structs ---
    struct Order {
        address user;
        Side side;
        uint256 limitPrice; // tokenB per tokenA, scaled by PRICE_SCALE
        uint256 amount;     // in tokenA units
        uint256 filledPrice;
        OrderStatus status;
    }

    struct Batch {
        uint64 openAt;
        uint64 closeAt;
        uint256 clearingPrice;
        uint8 buyCount;
        uint8 sellCount;
        BatchStatus status;
        // Fixed arrays: buys sorted DESC by limitPrice, sells sorted ASC
        Order[20] buyOrders;
        Order[20] sellOrders;
    }

    struct UserBalance {
        uint256 tokenABalance;
        uint256 tokenBBalance;
        uint256 tokenALocked;
        uint256 tokenBLocked;
    }

    // --- State ---
    address public owner;
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint32 public batchDuration;
    uint64 public currentBatchId;
    bool public paused;

    mapping(uint64 => Batch) public batches;
    mapping(address => UserBalance) public userBalances;
    mapping(uint64 => mapping(address => bool)) public hasOrder;

    // --- Events ---
    event Initialized(address tokenA, address tokenB, uint32 duration);
    event Deposited(address indexed user, uint256 amountA, uint256 amountB);
    event Withdrawn(address indexed user, uint256 amountA, uint256 amountB);
    event BatchOpened(uint64 indexed batchId, uint64 closeAt);
    event OrderSubmitted(uint64 indexed batchId, address indexed user, Side side, uint256 limitPrice, uint256 amount);
    event OrderCancelled(uint64 indexed batchId, address indexed user);
    event BatchSettled(uint64 indexed batchId, uint256 clearingPrice, uint8 filled, uint8 unfilled);

    // --- Errors ---
    error NotOwner();
    error AlreadyInitialized();
    error Paused();
    error InvalidAmount();
    error InvalidPrice();
    error InsufficientBalance();
    error BatchNotOpen();
    error BatchStillOpen();
    error TooManyOrders();
    error AlreadyHasOrder();
    error NoOrder();
    error NoOrders();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    // --- Initialize ---
    function initialize(
        address _tokenA,
        address _tokenB,
        uint32 _batchDuration
    ) external {
        if (owner != address(0)) revert AlreadyInitialized();
        owner = msg.sender;
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        batchDuration = _batchDuration;
    }

    // --- Deposit ---
    function deposit(uint256 amountA, uint256 amountB) external whenNotPaused {
        if (amountA == 0 && amountB == 0) revert InvalidAmount();

        UserBalance storage bal = userBalances[msg.sender];

        if (amountA > 0) {
            tokenA.safeTransferFrom(msg.sender, address(this), amountA);
            bal.tokenABalance += amountA;
        }
        if (amountB > 0) {
            tokenB.safeTransferFrom(msg.sender, address(this), amountB);
            bal.tokenBBalance += amountB;
        }

        emit Deposited(msg.sender, amountA, amountB);
    }

    // --- Withdraw ---
    function withdraw(uint256 amountA, uint256 amountB) external {
        if (amountA == 0 && amountB == 0) revert InvalidAmount();

        UserBalance storage bal = userBalances[msg.sender];
        uint256 availableA = bal.tokenABalance - bal.tokenALocked;
        uint256 availableB = bal.tokenBBalance - bal.tokenBLocked;

        if (amountA > availableA) revert InsufficientBalance();
        if (amountB > availableB) revert InsufficientBalance();

        if (amountA > 0) {
            bal.tokenABalance -= amountA;
            tokenA.safeTransfer(msg.sender, amountA);
        }
        if (amountB > 0) {
            bal.tokenBBalance -= amountB;
            tokenB.safeTransfer(msg.sender, amountB);
        }

        emit Withdrawn(msg.sender, amountA, amountB);
    }

    // --- Open Batch ---
    function openBatch() external returns (uint64 batchId) {
        batchId = currentBatchId;
        Batch storage b = batches[batchId];
        b.openAt = uint64(block.timestamp);
        b.closeAt = uint64(block.timestamp) + batchDuration;
        b.status = BatchStatus.Open;
        currentBatchId++;
        emit BatchOpened(batchId, b.closeAt);
    }

    // --- Submit Order ---
    function submitOrder(
        uint64 batchId,
        Side side,
        uint256 limitPrice,
        uint256 amount
    ) external whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (limitPrice == 0) revert InvalidPrice();

        Batch storage b = batches[batchId];
        if (b.status != BatchStatus.Open) revert BatchNotOpen();
        if (block.timestamp >= b.closeAt) revert BatchNotOpen();
        if (hasOrder[batchId][msg.sender]) revert AlreadyHasOrder();

        UserBalance storage bal = userBalances[msg.sender];

        if (side == Side.Buy) {
            if (b.buyCount >= MAX_ORDERS) revert TooManyOrders();
            // Lock tokenB = amount * limitPrice / PRICE_SCALE
            uint256 lockAmount = (amount * limitPrice) / PRICE_SCALE;
            uint256 available = bal.tokenBBalance - bal.tokenBLocked;
            if (lockAmount > available) revert InsufficientBalance();
            bal.tokenBLocked += lockAmount;
            // Insertion sort: DESC by limitPrice
            _insertBuy(b, Order({
                user: msg.sender,
                side: Side.Buy,
                limitPrice: limitPrice,
                amount: amount,
                filledPrice: 0,
                status: OrderStatus.Pending
            }));
            b.buyCount++;
        } else {
            if (b.sellCount >= MAX_ORDERS) revert TooManyOrders();
            // Lock tokenA = amount
            uint256 available = bal.tokenABalance - bal.tokenALocked;
            if (amount > available) revert InsufficientBalance();
            bal.tokenALocked += amount;
            // Insertion sort: ASC by limitPrice
            _insertSell(b, Order({
                user: msg.sender,
                side: Side.Sell,
                limitPrice: limitPrice,
                amount: amount,
                filledPrice: 0,
                status: OrderStatus.Pending
            }));
            b.sellCount++;
        }

        hasOrder[batchId][msg.sender] = true;
        emit OrderSubmitted(batchId, msg.sender, side, limitPrice, amount);
    }

    // --- Cancel Order ---
    function cancelOrder(uint64 batchId) external {
        Batch storage b = batches[batchId];
        if (b.status != BatchStatus.Open) revert BatchNotOpen();
        if (!hasOrder[batchId][msg.sender]) revert NoOrder();

        UserBalance storage bal = userBalances[msg.sender];

        // Find and remove from buy orders
        bool found = false;
        for (uint8 i = 0; i < b.buyCount; i++) {
            if (b.buyOrders[i].user == msg.sender) {
                // Unlock tokenB
                uint256 lockAmount = (b.buyOrders[i].amount * b.buyOrders[i].limitPrice) / PRICE_SCALE;
                bal.tokenBLocked -= lockAmount;
                // Shift remaining
                for (uint8 j = i; j < b.buyCount - 1; j++) {
                    b.buyOrders[j] = b.buyOrders[j + 1];
                }
                delete b.buyOrders[b.buyCount - 1];
                b.buyCount--;
                found = true;
                break;
            }
        }

        if (!found) {
            for (uint8 i = 0; i < b.sellCount; i++) {
                if (b.sellOrders[i].user == msg.sender) {
                    // Unlock tokenA
                    bal.tokenALocked -= b.sellOrders[i].amount;
                    // Shift remaining
                    for (uint8 j = i; j < b.sellCount - 1; j++) {
                        b.sellOrders[j] = b.sellOrders[j + 1];
                    }
                    delete b.sellOrders[b.sellCount - 1];
                    b.sellCount--;
                    found = true;
                    break;
                }
            }
        }

        hasOrder[batchId][msg.sender] = false;
        emit OrderCancelled(batchId, msg.sender);
    }

    // --- Settle Batch ---
    function settleBatch(uint64 batchId) external {
        Batch storage b = batches[batchId];
        if (b.status != BatchStatus.Open) revert BatchNotOpen();
        if (block.timestamp < b.closeAt) revert BatchStillOpen();
        if (b.buyCount == 0 && b.sellCount == 0) revert NoOrders();

        uint256 clearingPrice = _findClearingPrice(b);
        b.clearingPrice = clearingPrice;

        uint8 filled = 0;
        uint8 unfilled = 0;

        // Process buy orders
        for (uint8 i = 0; i < b.buyCount; i++) {
            Order storage order = b.buyOrders[i];
            UserBalance storage bal = userBalances[order.user];

            if (clearingPrice > 0 && order.limitPrice >= clearingPrice) {
                // Fill at clearing price
                order.filledPrice = clearingPrice;
                order.status = OrderStatus.Filled;

                // Unlock tokenB locked at limit price
                uint256 lockedAtLimit = (order.amount * order.limitPrice) / PRICE_SCALE;
                bal.tokenBLocked -= lockedAtLimit;

                // Deduct tokenB at clearing price
                uint256 cost = (order.amount * clearingPrice) / PRICE_SCALE;
                bal.tokenBBalance -= cost;

                // Credit tokenA
                bal.tokenABalance += order.amount;
                filled++;
            } else {
                // Unfilled: unlock tokenB
                uint256 lockedAtLimit = (order.amount * order.limitPrice) / PRICE_SCALE;
                bal.tokenBLocked -= lockedAtLimit;
                order.status = OrderStatus.Unfilled;
                unfilled++;
            }
        }

        // Process sell orders
        for (uint8 i = 0; i < b.sellCount; i++) {
            Order storage order = b.sellOrders[i];
            UserBalance storage bal = userBalances[order.user];

            if (clearingPrice > 0 && order.limitPrice <= clearingPrice) {
                // Fill at clearing price
                order.filledPrice = clearingPrice;
                order.status = OrderStatus.Filled;

                // Unlock and deduct tokenA
                bal.tokenALocked -= order.amount;
                bal.tokenABalance -= order.amount;

                // Credit tokenB at clearing price
                uint256 proceeds = (order.amount * clearingPrice) / PRICE_SCALE;
                bal.tokenBBalance += proceeds;
                filled++;
            } else {
                // Unfilled: unlock tokenA
                bal.tokenALocked -= order.amount;
                order.status = OrderStatus.Unfilled;
                unfilled++;
            }
        }

        b.status = BatchStatus.Settled;
        emit BatchSettled(batchId, clearingPrice, filled, unfilled);
    }

    // --- View Functions ---
    function getBatch(uint64 batchId) external view returns (
        uint64 openAt,
        uint64 closeAt,
        uint256 clearingPrice,
        uint8 buyCount,
        uint8 sellCount,
        BatchStatus status
    ) {
        Batch storage b = batches[batchId];
        return (b.openAt, b.closeAt, b.clearingPrice, b.buyCount, b.sellCount, b.status);
    }

    function getBuyOrder(uint64 batchId, uint8 index) external view returns (
        address user, Side side, uint256 limitPrice, uint256 amount, uint256 filledPrice, OrderStatus status
    ) {
        Order storage o = batches[batchId].buyOrders[index];
        return (o.user, o.side, o.limitPrice, o.amount, o.filledPrice, o.status);
    }

    function getSellOrder(uint64 batchId, uint8 index) external view returns (
        address user, Side side, uint256 limitPrice, uint256 amount, uint256 filledPrice, OrderStatus status
    ) {
        Order storage o = batches[batchId].sellOrders[index];
        return (o.user, o.side, o.limitPrice, o.amount, o.filledPrice, o.status);
    }

    function getUserBalance(address user) external view returns (
        uint256 tokenABalance, uint256 tokenBBalance, uint256 tokenALocked, uint256 tokenBLocked
    ) {
        UserBalance storage bal = userBalances[user];
        return (bal.tokenABalance, bal.tokenBBalance, bal.tokenALocked, bal.tokenBLocked);
    }

    // --- Internal: Insertion Sort ---
    function _insertBuy(Batch storage b, Order memory newOrder) internal {
        uint8 count = b.buyCount;
        // Find insertion point (DESC: highest price first)
        uint8 pos = count;
        for (uint8 i = 0; i < count; i++) {
            if (newOrder.limitPrice > b.buyOrders[i].limitPrice) {
                pos = i;
                break;
            }
        }
        // Shift right
        for (uint8 i = count; i > pos; i--) {
            b.buyOrders[i] = b.buyOrders[i - 1];
        }
        b.buyOrders[pos] = newOrder;
    }

    function _insertSell(Batch storage b, Order memory newOrder) internal {
        uint8 count = b.sellCount;
        // Find insertion point (ASC: lowest price first)
        uint8 pos = count;
        for (uint8 i = 0; i < count; i++) {
            if (newOrder.limitPrice < b.sellOrders[i].limitPrice) {
                pos = i;
                break;
            }
        }
        // Shift right
        for (uint8 i = count; i > pos; i--) {
            b.sellOrders[i] = b.sellOrders[i - 1];
        }
        b.sellOrders[pos] = newOrder;
    }

    // --- Internal: Clearing Price Algorithm ---
    // Port of find_clearing_price from Solana settle_batch.rs
    // Walks sorted buy (DESC) and sell (ASC) arrays, finds crossing, returns midpoint
    function _findClearingPrice(Batch storage b) internal view returns (uint256) {
        if (b.buyCount == 0 || b.sellCount == 0) return 0;

        uint256 bestBuy = b.buyOrders[0].limitPrice;
        uint256 bestSell = b.sellOrders[0].limitPrice;
        if (bestBuy < bestSell) return 0; // No crossing

        uint256 cumBuyVol = 0;
        uint256 cumSellVol = 0;
        uint8 buyIdx = 0;
        uint8 sellIdx = 0;

        while (buyIdx < b.buyCount && sellIdx < b.sellCount) {
            if (b.buyOrders[buyIdx].limitPrice < b.sellOrders[sellIdx].limitPrice) {
                break; // No more crossing
            }

            cumBuyVol += b.buyOrders[buyIdx].amount;
            cumSellVol += b.sellOrders[sellIdx].amount;

            if (cumBuyVol >= cumSellVol) {
                sellIdx++;
            } else {
                buyIdx++;
            }
        }

        uint8 finalBuyIdx = buyIdx < b.buyCount ? buyIdx : b.buyCount - 1;
        uint8 finalSellIdx = sellIdx < b.sellCount ? sellIdx : b.sellCount - 1;

        uint256 finalBuyPrice = b.buyOrders[finalBuyIdx].limitPrice;
        uint256 finalSellPrice = b.sellOrders[finalSellIdx].limitPrice;

        if (finalBuyPrice >= finalSellPrice) {
            return (finalBuyPrice + finalSellPrice) / 2;
        }
        return 0;
    }
}
