# DogeOW 前后端改进与验证记录

日期：2026-09-08。范围：`dogeow` 和同级 `dogeow-api`。改动留在工作区，未部署。

## 项目维护

- 移除两个项目的 `.trellis`、Trellis skills、agents、hooks，以及对应的 Git 属性规则。
- 两份 `AGENTS.md` 均精简为 8 行，保留项目关系、实际技术约定和验证命令。
- 保留 API 项目的 Laravel Boost MCP 配置。
- 关闭 Next.js 16.3 的 `agentRules` 自动追加功能，避免重新扩张 `AGENTS.md`。
- 本轮期间前端 HEAD 从 `599943fa8` 更新到 `17f265263`（另含 `e7f2a23c8`）。保留合入的业务改动，仅备份并移除其重新带入的任务文件。
- 原项目配置已备份到 `/private/tmp/dogeow-project-config-backup-20260908-011205`。

## 功能、交互与一致性修复

| 问题                                      | 修复后的行为                                                             | 主要代码                                              |
| ----------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| 成功或失败的 API 请求遗留超时任务         | 无论成功、失败、超时都清理计时器                                         | `lib/api/core.ts`                                     |
| 损坏的 XSRF Cookie 导致 URIError          | 将非法编码视为缺失，重新获取 Cookie                                      | `lib/api/browser-request.ts`                          |
| 自定义本地端口把 API 请求发回前端         | loopback 访问遵循显式 API 地址；继续支持现有 Tailscale 映射              | `lib/api/url.ts`                                      |
| IP 正则误认普通主机名和无效地址           | 校验 IPv4 范围，使用 URL 解析校验 IPv6                                   | `lib/api/url.ts`                                      |
| 文件搜索中的 `&`、`+`、`#` 改写查询参数   | 用 URLSearchParams 编码搜索和排序参数                                    | `app/file/hooks/useFileManagement.ts`                 |
| 网格文件复选框始终显示未选中              | 与 Zustand 选择状态同步                                                  | `app/file/components/views/GridView.tsx`              |
| 文件变更未刷新默认根目录、目录树和统计    | 三个操作 hook 共享完整的缓存匹配函数                                     | `app/file/services/cache.ts`                          |
| 保存失败仍关闭编辑弹窗，重复点击重复提交  | 失败保留草稿；保存中阻止重复提交及关闭；成功后关闭                       | `app/file/hooks/useFileEdit.ts`、`EditFileDialog.tsx` |
| 独立重命名 hook 调用不存在的路由          | 改用已注册的 `PATCH /cloud/files/{id}`                                   | `app/file/hooks/useFileOperations.ts`                 |
| 仅改名称时清空原描述                      | 未传描述则保留，显式 null 仍可清空                                       | API `Cloud/FileController.php`                        |
| 部分删除失败后丢失待重试选择              | 仅移除成功删除的 ID，保留失败项和期间新增的选择                          | `app/file/hooks/useFileOperations.ts`                 |
| 上传控件嵌套在按钮内，键盘操作不一致      | 独立隐藏 input，由可聚焦按钮触发文件选择                                 | `app/file/components/FileHeader.tsx`                  |
| JSON 和空文本无法预览、换图后沿用失败状态 | 原样展示 JSON、显示空文件提示、切换图片重置失败状态                      | `PreviewContent.tsx`                                  |
| 禁用导航及链接按钮只依赖 CSS              | 移除禁用导航的跳转能力；阻止禁用链接按钮的鼠标和键盘操作；标记 aria 状态 | `BottomNav.tsx`、`button.tsx`                         |
| 云盘排序字段和搜索类型异常导致服务器错误  | Form Request 校验，返回 422                                              | API `Cloud/ListFilesRequest.php`                      |
| 混合所有者的批量移动被静默部分执行        | 校验整批源文件所有权、重复 ID、空批次和目标字段，非法批次全部拒绝        | API `Cloud/MoveFilesRequest.php`                      |
| 非法标签在笔记写入后才报错                | 创建和更新之前校验标签数组、元素与长度，标签不进入模型字段更新           | API `NoteRequest.php`、`UpdateNoteRequest.php`        |
| 编辑器缺少显式 SSR 配置                   | 设置 `immediatelyRender={false}`，避免 SSR hydration 警告                | `components/novel-editor/index.tsx`、`readonly.tsx`   |
| SQLite 笔记列表调用不支持的 LEFT          | 改用 PostgreSQL、MySQL、SQLite 支持的 SUBSTR；详情保留全文               | API `Note/NoteController.php:52`                      |
| 图谱结果顺序随数据库变化                  | 节点和链接按 ID 稳定排序                                                 | API `Note/NoteController.php`                         |

