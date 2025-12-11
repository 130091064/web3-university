# Web3 University

一个基于区块链的去中心化在线教育平台，支持课程创建、购买、代币交易和资产管理。

## 📦 项目结构

```
web3-university/
├── contracts/          # 智能合约
├── awesome-frontend/   # 前端应用
└── worker/            # Cloudflare Worker 后端
```

## 🛠️ 技术栈

### 智能合约 (`contracts/`)

- **开发框架**: Hardhat 3.0
- **语言**: Solidity 0.8.28
- **库**: OpenZeppelin Contracts 5.4
- **工具链**: Viem 2.41, TypeScript 5.8
- **网络**: Sepolia 测试网

**核心合约**:
- `CourseMarketplace.sol` - 课程市场交易
- `YDToken.sol` / `YDSale.sol` - 平台代币
- `YdToUsdtSwap.sol` - 代币兑换
- `AaveVault.sol` - DeFi 资产管理
- `MockUSDT.sol` - 测试用 USDT

### 前端应用 (`awesome-frontend/`)

- **框架**: React 19.2 + TypeScript 5.9
- **构建工具**: Webpack 5 + SWC
- **路由**: React Router v7
- **样式**: Tailwind CSS 4.1
- **Web3**: Wagmi 3.0 + Viem 2.41
- **状态管理**: TanStack Query 5.90
- **代码质量**: Biome 2.3
- **测试**: Jest 30 + Cypress 15

**功能页面**:
- Dashboard - 仪表盘
- Courses - 课程浏览与购买
- Swap - 代币兑换
- Vault - 资产管理
- Me - 个人中心

### 后端服务 (`worker/`)

- **平台**: Cloudflare Workers
- **运行时**: Wrangler 4.53
- **语言**: TypeScript 5.5
- **存储**: Cloudflare KV
- **Web3**: Ethers.js 6.16
- **测试**: Vitest 3.2

**功能**:
- 用户资料签名验证
- KV 存储管理
- CORS 处理

## 🚀 快速开始

### 1. 智能合约部署

```bash
cd contracts
pnpm install
pnpm hardhat compile
# 配置 .env 文件
pnpm hardhat run scripts/deploy.ts --network sepolia
```

### 2. 前端开发

```bash
cd awesome-frontend
yarn install
yarn client:start  # 开发服务器
yarn client:prod   # 生产构建
```

### 3. Worker 部署

```bash
cd worker
pnpm install
pnpm dev      # 本地开发
pnpm deploy   # 部署到 Cloudflare
```

## 🔑 环境变量

### Contracts
```env
SEPOLIA_RPC_URL=your_rpc_url
SEPOLIA_PRIVATE_KEY=your_private_key
```

### Frontend
根据 `src/config/` 配置合约地址和网络参数

### Worker
通过 Wrangler 配置 KV 命名空间绑定

## 📄 License

MIT
