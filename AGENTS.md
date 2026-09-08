# 项目约定

- 本项目是 Next.js App Router / React / TypeScript 前端，对应 API 在 `../dogeow-api`。
- 使用 npm。功能代码放在 `app/` 对应模块，共享 UI、hooks、状态分别在 `components/`、`hooks/`、`stores/`。
- 远程数据使用 SWR 与 `lib/api/`，共享客户端状态使用 Zustand；认证沿用 `stores/authStore.ts` 和现有 API helpers。
- UI 沿用 Tailwind CSS / Radix 组件，表单使用 React Hook Form / Zod。
- 验证：`npm run type-check:app`（应用源码）、`npm run type-check`（含测试）、`npx eslint <修改文件>`、`npx vitest run <相关测试>`；构建使用 `npm run build`。
- 中文沟通。API 契约变更需检查对应后端与调用方。
