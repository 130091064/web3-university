# Awesome Frontend

一个基于 React + TypeScript + Webpack 的 Web3 课程平台前端项目。

## 🚀 快速开始

```bash
# 1. 安装依赖
yarn install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入真实的 API Key

# 3. 开发环境启动（带热重载）
yarn client:start

# 4. 构建生产环境
yarn client:prod
```

## 📁 项目结构

```
src/
├── assets/              # 静态资源（图片、字体等）
├── components/          # 可复用组件
│   ├── common/         # 通用组件（如 LearningFlowBar）
│   ├── course/         # 课程相关组件（CourseCard、CourseList、CreateCourseForm）
│   ├── wallet/         # 钱包相关组件（WalletSection、BuyYDPanel）
│   └── layout/         # 布局组件（Header、LoadingSpinner、FullScreenLoader）
├── config/              # 配置文件
│   ├── app.ts          # 应用配置
│   └── wagmi.ts        # Web3 配置
├── contracts/           # 智能合约相关
│   ├── abis/           # 合约 ABI（courseMarketplace、aaveVault、ydToken 等）
│   ├── addresses.ts    # 合约地址
│   └── index.ts        # 统一导出
├── hooks/               # 全局自定义 Hooks
│   ├── useCourses.ts           # 课程列表管理
│   ├── usePurchasedCourses.ts  # 已购课程管理
│   ├── useProfile.ts           # 用户资料管理
│   ├── useVaultAssets.ts       # 金库资产数据
│   ├── useWalletStatus.ts      # 钱包状态检测
│   └── useWaitForTransaction.ts # 交易确认封装
├── layouts/             # 页面布局模板
│   └── MainLayout.tsx
├── navigation/          # 导航配置
│   └── navItems.ts
├── pages/               # 页面组件（每个页面独立目录）
│   ├── Courses/        # 课程页面
│   │   └── CoursesPage.tsx
│   ├── Dashboard/      # 仪表盘
│   │   └── DashboardPage.tsx
│   ├── Me/             # 个人中心
│   │   ├── components/ # 页面专属组件
│   │   │   ├── WalletInfoCard.tsx           # 钱包信息卡片
│   │   │   ├── ProfileCard.tsx              # 昵称签名卡片
│   │   │   ├── PurchasedCoursesList.tsx     # 已购课程列表
│   │   │   └── ProfileSignatureDisplay.tsx  # 签名信息展示
│   │   └── MePage.tsx
│   ├── Swap/           # 代币兑换
│   │   └── SwapPage.tsx
│   └── Vault/          # 金库管理
│       ├── components/ # 页面专属组件
│       │   ├── VaultStats.tsx      # 金库统计卡片
│       │   ├── DepositForm.tsx     # 存入表单
│       │   └── WithdrawForm.tsx    # 取出表单
│       └── VaultPage.tsx
├── router/              # 路由配置
│   └── routes.tsx
├── types/               # TypeScript 类型定义
│   ├── course.ts       # 课程相关类型
│   ├── user.ts         # 用户相关类型
│   └── index.ts        # 统一导出
├── utils/               # 工具函数
│   ├── format.ts       # 格式化工具（formatTokenAmount、formatDateTime 等）
│   ├── validation.ts   # 验证工具（isHttpUrl、isValidAddress）
│   └── index.ts        # 统一导出
├── App.tsx              # 应用根组件
├── main.tsx             # 应用入口
├── index.css            # 全局样式
└── env.d.ts             # 环境变量类型定义
```

## 📝 目录结构约定

### **Components 组件规范**

- `common/` - 通用组件，可在多个页面复用（如 LearningFlowBar）
- `course/` - 课程业务相关组件
- `wallet/` - 钱包功能相关组件
- `layout/` - 布局组件（Header、Footer 等）

**命名规范**：
- 组件文件使用 PascalCase：`CourseCard.tsx`
- 组件导出优先使用命名导出：`export const CourseCard = ...`
- 默认导出仅用于页面级组件

### **Pages 页面规范**

