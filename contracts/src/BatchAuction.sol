// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BatchAuction is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant PRICE_SCALE = 1e6;
    uint8 public constant MAX_ORDERS = 100;
    uint256 public constant PROTOCOL_FEE_BPS = 10; // 0.1% = 10 basis points
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint32 public constant SETTLE_GRACE_PERIOD = 300; // 5 min after close, anyone can settle

    // --- Enums ---
    enum Side { Buy, Sell }
    enum OrderStatus { None, Pending, Filled, Unfilled }
    enum BatchStatus { None, Open, Settled }

    // --- Structs ---
    struct Order {
        address user;
        Side side;
        uint256 limitPrice;   // tokenB per tokenA, scaled by PRICE_SCALE
        uint256 amount;       // in tokenA units
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
        Order[100] buyOrders;   // sorted DESC by limitPrice
        Order[100] sellOrders;  // sorted ASC by limitPrice
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

    // Settler role: only this address can open and settle batches
    address public settler;

    // Protocol revenue from fees (denominated in tokenB)
    uint256 public protocolRevenue;

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
    event SettlerUpdated(address indexed oldSettler, address indexed newSettler);
    event PauseToggled(bool paused);
    event ProtocolFeeCollected(uint64 indexed batchId, uint256 feeAmount);
    event RevenueWithdrawn(address indexed to, uint256 amount);

    // --- Errors ---
    error NotOwner();
    error NotSettler();
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
    error SlippageExceeded();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySettler() {
        if (msg.sender != settler && msg.sender != owner) revert NotSettler();
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
        settler = msg.sender; // owner is default settler
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        batchDuration = _batchDuration;
    }

    // --- Admin ---
    function setSettler(address _settler) external onlyOwner {
        address old = settler;
        settler = _settler;
        emit SettlerUpdated(old, _settler);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit PauseToggled(paused);
    }

    function withdrawRevenue(address to) external onlyOwner {
        uint256 amount = protocolRevenue;
        if (amount == 0) revert InvalidAmount();
        protocolRevenue = 0;
        tokenB.safeTransfer(to, amount);
        emit RevenueWithdrawn(to, amount);
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

    // --- Withdraw (reentrancy-protected) ---
    function withdraw(uint256 amountA, uint256 amountB) external nonReentrant {
        if (amountA == 0 && amountB == 0) revert InvalidAmount();

        UserBalance storage bal = userBalances[msg.sender];
        uint256 availableA = bal.tokenABalance - bal.tokenALocked;
        uint256 availableB = bal.tokenBBalance - bal.tokenBLocked;

        if (amountA > availableA) revert InsufficientBalance();
        if (amountB > availableB) revert InsufficientBalance();

        // State changes before external calls
        bal.tokenABalance -= amountA;
        bal.tokenBBalance -= amountB;

        if (amountA > 0) {
            tokenA.safeTransfer(msg.sender, amountA);
        }
        if (amountB > 0) {
            tokenB.safeTransfer(msg.sender, amountB);
        }

        emit Withdrawn(msg.sender, amountA, amountB);
    }

    // --- Open Batch (settler-only) ---
    function openBatch() external onlySettler whenNotPaused returns (uint64 batchId) {
        batchId = currentBatchId;
        Batch storage b = batches[batchId];
        b.openAt = uint64(block.timestamp);
        b.closeAt = uint64(block.timestamp) + batchDuration;
        b.status = BatchStatus.Open;
        currentBatchId++;
        emit BatchOpened(batchId, b.closeAt);
    }

    // --- Submit Order (with slippage protection) ---
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
            // Lock tokenB = amount * limitPrice / PRICE_SCALE + max fee
            uint256 cost = (amount * limitPrice) / PRICE_SCALE;
            uint256 maxFee = (cost * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
            uint256 lockAmount = cost + maxFee;
            uint256 available = bal.tokenBBalance - bal.tokenBLocked;
            if (lockAmount > available) revert InsufficientBalance();
            bal.tokenBLocked += lockAmount;
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
            uint256 available = bal.tokenABalance - bal.tokenALocked;
            if (amount > available) revert InsufficientBalance();
            bal.tokenALocked += amount;
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

        bool found = false;
        for (uint8 i = 0; i < b.buyCount; i++) {
            if (b.buyOrders[i].user == msg.sender) {
                uint256 cost = (b.buyOrders[i].amount * b.buyOrders[i].limitPrice) / PRICE_SCALE;
                uint256 maxFee = (cost * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
                bal.tokenBLocked -= (cost + maxFee);
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
                    bal.tokenALocked -= b.sellOrders[i].amount;
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
    // Settler-only during normal operation. After SETTLE_GRACE_PERIOD,
    // anyone can settle to prevent funds from being locked if settler is down.
    function settleBatch(uint64 batchId) external {
        Batch storage b = batches[batchId];
        if (b.status != BatchStatus.Open) revert BatchNotOpen();
        if (block.timestamp < b.closeAt) revert BatchStillOpen();
        if (b.buyCount == 0 && b.sellCount == 0) revert NoOrders();

        // Settler-only during grace period; anyone after
        if (block.timestamp < b.closeAt + SETTLE_GRACE_PERIOD) {
            if (msg.sender != settler && msg.sender != owner) revert NotSettler();
        }

        uint256 clearingPrice = _findClearingPrice(b);
        b.clearingPrice = clearingPrice;

        uint8 filled = 0;
        uint8 unfilled = 0;
        uint256 totalFees = 0;

        // Process buy orders
        for (uint8 i = 0; i < b.buyCount; i++) {
            Order storage order = b.buyOrders[i];
            UserBalance storage bal = userBalances[order.user];

            // Unlock = cost at limit + max fee (matches lock in submitOrder)
            uint256 costAtLimit = (order.amount * order.limitPrice) / PRICE_SCALE;
            uint256 maxFee = (costAtLimit * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
            bal.tokenBLocked -= (costAtLimit + maxFee);

            if (clearingPrice > 0 && order.limitPrice >= clearingPrice) {
                order.filledPrice = clearingPrice;
                order.status = OrderStatus.Filled;

                uint256 cost = (order.amount * clearingPrice) / PRICE_SCALE;
                uint256 fee = (cost * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
                bal.tokenBBalance -= (cost + fee);
                totalFees += fee;

                bal.tokenABalance += order.amount;
                filled++;
            } else {
                order.status = OrderStatus.Unfilled;
                unfilled++;
            }
        }

        // Process sell orders
        for (uint8 i = 0; i < b.sellCount; i++) {
            Order storage order = b.sellOrders[i];
            UserBalance storage bal = userBalances[order.user];

            if (clearingPrice > 0 && order.limitPrice <= clearingPrice) {
                order.filledPrice = clearingPrice;
                order.status = OrderStatus.Filled;

                bal.tokenALocked -= order.amount;
                bal.tokenABalance -= order.amount;

                uint256 proceeds = (order.amount * clearingPrice) / PRICE_SCALE;
                uint256 fee = (proceeds * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
                bal.tokenBBalance += (proceeds - fee);
                totalFees += fee;
                filled++;
            } else {
                bal.tokenALocked -= order.amount;
                order.status = OrderStatus.Unfilled;
                unfilled++;
            }
        }

        if (totalFees > 0) {
            protocolRevenue += totalFees;
            emit ProtocolFeeCollected(batchId, totalFees);
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
        uint8 pos = count;
        for (uint8 i = 0; i < count; i++) {
            if (newOrder.limitPrice > b.buyOrders[i].limitPrice) {
                pos = i;
                break;
            }
        }
        for (uint8 i = count; i > pos; i--) {
            b.buyOrders[i] = b.buyOrders[i - 1];
        }
        b.buyOrders[pos] = newOrder;
    }

    function _insertSell(Batch storage b, Order memory newOrder) internal {
        uint8 count = b.sellCount;
        uint8 pos = count;
        for (uint8 i = 0; i < count; i++) {
            if (newOrder.limitPrice < b.sellOrders[i].limitPrice) {
                pos = i;
                break;
            }
        }
        for (uint8 i = count; i > pos; i--) {
            b.sellOrders[i] = b.sellOrders[i - 1];
        }
        b.sellOrders[pos] = newOrder;
    }

    // --- Internal: Uniform Clearing Price Algorithm ---
    // Finds the price where cumulative buy volume meets cumulative sell volume.
    // Returns the marginal price at the crossing point (not midpoint).
    //
    // Buy orders sorted DESC: highest willingness-to-pay first.
    // Sell orders sorted ASC: lowest willingness-to-sell first.
    //
    // Walk both arrays. At each step, the "marginal" price is the tighter
    // constraint of the two sides. The crossing point is where cumulative
    // supply meets cumulative demand.
    function _findClearingPrice(Batch storage b) internal view returns (uint256) {
        if (b.buyCount == 0 || b.sellCount == 0) return 0;

        uint256 bestBuy = b.buyOrders[0].limitPrice;
        uint256 bestSell = b.sellOrders[0].limitPrice;
        if (bestBuy < bestSell) return 0; // No crossing possible

        uint256 cumBuyVol = 0;
        uint256 cumSellVol = 0;
        uint8 buyIdx = 0;
        uint8 sellIdx = 0;
        uint256 lastBuyPrice = bestBuy;
        uint256 lastSellPrice = bestSell;

        while (buyIdx < b.buyCount && sellIdx < b.sellCount) {
            // If current buy price < current sell price, no more crossing
            if (b.buyOrders[buyIdx].limitPrice < b.sellOrders[sellIdx].limitPrice) {
                break;
            }

            // Track the prices at the crossing boundary
            lastBuyPrice = b.buyOrders[buyIdx].limitPrice;
            lastSellPrice = b.sellOrders[sellIdx].limitPrice;

            cumBuyVol += b.buyOrders[buyIdx].amount;
            cumSellVol += b.sellOrders[sellIdx].amount;

            // Advance the side with less cumulative volume
            if (cumBuyVol <= cumSellVol) {
                buyIdx++;
            } else {
                sellIdx++;
            }
        }

        // Uniform clearing price: use the sell-side marginal price.
        // This is the standard call auction convention: the clearing price
        // is the highest sell price that still crosses with buys.
        // Both sides get at least as good as their limit.
        //
        // For a single buy at 150 and single sell at 120:
        //   lastSellPrice = 120, lastBuyPrice = 150
        //   Clearing at sell-side marginal = 120 is valid (buyer pays less than limit)
        //   Clearing at buy-side marginal = 150 is valid (seller gets more than limit)
        //   Convention: use sell-side (lower) to minimize buyer cost.
        //   Alternative: use buy-side to maximize seller revenue.
        //   We use the sell-side marginal for buyer-friendly clearing.
        //
        // Why not midpoint? Midpoint creates an incentive to game: submit extreme
        // limit prices to pull the midpoint in your favor. Marginal pricing makes
        // the limit price irrelevant once it crosses -- you get the uniform price.
        if (lastBuyPrice >= lastSellPrice) {
            return lastSellPrice;
        }
        return 0;
    }
}
