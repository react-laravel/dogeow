# 部署指南（Deployer + GitHub Actions Self-hosted Runner）

本文描述如何用 [Deployer](https://deployer.org) 对 `dogeow` 做零停机部署，触发方式是推送 `main` 自动跑。

---

## 1. 为什么改成 Deployer

- 保留 `releases/`、`current` 软链切换的零停机模型
- 内置 `rollback`、`deploy:unlock`、`cleanup` 等运维能力
- 工作流不再依赖服务器上的固定 Git 工作树先 `git pull`
- 代码来源直接复用 GitHub Actions checkout 工作区，避免部署阶段再二次 clone

旧脚本 `scripts/deploy-zero-downtime.sh` 暂时保留，作为迁移过渡期回退方案。

---

## 2. 目录约定

服务器上部署根目录（默认 `/example/dogeow`，可通过 `APP_ROOT` 或 `DEPLOY_PATH` 改）结构：

```plaintext
/example/dogeow/
├── .dep/                 Deployer 内部状态（锁、历史）
├── current/              -> releases/<timestamp>
├── releases/
│   ├── 20260419183000/
│   └── 20260420090000/
├── logs/                 PM2 日志（shared 软链）
├── .env.local            服务器本地配置（可选）
├── .env.production       服务器本地配置（可选）
└── .npmrc                私有源配置（可选）
```

- Nginx / 反向代理指向 `current`
- PM2 的 `cwd` 指向 `current`
- 每次发布会先构建 release，完成后再切换 `current`
- 若部署根目录存在 `.env*` 或 `.npmrc`，会在发布时自动覆盖到新 release，兼容旧脚本

---

## 3. 前置条件

### 3.1 服务器软件

- Node.js 24、npm 10+
- GitHub self-hosted runner
- PM2
- Nginx 或其他反向代理

### 3.2 PM2

`ecosystem.config.js` 已配置：

- 应用名：`dogeow-nextjs`
- 启动命令：`npm run start`
- `cwd` 优先使用 `PM2_CWD`，因此 Deployer 切换 `current` 后可直接 reload

验证命令：

```bash
pm2 status
pm2 info dogeow-nextjs
```

### 3.3 writable 权限模式

当前 `deploy.php` 显式使用 `chmod` 处理 writable 目录，不依赖 `setfacl` / ACL 工具。

原因：

- 常见 ECS / 精简 Linux 镜像默认没有安装 `acl`
- Deployer 默认优先尝试 ACL，缺少 `setfacl` 时会在 `deploy:writable` 失败

### 3.4 首次部署准备

如果是从旧脚本迁移，部署根目录可以直接复用，不需要先删库重建。

建议先确认：

```bash
mkdir -p /example/dogeow
mkdir -p /example/dogeow/logs
```

如果服务器本地有这些配置文件，请继续保留在部署根目录：

```bash
/example/dogeow/.env.local
/example/dogeow/.env.production
/example/dogeow/.env.production.local
/example/dogeow/.npmrc
```

Deployer 每次发布时会自动把这些文件复制到新 release。

---

## 4. GitHub Secrets

仓库 Settings → Secrets and variables → Actions 配置：

| Secret 名  | 值示例            | 说明             |
| ---------- | ----------------- | ---------------- |
| `APP_ROOT` | `/example/dogeow` | 部署根目录       |
| `PM2_APP`  | `dogeow-nextjs`   | PM2 应用名，可选 |

说明：

- 为兼容旧工作流，仍使用 `APP_ROOT`
- 如果不提供 `PM2_APP`，默认使用 `dogeow-nextjs`

---

## 5. 自动部署流程

`.github/workflows/deploy-self-hosted.yml` 已配置：

1. 推送 `main` 或手动点 "Run workflow" 触发
2. Runner checkout 仓库
3. 下载 / 复用 `~/.deployer/dep.phar`
4. 执行 `dep deploy production -v`
5. Deployer 依次：同步当前工作区到 release → 复制服务器本地配置 → `npm ci` → `npm run build` → 切换 `current` → `pm2 reload`

全程 `current` 直到最后一刻才切换，因此 HTTP 请求不中断。

---

## 6. 手动命令

```bash
dep deploy production
dep rollback production
dep deploy:unlock production
dep releases production
```

如果是手动执行，请先确保当前目录已经是目标提交对应的项目工作树。

---

## 7. 故障排查

| 现象                   | 排查                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| `Deploy is locked`     | 执行 `dep deploy:unlock production`                                    |
| `deploy:writable` 失败 | 确认 `deploy.php` 已使用 `chmod` 模式                                  |
| `npm ci` 失败          | 检查 Node / npm 版本，以及服务器本地 `.npmrc`                          |
| `next build` 失败      | 在 release 目录手动执行 `npm run build` 复现                           |
| `pm2 reload` 失败      | `pm2 logs dogeow-nextjs`、`pm2 status`                                 |
| 页面没更新             | `readlink /example/dogeow/current` 确认 `current` 是否已切到新 release |

查看本次部署详细输出：

```bash
dep deploy production -vvv
```