- 每个页面放在独立目录下
- 主文件命名为 `[PageName]Page.tsx`
- 如果页面逻辑复杂，可在页面目录下创建：
  - `components/` - 页面专属组件
  - `hooks/` - 页面专属 Hooks
  - `utils/` - 页面专属工具函数

**实际示例：**
```
pages/
├── Me/
│   ├── components/          # 个人中心专属组件
│   │   ├── WalletInfoCard.tsx
│   │   ├── ProfileCard.tsx
│   │   └── PurchasedCoursesList.tsx
│   └── MePage.tsx           # 主页面
└── Vault/
    ├── components/          # 金库专属组件
    │   ├── VaultStats.tsx
    │   ├── DepositForm.tsx
    │   └── WithdrawForm.tsx
    └── VaultPage.tsx        # 主页面
```

### **Types 类型规范**

- 所有全局类型统一在 `src/types/` 目录管理
- 按业务模块拆分文件：`course.ts`、`user.ts` 等
- 通过 `src/types/index.ts` 统一导出
- 使用 `@types` 路径别名导入：`import type { Course } from '@types'`

### **Hooks 规范**

- 全局 Hooks 放在 `src/hooks/` 目录
- 页面专属 Hooks 放在对应页面目录下
- Hooks 命名以 `use` 开头：`useCourses.ts`

**已实现的全局 Hooks：**
- `useCourses` - 课程列表数据获取和管理
- `usePurchasedCourses` - 已购课程查询
- `useProfile` - 用户资料管理（本地 + 远程同步）
- `useVaultAssets` - 金库资产数据和自动刷新
- `useWalletStatus` - 钱包连接状态统一检测
- `useWaitForTransaction` - 交易确认封装（替代重复的 waitForTransactionReceipt）

### **Utils 工具函数规范**

工具函数按功能分类在 `src/utils/` 目录：

**`format.ts` - 格式化工具：**
- `formatTokenAmount(value, decimals)` - 代币金额格式化（保留 4 位小数，去除多余 0）
- `formatDateTime(timestamp)` - 时间戳格式化为可读日期时间
- `formatPercentage(value, decimals)` - 百分比格式化
- `shortenAddress(address)` - 地址缩短显示（0x1234...5678）

**`validation.ts` - 验证工具：**
- `isHttpUrl(url)` - 验证是否为有效 HTTP/HTTPS URL
- `isValidAddress(address)` - 验证以太坊地址格式

### **路径别名**

项目配置了以下路径别名（在 `tsconfig.json` 和 `webpack.config.js` 中）：

```typescript
@components  → src/components
@contracts   → src/contracts
@pages       → src/pages
@config      → src/config
@hooks       → src/hooks
@layouts     → src/layouts
@utils       → src/utils
@assets      → src/assets
@types       → src/types
```

**使用示例**：
```typescript
import { CourseCard } from '@components/course/CourseCard';
import type { Course } from '@types';
import { useCourses } from '@hooks/useCourses';
```

## 🔧 技术栈

- **框架**: React 19 + TypeScript 5
- **构建工具**: Webpack 5 + SWC
- **样式**: Tailwind CSS 4
- **Web3**: Wagmi 3 + Viem 2
- **代码质量**: Biome (Linter + Formatter)
- **测试**: Jest + Cypress

## 🛠️ 开发脚本

```bash
# 开发服务器
yarn client:start        # 启动开发服务器（热重载）

# 构建
yarn client:dev          # 构建开发版本
yarn client:prod         # 构建生产版本

# 代码质量
yarn lint                # 检查代码规范
yarn lint:fix            # 自动修复代码问题
yarn format              # 检查代码格式
yarn format:fix          # 自动格式化代码
yarn check               # 同时检查规范和格式
yarn check:fix           # 自动修复所有问题

# 测试
yarn test                # 运行单元测试（带覆盖率）
yarn test:e2e            # 运行 E2E 测试
```

## 🌐 环境变量

### 快速开始

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件并填入真实值：

```env
# Infura Sepolia 测试网 RPC URL
VITE_INFURA_SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# 用户资料 API 基础 URL
VITE_PROFILE_API_BASE_URL=https://your-profile-api.example.com
```

