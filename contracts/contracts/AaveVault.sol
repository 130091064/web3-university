// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./MockUSDT.sol";

/// @title AaveVault - Aave 风格的“真实 pool”USDT 理财金库
/// @notice 资产用 MockUSDT，利息自动随时间增长（固定年化利率）
contract AaveVault is ReentrancyGuard, Ownable {
    using SafeERC20 for MockUSDT;

    uint256 internal constant RAY = 1e27;
    uint256 internal constant SECONDS_PER_YEAR = 365 days;

    MockUSDT public immutable asset;

    // Aave 风格的利息参数
    uint128 public liquidityIndex; // 收益指数（RAY 精度）
    uint128 public liquidityRate; // 年化利率（RAY 精度）
    uint40 public lastUpdateTimestamp; // 上次更新时间

    // 用户缩放后余额
    mapping(address => uint256) public scaledBalanceOf;
    uint256 public totalScaledSupply;

    event Deposit(address indexed user, uint256 assets, uint256 scaledAmount);
    event Withdraw(address indexed user, uint256 assets, uint256 scaledBurn);
    event LiquidityRateUpdated(uint256 newRate);
    event StateUpdated(uint256 newIndex, uint256 timestamp);

    constructor(
        address _asset,
        uint256 _initialLiquidityRateRay
    ) Ownable(msg.sender) {
        require(_asset != address(0), "asset is zero");
        asset = MockUSDT(_asset);

        // 初始 index = 1 RAY，表示没有收益
        liquidityIndex = uint128(RAY);
        lastUpdateTimestamp = uint40(block.timestamp);
        liquidityRate = uint128(_initialLiquidityRateRay); // 比如 5% = 0.05 * 1e27
    }

    // ============ 内部：更新利息状态 ============

    /// @notice 根据当前时间和利率，更新 liquidityIndex
    function _updateState() internal {
        uint40 currentTimestamp = uint40(block.timestamp);
        uint40 lastTimestamp = lastUpdateTimestamp;

        if (currentTimestamp == lastTimestamp) {
            return;
        }

        uint256 dt = uint256(currentTimestamp - lastTimestamp);
        uint256 currentIndex = uint256(liquidityIndex);
        uint256 rate = uint256(liquidityRate);

        if (rate == 0) {
            lastUpdateTimestamp = currentTimestamp;
            return;
        }

        // 简化版线性利息：index = index + index * rate * dt / (RAY * SECONDS_PER_YEAR)
        uint256 accrued = (currentIndex * rate * dt) / (RAY * SECONDS_PER_YEAR);
        currentIndex = currentIndex + accrued;

        liquidityIndex = uint128(currentIndex);
        lastUpdateTimestamp = currentTimestamp;

        emit StateUpdated(currentIndex, currentTimestamp);
    }

    // ============ 视图函数 ============

    /// @notice 返回当前时刻的最新 index（不改状态）
    function getCurrentIndex() public view returns (uint256) {
        uint40 currentTimestamp = uint40(block.timestamp);
        uint40 lastTimestamp = lastUpdateTimestamp;
        uint256 currentIndex = uint256(liquidityIndex);
        uint256 rate = uint256(liquidityRate);

        if (currentTimestamp == lastTimestamp || rate == 0) {
            return currentIndex;
        }

        uint256 dt = uint256(currentTimestamp - lastTimestamp);
        uint256 accrued = (currentIndex * rate * dt) / (RAY * SECONDS_PER_YEAR);
        return currentIndex + accrued;
    }

    /// @notice 用户当前可赎回的资产余额
    function balanceOf(address user) public view returns (uint256) {
        uint256 index = getCurrentIndex();
        return (scaledBalanceOf[user] * index) / RAY;
    }

    /// @notice 池子总资产（所有用户可赎回总和）
    function totalAssets() public view returns (uint256) {
        uint256 index = getCurrentIndex();
        return (totalScaledSupply * index) / RAY;
    }

    // ============ 存入 / 取出 ============

    /// @notice 存入 MockUSDT，获得带利息的仓位（缩放余额）
    function deposit(uint256 assets) external nonReentrant {
        require(assets > 0, "assets = 0");

        _updateState();

        uint256 index = uint256(liquidityIndex);
        // scaledAmount = assets / index
        // 为避免精度丢失：scaled = assets * RAY / index
        uint256 scaledAmount = (assets * RAY) / index;
        require(scaledAmount > 0, "scaled = 0");

        // 把资产转入池子
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // 更新缩放余额和总供给
        scaledBalanceOf[msg.sender] += scaledAmount;
        totalScaledSupply += scaledAmount;

        emit Deposit(msg.sender, assets, scaledAmount);
    }

    /// @notice 赎回指定资产数量（如果用户余额足够）
    function withdraw(uint256 assets) public nonReentrant {
        require(assets > 0, "assets = 0");

        _updateState();

        uint256 index = uint256(liquidityIndex);
        uint256 userBalance = balanceOf(msg.sender);
        require(userBalance >= assets, "insufficient balance");

        // 要烧掉多少 scaled 余额：scaled = assets * RAY / index
        uint256 scaledToBurn = (assets * RAY) / index;
        require(scaledToBurn > 0, "scaledToBurn = 0");
        require(scaledBalanceOf[msg.sender] >= scaledToBurn, "scaled too much");

        scaledBalanceOf[msg.sender] -= scaledToBurn;
        totalScaledSupply -= scaledToBurn;

        asset.safeTransfer(msg.sender, assets);

        emit Withdraw(msg.sender, assets, scaledToBurn);
    }

    /// @notice 一次性赎回全部（按当前 index 计算）
    function withdrawAll() external {
        uint256 amount = balanceOf(msg.sender);
        withdraw(amount); // ✅ 现在这里不会再标红
    }

    // ============ 管理：配置利率 ============

    /// @notice 设置年化利率（RAY 精度），例如：5% = 0.05 * 1e27
    function setLiquidityRate(uint256 newRateRay) external onlyOwner {
        _updateState(); // 先把之前的利息结算到当前 index
        liquidityRate = uint128(newRateRay);
        emit LiquidityRateUpdated(newRateRay);
    }
}
