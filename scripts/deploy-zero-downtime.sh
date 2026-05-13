#!/bin/bash
# 零停机部署脚本
# 原理：在独立目录构建，完成后原子切换，避免 next build 覆盖正在服务的 .next
#
# 两种模式：
# 1) 发布目录+符号链接：存在 current 时，在「releases/时间戳」目录构建，再 ln -sfn 切换，零停机可回滚。
# 2) 临时目录+原子替换：无 current 时，在「.build-staging」目录构建，再原子替换 .next。
#
# 首次用模式 1 需在服务器初始化一次。先建临时目录，构建完成后再用时间戳重命名：
#   mkdir -p releases && s=releases/.staging.$$ && rsync -a --exclude=node_modules --exclude=.next --exclude=releases --exclude=current . "$s"/ && cd "$s" && npm ci && npx next build
#   cd "releases" && r=$(date +%Y%m%d%H%M%S) && mv .staging.$$ "$r" && cd "$APP_ROOT" && ln -sfn "$(pwd)/releases/$r" current
# PM2 使用 ecosystem.config.js，模式 1 下通过 PM2_CWD 指定 current 为 cwd。
set -euo pipefail

AUTO_DETECTED_APP_ROOT=0

# 应用根目录，可由调用方通过环境变量传入；未传时自动按脚本所在目录识别。
if [ -z "${APP_ROOT:-}" ]; then
  APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
  AUTO_DETECTED_APP_ROOT=1
fi

RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"
SHARED_NEXT_STATIC_DIR="${APP_ROOT}/shared/.next-static"
NODE_VERSION="${NODE_VERSION:-24}"
APP_PORT="${PORT:-3000}"

STATIC_HEALTHCHECK_ROUTES=(/about)

RUN_ANALYZE="${ANALYZE:-}"

cd "$APP_ROOT"

log() {
  echo "[deploy] $*"
}

die() {
  echo "错误：$*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "缺少命令：$1"
  fi
}

load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi

  command -v nvm >/dev/null 2>&1
}

install_nvm() {
  log "未检测到 nvm，准备自动安装"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  else
    die "缺少命令：curl 或 wget，无法自动安装 nvm"
  fi
}

setup_node_runtime() {
  if ! load_nvm; then
    install_nvm
    load_nvm || die "nvm 安装后仍无法加载，请检查 $NVM_DIR/nvm.sh"
  fi

  log "使用 Node.js $NODE_VERSION"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"

  require_command node
  require_command npm

  log "当前 Node：$(node -v)"
  log "当前 npm：$(npm -v)"
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi

  log "未检测到 pm2，准备通过 npm 全局安装"
  npm install -g pm2
  require_command pm2
}

has_env_config() {
  local env_file

  for env_file in \
    "$APP_ROOT/.env" \
    "$APP_ROOT/.env.local" \
    "$APP_ROOT/.env.production" \
    "$APP_ROOT/.env.production.local"; do
    if [ -s "$env_file" ]; then
      return 0
    fi
  done

  return 1
}

require_env_config() {
  if has_env_config; then
    return 0
  fi

  cat >&2 <<EOF
错误：缺少服务器环境配置文件。

请先在部署根目录创建并填写环境变量文件，然后重新运行本脚本：
  $APP_ROOT/.env.local

可参考：
  cp $APP_ROOT/.env.local.example $APP_ROOT/.env.local
  nano $APP_ROOT/.env.local

脚本会把部署根目录下的 .env* 文件复制到新 release；未配置前不会继续部署。
EOF
  exit 1
}

copy_deploy_snapshot() {
  local destination="$1"

  mkdir -p "$destination"
  git -C "$APP_ROOT" archive --format=tar HEAD | tar -xf - -C "$destination"

  while IFS= read -r -d '' local_file; do
    cp "$local_file" "$destination/"
  done < <(find "$APP_ROOT" -maxdepth 1 -type f \( -name '.env*' -o -name '.npmrc' \) -print0)
}

