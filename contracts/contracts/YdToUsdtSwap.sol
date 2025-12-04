// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice 精简版 ERC20 接口
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

/// @title YdToUsdtSwap
/// @dev 用 YD 固定汇率兑换 USDT，主要给课程作者使用
/// - 用户先 approve YD 给本合约
/// - 调用 swapYdForUsdt(ydAmount)
/// - 合约收到 YD，再按一定汇率发 USDT 出去（来自合约库存）
contract YdToUsdtSwap {
    IERC20 public immutable ydToken;
    IERC20 public immutable usdtToken;
    address public owner;

    /// @notice 汇率设置：1 YD 可以兑换多少 USDT（带 6 位精度）
    /// 例如：rateUsdtPerYd = 1e6  =>  1 YD = 1 USDT
    uint256 public rateUsdtPerYd;

    event Swapped(address indexed user, uint256 ydIn, uint256 usdtOut);
    event RateChanged(uint256 oldRate, uint256 newRate);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event WithdrawToken(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _ydToken, address _usdtToken, uint256 _rateUsdtPerYd) {
        require(_ydToken != address(0), "YD token required");
        require(_usdtToken != address(0), "USDT token required");
        require(_rateUsdtPerYd > 0, "rate must > 0");

        ydToken = IERC20(_ydToken);
        usdtToken = IERC20(_usdtToken);
        owner = msg.sender;
        rateUsdtPerYd = _rateUsdtPerYd;
    }

    /// @notice 修改汇率
    /// @param newRate 1 YD 可兑换多少 USDT，单位 1e6（USDT 的最小单位）
    function setRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "rate must > 0");
        uint256 old = rateUsdtPerYd;
        rateUsdtPerYd = newRate;
        emit RateChanged(old, newRate);
    }

    /// @notice 用 YD 兑换 USDT（需要先对本合约 approve YD）
    /// @param ydAmount 要兑换的 YD 数量（18 位精度）
    function swapYdForUsdt(uint256 ydAmount) external {
        require(ydAmount > 0, "ydAmount = 0");

        // 1. 从用户钱包把 YD 收进来
        bool ok = ydToken.transferFrom(msg.sender, address(this), ydAmount);
        require(ok, "YD transfer failed");

        // 2. 计算应该发多少 USDT：
        //    usdtOut(6位) = ydAmount(18位) / 1e18 * rateUsdtPerYd(6位)
        //    = ydAmount * rateUsdtPerYd / 1e18
        uint256 usdtOut = (ydAmount * rateUsdtPerYd) / 1e18;
        require(usdtOut > 0, "usdtOut = 0");

        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance >= usdtOut, "Not enough USDT liquidity");

        ok = usdtToken.transfer(msg.sender, usdtOut);
        require(ok, "USDT transfer failed");

        emit Swapped(msg.sender, ydAmount, usdtOut);
    }

    /// @notice owner 提走多余的 Token（例如下线时）
    function withdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "zero to");
        IERC20 erc = IERC20(token);
        bool ok = erc.transfer(to, amount);
        require(ok, "withdraw failed");
        emit WithdrawToken(token, to, amount);
    }

    /// @notice 修改 owner
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }
}
