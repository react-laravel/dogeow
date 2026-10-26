# 技术栈

## 前端

- React + [Next.js](https://nextjs.org) 15
- [shadcn](https://ui.shadcn.com/)（UI） + Tailwind CSS
- Zustand（状态管理） + Immer（辅助）
- Zod（字段验证）
- react-hook-form（表单填写）
- (Lucide)[https://lucide.dev/]（图标）
- Canvas / Three.js
- SWR
- React DnD（拖放）
- Sentry (错误跟踪)
- Husky + lint-staged (Git钩子)
- GitHub Actions(自动化流程)

## 后端

大致使用：

- [Laravel](https://laravel.com/) + [Reverb](https://laravel.com/docs/12.x/reverb)（WebSocket）

其他请查看仓库，地址 https://github.com/react-laravel/dogeow-api

## 编写本代码时的规范

- 保存时自动格式化代码（Prettier）+ 提交代码时 ESLint 检查 + 推送时 TypeScript 检查
- 不 "AnyScript"、不 「// eslint-disable-next-line @typescript-eslint/no-explicit-any」注释。

> 这是目标（部分代码可能还没有改正）

## 构建与分析

```bash
npm ci                  # 安装锁定依赖
npm run build           # 生产构建 (next build)
npm run analyze         # 生成 bundle 分析报告 (next experimental-analyze)
```

## Next frontend on server C

`next.dogeow.com` now runs on `120.26.21.64`. The Laravel
API, database, Redis and existing self-hosted build runner stay on server A.
The frontend workflow builds with Node 24.16.0 and the existing npm lockfile,
then uploads only a standalone runtime with current static/public assets.
The application still enforces npm; this migration does not change package
manager or resolve new dependency versions. No build runs on the 2 GiB server.

Required repository Secrets: `C_DEPLOY_SSH_KEY`, `C_DEPLOY_KNOWN_HOSTS` and the
existing `SENTRY_AUTH_TOKEN` (optional source-map upload). On the runner,
`/var/lib/main-sites-ci/dogeow-next.env` contains only `NEXT_PUBLIC_*` build
settings. The workflow rejects non-public assignments and removes the temporary
`.env.production.local` after packaging. No server API keys, Codex authentication,
`.env*`, `.knowledge`, caches or logs are uploaded in the runtime bundle.

C's private runtime environment, Codex authentication and mutable knowledge data
are managed in separate protected/shared paths. They must not be overwritten by
new releases. The restricted server helper accepts only:

```bash
sudo -n /usr/local/sbin/deploy-main-sites dogeow-next FULL_COMMIT_SHA
```

It activates the incoming release, validates service health, and only then
removes the previous release. A failed health check restores the previous
current link. The intended runtime uses the shared private environment and a
512 MiB Node heap limit; server cgroup limits are configured outside Git.

Manual workflow dispatch defaults to validation only. Normal pushes to main
publish to C; `scripts/deploy-to-c.sh --check-only` only checks SSH and the two
HTTPS hosts/assets directly on C without publishing. The old `deploy.php`
localhost/PM2 recipe exits, preventing accidental restart on A.

The previous recipe/workflow automatically invoked `notify:deploy` in the API
on A. This is no longer an implicit frontend deployment side effect. Existing
API notification functionality is retained on A and can be invoked explicitly
by its operator; this migration does not move the API or send site-wide notices.

The old `scripts/deploy-zero-downtime.sh` and `scripts/first-deploy.sh` are also
retired entrypoints, so manual use cannot recreate a second A release or PM2
instance. The active deployment path is the C workflow/client/helper above.