sync_static_assets_into_shared() {
  local static_dir="$1"
  local static_real
  local shared_real

  [ -d "$static_dir" ] || return 0

  mkdir -p "$SHARED_NEXT_STATIC_DIR"
  static_real="$(cd "$static_dir" && pwd -P)"
  shared_real="$(cd "$SHARED_NEXT_STATIC_DIR" && pwd -P)"

  if [ "$static_real" = "$shared_real" ]; then
    return 0
  fi

  rsync -a "$static_dir/" "$SHARED_NEXT_STATIC_DIR/"
}

sync_release_history_static_assets() {
  local release_dir

  [ -d "$RELEASES_DIR" ] || return 0

  while IFS= read -r release_dir; do
    [ -n "$release_dir" ] || continue
    sync_static_assets_into_shared "$release_dir/.next/static"
  done < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -name '[0-9]*' | sort)
}

prepare_release_static_assets() {
  local release_root="$1"
  local release_static="$release_root/.next/static"

  sync_release_history_static_assets
  sync_static_assets_into_shared "$CURRENT_LINK/.next/static"
  sync_static_assets_into_shared "$APP_ROOT/.next/static"
  sync_static_assets_into_shared "$release_static"

  rm -rf "$release_static"
  ln -sfn "$SHARED_NEXT_STATIC_DIR" "$release_static"
}

run_static_asset_health_checks() {
  local runtime_cwd="$1"
  local verify_script="$runtime_cwd/scripts/verify-next-assets.sh"
  local local_base_url="http://127.0.0.1:${APP_PORT}"

  if ! command -v curl >/dev/null 2>&1; then
    log "跳过静态资源健康检查：缺少 curl"
    return 0
  fi

  if [ ! -f "$verify_script" ]; then
    die "缺少静态资源校验脚本：$verify_script"
  fi

  log "校验本机 Next 服务静态资源引用：$local_base_url"
  bash "$verify_script" "$local_base_url" "${STATIC_HEALTHCHECK_ROUTES[@]}"

  if [ -n "${VERIFY_BASE_URL:-}" ]; then
    log "校验对外站点静态资源引用：$VERIFY_BASE_URL"
    bash "$verify_script" "$VERIFY_BASE_URL" "${STATIC_HEALTHCHECK_ROUTES[@]}"
  fi
}

sync_pm2_app() {
  local runtime_cwd="$1"
  local app_name="dogeow-nextjs"
  local ecosystem_path="${APP_ROOT}/ecosystem.config.js"

  if env -u RUNNER_TRACKING_ID pm2 info "$app_name" >/dev/null 2>&1; then
    log "重启 PM2 应用: $app_name"

    # 单实例 fork 模式下使用硬重启，避免旧进程继续持有上一版构建清单。
    if env -u RUNNER_TRACKING_ID PM2_CWD="$runtime_cwd" APP_ROOT="$APP_ROOT" pm2 restart "$ecosystem_path" --only "$app_name" --update-env; then
      return 0
    fi

    log "PM2 restart 失败，尝试重建应用进程表"
    env -u RUNNER_TRACKING_ID pm2 delete "$app_name" || true
  else
    log "PM2 中未找到应用，准备首次启动: $app_name"
  fi

  env -u RUNNER_TRACKING_ID PM2_CWD="$runtime_cwd" APP_ROOT="$APP_ROOT" pm2 start "$ecosystem_path" --only "$app_name" --update-env
}

require_command git
require_command tar
require_command rsync

if [ "$AUTO_DETECTED_APP_ROOT" -eq 1 ]; then
  log "自动识别 APP_ROOT：$APP_ROOT"
fi

if [ ! -d "$APP_ROOT" ]; then
  die "APP_ROOT 不存在：$APP_ROOT"
fi

