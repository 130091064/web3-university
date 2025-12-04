// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice 精简版 ERC20 接口
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

/// @notice 精简版 AAVE v3 Pool 接口（只保留我们要用到的函数）
interface IAavePool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

/**
 * @title AaveVault
 * @dev 课程作者的理财金库：
 *  - 只支持一种 underlying 资产（你的 USDT）
 *  - 内部用 AAVE v3 Pool 存取，获得 aUSDT
 *  - 用户通过 share 模型按比例享有金库里的资产（本金+利息）
 */
contract AaveVault {
    IERC20 public immutable underlying;
    IERC20 public immutable aToken;
    IAavePool public immutable pool;
    address public owner;

    // share 模型
    mapping(address => uint256) public shares;
    uint256 public totalShares;

    event Deposited(address indexed user, uint256 amount, uint256 mintedShares);
    event Withdrawn(address indexed user, uint256 amount, uint256 burnedShares);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _underlying, address _aToken, address _pool) {
        require(_underlying != address(0), "underlying required");
        require(_aToken != address(0), "aToken required");
        require(_pool != address(0), "pool required");

        underlying = IERC20(_underlying);
        aToken = IERC20(_aToken);
        pool = IAavePool(_pool);
        owner = msg.sender;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    /// @notice 金库当前总资产（含利息）= aToken 余额
    function totalUnderlying() public view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    /// @notice 查询某个用户当前对应的资产价值（根据 share 占比）
    function balanceOf(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        uint256 userShares = shares[user];
        if (userShares == 0) return 0;

        uint256 totalAssets = totalUnderlying();
        return (userShares * totalAssets) / totalShares;
    }

    /**
     * @notice 存入 underlying（USDT）到 AAVE
     * @dev 需要用户提前对本合约做 ERC20 approve
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "amount = 0");

        // 1. 把 USDT 从用户转到 vault
        bool ok = underlying.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");

        // 2. 授权给 Pool（只要不足就批量 approve 一次）
        uint256 allowanceNow = underlying.allowance(
            address(this),
            address(pool)
        );
        if (allowanceNow < amount) {
            require(
                underlying.approve(address(pool), type(uint256).max),
                "approve failed"
            );
        }

        // 3. 调用 AAVE supply，把资产存入借贷池，aUSDT 记在 vault 上
        uint256 beforeAssets = totalUnderlying();
        pool.supply(address(underlying), amount, address(this), 0);
        uint256 afterAssets = totalUnderlying();

        uint256 added = afterAssets - beforeAssets; // 理论上 ~= amount
        require(added > 0, "no asset added");

        // 4. 计算要分配给用户的 share 数量
        uint256 mintedShares;
        if (totalShares == 0 || beforeAssets == 0) {
            mintedShares = added;
        } else {
            // 新增资产 : 之前总资产 = 新增 share : 总 share
            mintedShares = (added * totalShares) / beforeAssets;
        }

        require(mintedShares > 0, "mintedShares = 0");

        shares[msg.sender] += mintedShares;
        totalShares += mintedShares;

        emit Deposited(msg.sender, added, mintedShares);
    }

    /**
     * @notice 赎回指定 share 对应的资产
     * @param shareAmount 要赎回多少 share（不是资产数量）
     */
    function withdraw(uint256 shareAmount) external {
        require(shareAmount > 0, "shareAmount = 0");
        require(shares[msg.sender] >= shareAmount, "insufficient shares");

        uint256 _totalShares = totalShares;
        uint256 _totalAssets = totalUnderlying();

        uint256 underlyingAmount = (shareAmount * _totalAssets) / _totalShares;
        require(underlyingAmount > 0, "amount=0");

        // 更新 share 记录
        shares[msg.sender] -= shareAmount;
        totalShares = _totalShares - shareAmount;

        // 从 AAVE 取回 underlying，直接发给用户
        uint256 withdrawn = pool.withdraw(
            address(underlying),
            underlyingAmount,
            msg.sender
        );
        require(withdrawn > 0, "withdraw failed");

        emit Withdrawn(msg.sender, withdrawn, shareAmount);
    }

    /// @notice 一键赎回自己所有 share
    function withdrawAll() external {
        uint256 userShares = shares[msg.sender];
        require(userShares > 0, "no shares");
        this.withdraw(userShares);
    }
}
