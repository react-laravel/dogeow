# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供前端项目开发指导。

## 项目概述

这是一个基于 Next.js 16 的个人效率平台前端，与 `dogeow-api`（Laravel 13）配合使用。

### 技术栈

- **框架**: Next.js 16（App Router）、React 19、TypeScript（严格模式）
- **UI**: Tailwind CSS、Shadcn UI（Radix UI）、Lucide React 图标、Framer Motion
- **状态管理**: Zustand（优先于 React Context）
- **数据获取**: SWR（优先于 fetch/axios）
- **表单**: React Hook Form + Zod 校验
- **实时通信**: Laravel Echo + Pusher.js
- **编辑器**: Novel / TipTap
- **其他**: date-fns、Sonner、@dnd-kit

### 开发命令

```bash
npm run dev              # 启动开发服务器
npm run build            # 生产构建
npm run lint             # 运行 ESLint
npm run type-check       # TypeScript 类型检查
npm run format           # 用 Prettier 格式化
npm run check-all        # 运行 type-check、lint 和 format check
npm run fix-all          # 格式化、lint 修复和类型检查
npm run test             # 运行 Vitest 测试
npm run test:watch       # 监听模式运行测试
npm run test:coverage    # 生成测试覆盖率报告
```

### 架构

#### 基于功能的目录结构

代码按功能模块组织在 `app/` 目录下：

- `app/note/` - Novel/TipTap 编辑器笔记（stores、components、hooks、utils）
- `app/file/` - 文件管理（store、components）
- `chat/` / `game/` / `rpg/` - 已拆为独立前端；中央站对应路由负责跳转
- `app/word/` - 单词学习
- `app/thing/` - 物品/地点管理
- `app/nav/` - 导航管理
- `app/todos/` - 待办任务
- `app/book/` - 书籍
- `app/ai/` - AI 功能

每个功能模块通常包含：

- `components/` - React 组件
- `stores/` 或 `store/` - Zustand stores
- `hooks/` - 自定义 React hooks
- `utils/` 或 `api.ts` - 工具函数和 API 调用

#### 共享资源

- `lib/api/` - 集中式 API 客户端，含错误处理和 SWR 集成
- `lib/store/` - 共享 Zustand stores（auth、theme、settings）
- `lib/helpers/` - 工具函数
- `lib/websocket/` - Laravel Echo WebSocket 配置
- `lib/i18n/` - 多语言国际化
- `components/` - 共享 UI 组件
- `app/configs.tsx` - 全局配置（tiles、games、themes）

#### API 集成

- 所有 API 调用使用 `lib/api/index.ts` 中的集中式函数
- 基础 URL: `process.env.NEXT_PUBLIC_API_URL`（默认 `http://localhost:8000`）
- 认证: 来自 Zustand auth store 的 Bearer token
- 错误处理: 自动错误标准化和 toast 通知
- HTTP 方法: `get()`、`post()`、`put()`、`patch()`、`del()`、`uploadFile()`
- SWR 集成: `useUser()` hook 获取用户数据，`createMutation()` 用于变更操作

#### 状态管理模式

- 所有状态管理使用 Zustand
- Store 文件命名为 `*Store.ts` 或 `*store.ts`
- 示例: `authStore`、`messageStore`、`editorStore`、`connectionStore`
- Store 在单个对象中包含 state 和 actions

#### 实时通信

- 通过 Laravel Echo + Pusher.js 使用 WebSocket
- 配置在 `lib/websocket/`
- 主要用于聊天功能的实时消息

### 代码规范

- **TypeScript**: 严格模式，显式类型，清晰处使用类型推断
- **组件**: 带 hooks 的函数组件，性能关键处使用 `React.memo`
- **样式**: Tailwind CSS 类，默认 Flexbox（复杂布局才用 Grid）
- **状态**: Zustand 优先于 Context API
- **数据获取**: SWR 优先于 fetch/axios
- **文件大小**: 保持组件专注且可读
- **导入**: 使用 `@/` 路径别名进行绝对导入
- **ESLint**: 绝不使用 `eslint-disable-next-line` 注释 — 修复实际问题
