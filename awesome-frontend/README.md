# Awesome Frontend

基于 React + TypeScript + Web3 的去中心化课程平台前端项目。

## 🚀 快速开始

```bash
# 安装依赖
yarn install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
yarn client:start

# 构建生产版本
yarn client:prod
```

## 📁 项目结构

```
src/
├── components/          # 组件库
│   ├── common/         # 通用组件（Toast、TokenInput、ConfirmDialog等）
│   ├── course/         # 课程组件
│   ├── wallet/         # 钱包组件
│   └── layout/         # 布局组件
├── pages/              # 页面组件
│   ├── Courses/        # 课程市场
│   ├── Dashboard/      # 仪表盘
│   ├── Me/             # 个人中心
│   ├── Swap/           # 资产兑换
│   └── Vault/          # 理财金库
├── hooks/              # 全局Hooks
├── contracts/          # 智能合约ABI
├── utils/              # 工具函数
├── types/              # 类型定义
└── config/             # 配置文件
```

## 🔧 技术栈

- **React 19** + **TypeScript 5** - 现代化前端框架
- **Tailwind CSS 4** - 原子化CSS框架
- **Wagmi 3** + **Viem 2** - Web3钱包集成
- **Webpack 5** + **SWC** - 构建工具（持久化缓存 + 快速编译）
- **Biome** - 代码检查和格式化

## 🛠️ 常用命令

```bash
# 开发
yarn client:start        # 开发服务器（热重载）
yarn client:dev          # 构建开发版本
yarn client:prod         # 构建生产版本

# 代码质量
yarn check:fix           # 自动修复代码问题
yarn lint:fix            # 修复代码规范
yarn format:fix          # 格式化代码

# 测试
yarn test                # 单元测试
yarn test:e2e            # E2E测试
```

## 🌐 环境变量

```env
# Infura Sepolia RPC
VITE_INFURA_SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# 用户资料API
VITE_PROFILE_API_BASE_URL=https://your-api.example.com
```

## 📝 开发规范

### 路径别名
```typescript
@components  → src/components
@hooks       → src/hooks
@utils       → src/utils
@types       → src/types
@contracts   → src/contracts
```

### 核心Hooks
- `useCourses` - 课程列表管理
- `useVaultAssets` - 金库资产数据
- `useWalletStatus` - 钱包状态检测
- `useTransactionHistory` - 交易历史记录
- `useAutoRefresh` - 自动刷新机制

### 工具函数
- `formatTokenAmount` - 代币金额格式化
- `formatErrorMessage` - 友好错误提示
- `isUserRejected` - 检测用户取消交易
- `shortenAddress` - 地址缩短显示

## ✨ 核心功能

- ✅ 课程市场（创建/购买/查看）
- ✅ 资产兑换（YD ⇄ USDT）
- ✅ 理财金库（存入/取出，自动计息）
- ✅ 个人中心（昵称签名、已购课程）
- ✅ 交易历史（localStorage持久化）
- ✅ 友好错误提示（自动识别用户取消）
- ✅ 自动刷新（30秒间隔）

## 📦 构建优化

- 持久化缓存（二次构建提速 50-90%）
- Tree Shaking（自动移除未使用代码）
- Code Splitting（智能分包）
- 生产环境移除 console
- Source Map 安全配置

## 📄 License

MIT