if ! git -C "$APP_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "APP_ROOT 不是有效的 Git 工作树：$APP_ROOT"
fi

require_env_config
setup_node_runtime
ensure_pm2

# ---------- 模式一：发布目录 + 符号链接（推荐，零停机 + 可回滚）----------
if [ -L "$CURRENT_LINK" ] || [ -d "$CURRENT_LINK" ]; then
  log "使用发布目录模式（零停机）"

  [ -d "$RELEASES_DIR" ] || mkdir -p "$RELEASES_DIR"
  STAGING="${RELEASES_DIR}/.staging.$$"
  PREVIOUS_RELEASE=""

  if [ -L "$CURRENT_LINK" ]; then
    PREVIOUS_RELEASE="$(readlink "$CURRENT_LINK")"
  fi

  # 基于当前工作树生成新的发布快照，避免把旧 release 的陈旧源码带入新构建。
  log "构建到临时目录: $STAGING"
  copy_deploy_snapshot "$STAGING"

  cd "$STAGING"
  npm ci
  if [ -n "$RUN_ANALYZE" ]; then
    log "构建并执行 bundle 分析"
    npx next build && npm run analyze
  else
    npx next build
  fi

  prepare_release_static_assets "$STAGING"

  # 构建完成后再生成时间戳并重命名，原子切换 current
  cd "$APP_ROOT"
  NEW_RELEASE="${RELEASES_DIR}/$(date +%Y%m%d%H%M%S)"
  mv "$STAGING" "$NEW_RELEASE"
  ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
  log "已切换 current -> $NEW_RELEASE"

  # 只保留最近 5 个发布（仅删除时间戳目录，不删 .staging.*）
  KEEP=5
  (cd "$RELEASES_DIR" && ls -1t | grep -E '^[0-9]{14}$' | tail -n +$((KEEP + 1)) | while read -r d; do [ -n "$d" ] && rm -rf "$RELEASES_DIR/$d"; done)
  rm -rf "${RELEASES_DIR}"/.staging.* 2>/dev/null || true

  sync_pm2_app "$CURRENT_LINK"

  if ! run_static_asset_health_checks "$CURRENT_LINK"; then
    if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
      log "健康检查失败，回滚 current -> $PREVIOUS_RELEASE"
      ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
      sync_pm2_app "$CURRENT_LINK"
    fi

    die "部署后静态资源健康检查失败"
  fi

  pm2 status
  log "完成（零停机）"
  exit 0
fi

# ---------- 模式二：无 current 时，构建到临时目录再原子替换 .next ----------
log "使用临时目录构建 + 原子替换 .next（避免构建期间覆盖线上）"
BUILD_STAGING="${APP_ROOT}/.build-staging.$$"
trap "rm -rf '$BUILD_STAGING'" EXIT

copy_deploy_snapshot "$BUILD_STAGING"
cd "$BUILD_STAGING"
npm ci
if [ -n "$RUN_ANALYZE" ]; then
  npx next build && npm run analyze
else
  npx next build
fi

prepare_release_static_assets "$BUILD_STAGING"

# 原子替换 .next：先放到 .next.new，再重命名
log "原子替换 .next"
rsync -a --delete "$BUILD_STAGING/.next/" "$APP_ROOT/.next.new/"
cd "$APP_ROOT"
[ -d ".next.old" ] && rm -rf ".next.old"
[ -d ".next" ] && mv .next .next.old
mv .next.new .next

sync_pm2_app "$APP_ROOT"

if ! run_static_asset_health_checks "$APP_ROOT"; then
  if [ -d ".next.old" ]; then
    log "健康检查失败，回滚 .next.old"
    rm -rf .next.failed 2>/dev/null || true
    mv .next .next.failed
    mv .next.old .next
    sync_pm2_app "$APP_ROOT"
    rm -rf .next.failed
  fi

  die "部署后静态资源健康检查失败"
fi

rm -rf .next.old

pm2 status
log "完成"
