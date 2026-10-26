# C 发布不再依赖 A

构建运行在 GitHub 的 `ubuntu-24.04`，使用固定 Node 24.16.0 和 npm 锁文件。C 只接收既有脚本生成的 standalone 运行包；不安装开发依赖、构建工具、Codex 或模型。

运行环境及知识库状态仍由 C 独立保管，不进入运行包。公共构建设置由 GitHub 加密 Secret `C_NEXT_PUBLIC_BUILD_ENV` 提供，只允许现有四个 `NEXT_PUBLIC_*` 赋值；其值不写入日志。`SENTRY_AUTH_TOKEN` 使用原 Secret。

`C_DEPLOY_SSH_KEY` 应轮换为仅允许 `dogeow-next` 的专用密钥；C 固定 host key 继续由 `C_DEPLOY_KNOWN_HOSTS` 校验。新 key 的强制入口为 `main-sites-ssh-gateway dogeow-next`，只能检查、上传和发布 Next，对其他项目无权限。GitHub 托管构建机不使用 A 的固定来源 IP；扩大来源范围及轮换密钥须获用户批准后执行。

首次 `workflow_dispatch` 保持 `validate_only=true`，验证真实构建、运行包、受限 SSH 和 C 的合法证书/页面/资源。批准发布后，Next 才可用 `validate_only=false` 发布同一业务版本。现有 C 发布程序在健康检查成功后只保留当前一版，公共资源兼容池及 C 私密运行配置不变。

退役 A 之前，必须在 GitHub 托管构建机完成真实发布和公网验证，再撤销 C 上旧 A 来源的共享 key，以及 A 旧构建设置/工作区。本文档不表示这些步骤已执行。
