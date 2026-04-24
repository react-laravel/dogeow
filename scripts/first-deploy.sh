#!/bin/bash
# 首次服务器部署脚本：在已手动 clone 的仓库中创建首个 release，并指向 current。
set -euo pipefail

AUTO_DETECTED_APP_ROOT=0

if [ -z "${APP_ROOT:-}" ]; then
  APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
  AUTO_DETECTED_APP_ROOT=1
fi

RELEASES_DIR="${APP_ROOT}/releases"
CURRENT_LINK="${APP_ROOT}/current"
RELEASE_ID="$(date +%Y%m%d%H%M%S)"
NEW_RELEASE="${RELEASES_DIR}/${RELEASE_ID}"
PENDING_RELEASE="${RELEASES_DIR}/.staging.${RELEASE_ID}-$$"
NODE_VERSION="${NODE_VERSION:-24}"

log() {
  echo "[first-deploy] $*"
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

cleanup_pending_release() {
  if [ -d "$PENDING_RELEASE" ]; then
    rm -rf "$PENDING_RELEASE"
  fi
}

cleanup_failed_release() {
  if [ ! -L "$CURRENT_LINK" ] && [ -d "$NEW_RELEASE" ]; then
    rm -rf "$NEW_RELEASE"
  fi
}

on_exit() {
  local exit_code="$?"

  if [ "$exit_code" -ne 0 ]; then
    cleanup_pending_release
    cleanup_failed_release
  fi

  exit "$exit_code"
}

copy_local_config_files() {
  local destination="$1"

  while IFS= read -r -d '' local_file; do
    cp -f "$local_file" "$destination/"
  done < <(find "$APP_ROOT" -maxdepth 1 -type f \( -name '.env*' -o -name '.npmrc' \) -print0)
}

copy_deploy_snapshot() {
  local destination="$1"

  mkdir -p "$destination"
  git -C "$APP_ROOT" archive --format=tar HEAD | tar -xf - -C "$destination"
  copy_local_config_files "$destination"
}

sync_pm2_app() {
  local runtime_cwd="$1"
  local app_name="dogeow-nextjs"
  local ecosystem_path="${APP_ROOT}/ecosystem.config.js"

  if pm2 info "$app_name" >/dev/null 2>&1; then
    log "重载 PM2 应用：$app_name"

    if PM2_CWD="$runtime_cwd" APP_ROOT="$APP_ROOT" pm2 reload "$ecosystem_path" --only "$app_name" --update-env; then
      return 0
    fi

    log "PM2 reload 失败，尝试重建应用进程表"
    pm2 delete "$app_name" || true
  else
    log "PM2 中未找到应用，准备首次启动：$app_name"
  fi

  PM2_CWD="$runtime_cwd" APP_ROOT="$APP_ROOT" pm2 start "$ecosystem_path" --only "$app_name" --update-env
}

build_first_release() {
  log "构建首个发布目录：$PENDING_RELEASE"
  copy_deploy_snapshot "$PENDING_RELEASE"

  (
    cd "$PENDING_RELEASE"
    npm ci
    npx next build
  )
}

trap 'on_exit' EXIT

require_command git
require_command tar

if [ "$AUTO_DETECTED_APP_ROOT" -eq 1 ]; then
  log "自动识别 APP_ROOT：$APP_ROOT"
fi

if [ ! -d "$APP_ROOT" ]; then
  die "APP_ROOT 不存在：$APP_ROOT"
fi

if ! git -C "$APP_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "APP_ROOT 不是有效的 Git 工作树，请先手动 git clone 仓库到目标目录"
fi

setup_node_runtime
ensure_pm2

if [ -e "$CURRENT_LINK" ] || [ -L "$CURRENT_LINK" ]; then
  die "检测到 current 已存在，首次部署似乎已经完成；后续更新请改用 scripts/deploy-zero-downtime.sh"
fi

mkdir -p "$RELEASES_DIR"

if find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | grep -Eq '^[0-9]{14}$'; then
  die "检测到已有 release 目录，首次部署脚本只适用于空的 releases 目录"
fi

log "当前提交：$(git -C "$APP_ROOT" rev-parse --short HEAD)"
build_first_release
mv "$PENDING_RELEASE" "$NEW_RELEASE"
ln -s "$NEW_RELEASE" "$CURRENT_LINK"
sync_pm2_app "$CURRENT_LINK"
pm2 status

log "已创建首个发布：$NEW_RELEASE"
log "已创建 current -> $NEW_RELEASE"
log "首次部署完成"
log "后续更新请使用：$APP_ROOT/scripts/deploy-zero-downtime.sh"