## 安全检查

### S1：混合凭据缓存隔离（高优先级，已修复）

位置：`dogeow/app/api/_lib/auth-guard.ts:155`，以及管理员和 AI guard。

原实现同时转发 Cookie 与 Bearer，却只按 Bearer 缓存后端返回的身份。当后端按 Cookie 认证时，该会话身份可能被错误绑定到同时提供的 Token 上。现在带 Cookie 的请求既不读取也不写入 Token 缓存；纯 Token 缓存保持 30 秒有效期并限制为 1000 项。回归测试覆盖 Cookie 身份与任意 Token 的混用，以及已有 Token 缓存和另一会话并存的情形。

这是有前置条件的风险分析，未在生产环境尝试利用。Sanctum 的认证顺序参见[官方实现](https://github.com/laravel/sanctum/blob/4.x/src/Guard.php)。

### S2：Cookie 写请求的来源校验（高优先级，已修复）

位置：`dogeow/app/api/_lib/auth-guard.ts:31`。

三个 guard 都拒绝跨站、无效或缺失 Origin 的 Cookie 写请求。合法的 Cookie 验证请求向 Laravel 转发当前应用来源，以便 Sanctum 启用会话中间件；后端验证显式 `no-store`，拒绝重定向。非浏览器调用方如发送 Cookie 写请求，也必须提供本站 Origin。参见 [Next.js 认证指南](https://nextjs.org/docs/app/guides/authentication)。

### S3：认证响应验证（防御性加固，已完成）

位置：`dogeow/app/api/_lib/auth-guard.ts`。

拒绝非 Bearer 认证方案、缺失或非正整数用户 ID；字符串 `false` 不再被转换为管理员权限。保留既有 API 响应封装兼容性。测试覆盖异常响应和权限拒绝。

### S4：依赖安全公告（已修复）

- 前端初始 57 项告警、上一轮剩余 37 项；当前 **npm audit 为 0**。
- API 涉及 14 个包的 43 条安全公告已清零；本次复核 **composer audit 为 0**。
- 已移除 Novel、Tiptap 2 和 `tiptap-markdown`，编辑器统一使用官方 Tiptap 3.31.3 组件，依赖树减少 107 个包。
- 已删除临时 `patch-tiptap-v2.mjs`，安装流程不再需要旧编辑器安全补丁。
- 菜单采用 Floating UI，Markdown 使用 `@tiptap/markdown`；图片使用原生缩放能力并补齐触控手柄样式。[Tiptap 官方迁移指南](https://tiptap.dev/docs/guides/upgrade-tiptap-v2)
- 保留 `math`、`twitter`、`ai-highlight` 旧 JSON 节点与原有草稿键名；兼容层位于 `components/novel-editor/runtime/`，保留来源说明与 Apache-2.0 许可证。

## 本次追加修复

| 项目                    | 结果                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 39 个历史失败测试       | 全部修复；纠正 Zustand/SWR mock、旧接口参数和已移除语言的断言，保留有效行为覆盖                                |
| 233 个类型诊断          | 全部清零；补齐真实类型的测试 fixture，修复错误导入、DOM mock、缺失参数和边界输入类型，没有添加类型检查跳过规则 |
| 语言状态一致性          | 语言列表、图标和缓存校验统一为当前支持的语言；旧缓存不能恢复无效选项，原型属性不被误认为语言代码               |
| 单词 AI 默认模型        | 使用已有共享 Codex 默认配置，避免单词模块常量与实际模型选择不一致                                              |
| 复制行为                | 仅序列化本编辑器选区，移除重复的全局复制监听与正文日志；支持 Markdown 粘贴和公式往返                           |
| 即时保存                | JSON、Markdown 与 HTML 草稿同步更新，立即点击保存也包含最后输入的内容                                          |
| 编辑器兼容              | 旧公式、图片尺寸和高亮数据保留；关闭 AI 菜单只清理临时 AI 标记，不清除用户高亮                                 |
| 图片交互                | 缩放手柄具备 24px 触控区域；实际拖动后的宽高写回 JSON 并提交 API                                               |
| PostgreSQL 云盘统计 500 | CASE 字符串改为绑定参数，避免双引号被解析为列名；统计与筛选兼容大写扩展名和 Apple 文档                         |
| 私有通知频道 403        | 正确注册项目 BroadcastServiceProvider；测试环境也加载权限规则，验证只能授权自己的频道                          |
| 历史公开文件            | 新增可预演、可重试的私有盘迁移命令，验证复制失败、内容冲突和非法路径都保留原件                                 |

菜单渲染也已调整为合并后的微任务，避免 React 生命周期或热更新中的 `flushSync` 重入；关闭菜单会取消待执行渲染，相关 3 项生命周期测试通过。

## 验证证据

| 检查                            | 当前结果                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 前端全量测试                    | **386 个文件、3418 项测试全部通过**                                                                       |
| 前端完整类型检查（包含测试）    | **0 错误**                                                                                                |
| 生产构建                        | Node 24.15.0 下通过；未启用 `ignoreBuildErrors`                                                           |
| 前端修改文件 ESLint / Prettier  | 通过；测试图片 mock 的性能规则单独处理，保留无障碍规则                                                    |
| API / PostgreSQL + Redis        | **214 项测试、728 个断言通过**                                                                            |
| API / SQLite + array 缓存       | **214 项测试、728 个断言通过**；Redis 锁测试仍使用专用实例                                                |
| API Pint / Composer 配置 / diff | 通过                                                                                                      |
| 前后端依赖审计                  | npm **0**，Composer **0**                                                                                 |
| Reverb                          | 真实握手、公开订阅、Laravel 广播、私有频道授权与收发通过；他人频道授权返回 403                            |
| Playwright                      | 桌面和 390×844 手机界面通过：旧笔记显示、斜杠菜单过滤/键盘操作/Escape、无横向溢出、即时保存、图片缩放保存 |

数据库验证使用全新隔离实例：PostgreSQL 14.21、Redis 8.6.1；未连接生产数据库或现有 Redis。

浏览器用虚构账号和测试笔记验证：JSON 与 Markdown 均包含最后一次输入；图片从 160×100 调整为 208×130，真实 API 请求保存了新尺寸。公式、图片及加粗旧内容可打开。临时账号、数据库和服务在验证后清理，截图与记录留在 `/private/tmp/dogeow-followup-ui/`。

## 历史云盘文件迁移

命令位于 API 的 `app/Console/Commands/MigrateCloudFilesToPrivate.php`，**默认只预演**：

```bash
cd ../dogeow-api
php artisan cloud:migrate-private
```

部署时应按项目流程刷新 Laravel 缓存，并重新加载 Octane、队列和 Reverb 等常驻进程。本次没有对实际环境执行这些操作。

在需要迁移的实际环境审阅预演结果后，显式执行：

```bash
php artisan cloud:migrate-private --apply
# 如需按用户分批：
php artisan cloud:migrate-private --apply --user=123
```

执行步骤是流式复制到私有临时文件、校验 SHA-256、归档私有副本、再次核对源文件与目标文件，然后移除公开副本。冲突、写入失败或校验失败会保留公开原件并返回非零退出码；重复执行可继续未完成的迁移。用户过滤只处理指定用户，迁移不改变数据库结构、文件 ID 或相对路径。

**真实历史文件迁移尚未执行。** 代码中的 public 兼容回退保留，迁移成功后文件实际只存在于 cloud 私有盘。应在实际环境执行迁移并确认旧公开地址不能再获取内容，才能确认线上遗留暴露已经消除。

## 验证边界

- 本次代码改动未提交、未部署；生产配置、生产 PostgreSQL 版本和实际存储访问策略尚未验证。
- PostgreSQL、Redis、Reverb 已完成本地真实服务验证，不能等同于生产环境验收。
- 本轮是代码、依赖和交互检查，不构成全部业务场景的覆盖或生产渗透测试。
