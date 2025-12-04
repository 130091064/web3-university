// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice 精简版 ERC20 接口，用于 YDToken 交互
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

/// @title YDSale
/// @dev 固定汇率，用 Sepolia ETH 购买 YD
/// - 平台方把一部分 YD 转进本合约作为库存
/// - 用户通过 buyWithEth() 发送 ETH，按汇率获得 YD
contract YDSale {
    IERC20 public immutable ydToken;
    address public owner;

    /// @notice 汇率：1 ETH 可以兑换多少 YD（18 位精度）
    /// 例如： rate = 1000 * 1e18  =>  1 ETH = 1000 YD
    uint256 public rate;

    event TokensPurchased(
        address indexed buyer,
        uint256 ethAmount,
        uint256 ydAmount
    );
    event RateChanged(uint256 oldRate, uint256 newRate);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event WithdrawEth(address indexed to, uint256 amount);
    event WithdrawYD(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _ydToken, uint256 _rate) {
        require(_ydToken != address(0), "YD token required");
        require(_rate > 0, "rate must > 0");
        ydToken = IERC20(_ydToken);
        owner = msg.sender;
        rate = _rate;
    }

    /// @notice 修改汇率（1 ETH = newRate YD）
    function setRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "rate must > 0");
        uint256 old = rate;
        rate = newRate;
        emit RateChanged(old, newRate);
    }

    /// @notice 购买 YD：发送 ETH，按固定汇率兑换
    function buyWithEth() external payable {
        require(msg.value > 0, "No ETH sent");

        // 按公式计算：ydAmount = msg.value * rate / 1e18
        uint256 ydAmount = (msg.value * rate) / 1e18;
        require(ydAmount > 0, "ydAmount = 0");

        uint256 balance = ydToken.balanceOf(address(this));
        require(balance >= ydAmount, "Not enough YD in sale");

        bool ok = ydToken.transfer(msg.sender, ydAmount);
        require(ok, "YD transfer failed");

        emit TokensPurchased(msg.sender, msg.value, ydAmount);
    }

    /// @notice owner 提走合约里收到的 ETH（只是为了好看，测试网不提也行）
    function withdrawEth(address payable to) external onlyOwner {
        require(to != address(0), "zero address");
        uint256 amount = address(this).balance;
        require(amount > 0, "no ETH");
        to.transfer(amount);
        emit WithdrawEth(to, amount);
    }

    /// @notice owner 提走剩余的 YD（例如下线活动时）
    function withdrawYD(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero address");
        uint256 balance = ydToken.balanceOf(address(this));
        require(amount <= balance, "exceed balance");
        bool ok = ydToken.transfer(to, amount);
        require(ok, "YD transfer failed");
        emit WithdrawYD(to, amount);
    }

    /// @notice 切换 owner（防止你钱包换地址）
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }
}