### 说明
- `.env` 文件已在 `.gitignore` 中忽略，不会提交到版本控制
- `.env.example` 是环境变量模板，方便团队成员快速配置
- **环境变量类型定义** 在 `src/env.d.ts` 中维护

## 📦 Webpack 优化

项目已配置以下优化：

### 构建性能优化
- ✅ **持久化缓存** - 二次构建速度提升 50-90% (`cache: { type: 'filesystem' }`)
- ✅ **SWC 编译器** - 比 Babel 快 20-70 倍
- ✅ **并行压缩** - CSS/JS 多线程压缩

### 包体积优化
- ✅ **Tree Shaking** - 自动移除未使用代码 (`usedExports: true` + `sideEffects`)
- ✅ **细粒度 Code Splitting** - 智能分包策略
  - `vendors` - 第三方库公共包
  - `web3-libs` - Web3 相关库独立打包（Viem、Wagmi、TanStack）
  - `commons` - 复用的业务组件/Hooks/工具函数
  - `styles` - CSS 单独提取
- ✅ **生产环境移除 console** - 自动移除所有 console.log/warn/error
- ✅ **CDN Externals** - React/ReactDOM/React Router 使用 CDN（生产环境）

### 调试和安全
- ✅ **Source Map 优化** 
  - 开发环境：`eval-source-map`（快速重建）
  - 生产环境：`hidden-source-map`（安全，不暴露源码）
- ✅ **环境变量注入** - 支持 `process.env.NODE_ENV` 条件编译

### 预期收益
- 📦 包体积减少 **40-60%**
- ⚡ 首屏加载速度提升 **30-50%**
- 🔒 安全性提升（移除调试信息、隐藏源码）

## 📚 代码规范

### **导入顺序**

1. 第三方库（React、viem 等）
2. 路径别名导入（@components、@hooks 等）
3. 相对路径导入（./、../）

**示例**：
```typescript
// ✅ 正确
import { useState } from 'react';
import { formatUnits } from 'viem';
import { CourseCard } from '@components/course/CourseCard';
import type { Course } from '@types';
import { formatDateTime } from './utils';

// ❌ 错误（顺序混乱）
import type { Course } from '@types';
import { useState } from 'react';
import { formatDateTime } from './utils';
```

### **类型定义优先级**

1. 优先使用 `src/types/` 中的全局类型
2. 页面/组件专属类型定义在文件内
3. 避免在多个文件重复定义相同类型

## 🚀 性能和代码质量建议

### 已实现的优化
- ✅ 图片资源小于 8KB 自动内联为 Base64
- ✅ 使用 `React.lazy()` 实现路由懒加载
- ✅ 生产环境启用 CSS/JS 压缩和 Tree Shaking
- ✅ 大型页面组件已拆分（MePage: 530行 → 200行，VaultPage: 341行 → 150行）
- ✅ 业务逻辑提取到自定义 Hooks
- ✅ 重复代码提取到 utils 工具函数

### 开发建议
- ⚠️ 避免在 `components/` 根目录直接放置组件，按业务分类
- ⚠️ 页面组件超过 300 行时考虑拆分为子组件
- ⚠️ 重复使用 3 次以上的代码应提取为工具函数或 Hook
- ⚠️ 生产环境避免使用 `console.log`（已自动移除）

### 组件拆分示例

**MePage (个人中心) - 已拆分为 4 个子组件：**
- `WalletInfoCard` - 钱包信息展示
- `ProfileCard` - 昵称签名表单
- `PurchasedCoursesList` - 已购课程列表
- `ProfileSignatureDisplay` - 签名信息展示

**VaultPage (金库) - 已拆分为 3 个子组件：**
- `VaultStats` - 资产统计卡片
- `DepositForm` - 存入表单
- `WithdrawForm` - 取出表单

## 📖 更多文档

- [Wagmi 文档](https://wagmi.sh/)
- [Viem 文档](https://viem.sh/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Biome 文档](https://biomejs.dev/)

## 📄 License

MIT
