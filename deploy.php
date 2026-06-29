<?php

/**
 * Deployer 部署配置（GitHub Actions self-hosted runner 使用）
 *
 * 设计要点：
 * - self-hosted runner 就在目标服务器上，host 用 localhost() 走本地 shell，无需 SSH。
 * - 代码来源直接使用当前 Actions checkout 工作区，避免在部署阶段再次 clone 仓库。
 * - 兼容旧脚本：若部署根目录里存在 .env* / .npmrc，会在每次发布时覆盖到新 release。
 * - Next.js 构建完成后通过 PM2 reload current，对外保持零停机切换。
 *
 * 本地使用：
 *   APP_ROOT=/example/dogeow PM2_APP=dogeow-nextjs vendor/bin/dep deploy production
 *
 * 回滚：
 *   vendor/bin/dep rollback production
 */

namespace Deployer;

require 'recipe/common.php';

// =====================
// 基本配置
// =====================
set('application', 'dogeow');
set('keep_releases', 2);
set('git_tty', false); // CI 环境没有 TTY
set('workspace_root', __DIR__);
set('writable_mode', 'chmod');
set('writable_recursive', true);
set('writable_chmod_mode', '0775');
set('verify_base_url', getenv('VERIFY_BASE_URL') ?: 'https://next.dogeow.com');
set('local_healthcheck_base_url', 'http://127.0.0.1:' . (getenv('PORT') ?: '3000'));

// 跨版本共享目录（升级不会丢）
add('shared_dirs', ['logs']);

// PM2 日志目录需要可写
add('writable_dirs', ['logs']);

// =====================
// Hosts
// =====================
localhost('production')
    ->set('deploy_path', getenv('DEPLOY_PATH') ?: getenv('APP_ROOT') ?: '/example/dogeow')
    ->set('pm2_app', getenv('PM2_APP') ?: 'dogeow-nextjs');

// =====================
// 自定义任务
// =====================
desc('部署前检查关键目录权限');
task('deploy:preflight_permissions', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail

workspace_root="{{workspace_root}}"
deploy_path="{{deploy_path}}"
expected_user="${DEPLOY_USER:-nginx}"
actual_user="$(id -un)"

if [ "$actual_user" != "$expected_user" ]; then
  echo "[deploy] ERROR: 部署必须以 $expected_user 用户运行，当前是 $actual_user" >&2
  echo "[deploy] 修复：检查 GitHub Actions runner systemd User=、手工 deploy/sudo 命令以及 PM2_HOME。" >&2
  exit 73
fi

check_tree_writable() {
  local label="$1"
  local path="$2"

  [ -e "$path" ] || return 0

  local bad_owner bad_dirs
  bad_owner="$({ find "$path" -maxdepth 8 ! -user "$actual_user" -printf "%u:%g %m %p\n" | head -40; } || true)"
  bad_dirs="$({ find "$path" -maxdepth 8 -type d ! -writable -printf "%u:%g %m %p\n" | head -40; } || true)"

  if [ -n "$bad_owner" ] || [ -n "$bad_dirs" ]; then
    echo "[deploy] ERROR: $label 存在权限漂移：" >&2
    if [ -n "$bad_owner" ]; then
      echo "[deploy] 非 $actual_user 所有的路径：" >&2
      echo "$bad_owner" >&2
    fi
    if [ -n "$bad_dirs" ]; then
      echo "[deploy] 当前用户不可写的目录：" >&2
      echo "$bad_dirs" >&2
    fi
    echo "[deploy] 这通常是 root 手工运行 npm/git/pm2/deploy 或编辑器/LSP 在部署目录写文件导致。" >&2
    echo "[deploy] 修复：sudo chown -R $actual_user:$actual_user \"$path\"，并停止 root PM2/LSP/手工进程。" >&2
    exit 74
  fi
}

check_tree_writable "Actions 工作区" "$workspace_root"
check_tree_writable "部署目录" "$deploy_path"
'
BASH);
});

desc('从当前工作区同步代码到 release 目录');
task('deploy:update_code', function () {
    $workspaceRoot = rtrim(get('workspace_root'), '/');
    $releasePath = '{{release_path}}';

    run("mkdir -p $releasePath");
    run(
        'rsync -a '
        . "--exclude='.git' "
        . "--exclude='node_modules' "
        . "--exclude='.next' "
        . "--exclude='coverage' "
        . "--exclude='logs' "
        . "--exclude='releases' "
        . "--exclude='current' "
        . "--exclude='.build-staging.*' "
        . "$workspaceRoot/ $releasePath/"
    );
});

desc('把旧部署目录中的本地配置文件覆盖到新 release');
task('deploy:runtime_files', function () {
    $deployPath = '{{deploy_path}}';
    $releasePath = '{{release_path}}';

    run(<<<'BASH'
bash -lc '
for file in .env .env.local .env.production .env.production.local .npmrc; do
  if [ -f "{{deploy_path}}/$file" ]; then
    cp "{{deploy_path}}/$file" "{{release_path}}/$file"
  fi
done
'
BASH);

    run("mkdir -p $releasePath/logs");
});

desc('安装 Node.js 依赖');
task('deploy:vendors', function () {
    run('cd {{release_path}} && npm ci');
});

desc('准备跨发布的 Next.js 构建缓存');
task('deploy:prepare_next_cache', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail

shared_cache="{{deploy_path}}/shared/.next-cache"
release_next="{{release_path}}/.next"
release_cache="$release_next/cache"

mkdir -p "$shared_cache" "$release_next"
rm -rf "$release_cache"
ln -sfn "$shared_cache" "$release_cache"
'
BASH);
});

desc('构建 Next.js 生产产物');
task('deploy:build', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail
build_version="$(git -C "{{workspace_root}}" rev-parse --short=12 HEAD 2>/dev/null || date +%s)"
echo "[deploy] NEXT_PUBLIC_APP_BUILD_VERSION=$build_version"
cd "{{release_path}}"
NEXT_PUBLIC_APP_BUILD_VERSION="$build_version" NEXT_TELEMETRY_DISABLED=1 npm run build
'
BASH);
});

desc('保留跨发布的 Next 静态资源');
task('deploy:preserve_next_static', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail

shared_static="{{deploy_path}}/shared/.next-static"
current_static="{{current_path}}/.next/static"
release_static="{{release_path}}/.next/static"
releases_root="{{deploy_path}}/releases"

sync_static_dir() {
  local static_dir="$1"
  local static_real
  local shared_real

  [ -d "$static_dir" ] || return 0
  mkdir -p "$shared_static"

  static_real="$(cd "$static_dir" && pwd -P)"
  shared_real="$(cd "$shared_static" && pwd -P)"

  if [ "$static_real" = "$shared_real" ]; then
    return 0
  fi

  rsync -a "$static_dir/" "$shared_static/"
}

if [ -d "$releases_root" ]; then
  while IFS= read -r release_dir; do
    [ -n "$release_dir" ] || continue
    sync_static_dir "$release_dir/.next/static"
  done < <(find "$releases_root" -mindepth 1 -maxdepth 1 -type d -name '[0-9]*' | sort)
fi

sync_static_dir "$current_static"
sync_static_dir "$release_static"

rm -rf "$release_static"
ln -sfn "$shared_static" "$release_static"
'
BASH);
});

desc('移除构建清单中不存在的 Next 静态资源引用');
task('deploy:prune_missing_next_static_refs', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail

release_root="{{release_path}}"
static_root="$release_root/.next/static"
server_root="$release_root/.next/server"

[ -d "$server_root" ] || exit 0

python3 - "$server_root" "$static_root" <<"PY"
import json
import pathlib
import sys

server_root = pathlib.Path(sys.argv[1])
static_root = pathlib.Path(sys.argv[2])
changed = 0
removed = set()

for manifest in server_root.glob("**/react-loadable-manifest.json"):
    try:
        data = json.loads(manifest.read_text())
    except Exception:
        continue

    dirty = False
    for entry in data.values():
        if not isinstance(entry, dict):
            continue
        files = entry.get("files")
        if not isinstance(files, list):
            continue

        kept = []
        for file_name in files:
            if (
                isinstance(file_name, str)
                and file_name.startswith("static/")
                and not (static_root / file_name.removeprefix("static/")).exists()
            ):
                removed.add(file_name)
                dirty = True
                continue
            kept.append(file_name)
        entry["files"] = kept

    if dirty:
        manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        changed += 1

if removed:
    print(f"[deploy] pruned {len(removed)} missing static refs from {changed} react-loadable manifests")
    for file_name in sorted(removed):
        print(f"[deploy] missing static ref: {file_name}")
PY
'
BASH);
});

desc('重启 PM2 应用');
task('pm2:restart', function () {
    run(<<<'BASH'
bash -lc '
app_name="{{pm2_app}}"
runtime_cwd="{{current_path}}"
ecosystem_path="{{current_path}}/ecosystem.config.js"

pm2_untracked() {
  # GitHub Actions kills job child processes carrying RUNNER_TRACKING_ID after
  # the deploy step finishes. Strip it so the PM2 daemon and Next.js app remain
  # alive after the self-hosted runner reports success.
  env -u RUNNER_TRACKING_ID pm2 "$@"
}

if pm2_untracked info "$app_name" >/dev/null 2>&1; then
  echo "[deploy] 重启 PM2 应用: $app_name"

  if env -u RUNNER_TRACKING_ID PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 restart "$ecosystem_path" --only "$app_name" --update-env; then
    pm2_untracked status
  else
    echo "[deploy] PM2 restart 失败，尝试重建应用进程表"
    pm2_untracked delete "$app_name" || true

    if ! pm2_untracked info "$app_name" >/dev/null 2>&1; then
      echo "[deploy] PM2 中未找到应用，准备首次启动: $app_name"
    fi

    env -u RUNNER_TRACKING_ID PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 start "$ecosystem_path" --only "$app_name" --update-env
    pm2_untracked status
  fi
else
  echo "[deploy] PM2 中未找到应用，准备首次启动: $app_name"
  env -u RUNNER_TRACKING_ID PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 start "$ecosystem_path" --only "$app_name" --update-env
  pm2_untracked status
fi

app_port="${PORT:-3000}"
for env_file in .env.production.local .env.local .env.production .env; do
  if [ -f "$runtime_cwd/$env_file" ]; then
    env_port="$(grep -E "^PORT=" "$runtime_cwd/$env_file" | tail -1 | cut -d= -f2- | xargs || true)"
    if [ -n "$env_port" ]; then
      app_port="$env_port"
    fi
  fi
done

wait_attempts="${PM2_READY_MAX_ATTEMPTS:-60}"
wait_delay="${PM2_READY_DELAY_SECONDS:-1}"
for attempt in $(seq 1 "$wait_attempts"); do
  if curl -fsS --max-time 3 "http://127.0.0.1:${app_port}/" >/dev/null 2>&1; then
    echo "[deploy] Next.js 已在 127.0.0.1:${app_port} 就绪（${attempt}/${wait_attempts}）"
    exit 0
  fi

  if [ "$attempt" -eq "$wait_attempts" ]; then
    echo "[deploy] ERROR: Next.js 在 ${wait_attempts}s 内未在 127.0.0.1:${app_port} 就绪" >&2
    pm2_untracked logs "$app_name" --lines 80 --nostream >&2 || true
    exit 1
  fi

  sleep "$wait_delay"
done
'
BASH);
});

desc('校验页面引用的 Next 静态资源可访问');
task('deploy:healthcheck', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail

runtime_cwd="{{current_path}}"
verify_script="$runtime_cwd/scripts/verify-next-assets.sh"
public_base_url="{{verify_base_url}}"
app_port="${PORT:-3000}"

for env_file in .env.production.local .env.local .env.production .env; do
  if [ -f "$runtime_cwd/$env_file" ]; then
    env_port="$(grep -E "^PORT=" "$runtime_cwd/$env_file" | tail -1 | cut -d= -f2- | xargs || true)"
    if [ -n "$env_port" ]; then
      app_port="$env_port"
    fi
  fi
done

local_base_url="http://127.0.0.1:${app_port}"
export VERIFY_MAX_ATTEMPTS="${VERIFY_MAX_ATTEMPTS:-30}"
export VERIFY_RETRY_DELAY_SECONDS="${VERIFY_RETRY_DELAY_SECONDS:-2}"

bash "$verify_script" "$local_base_url" /about

if [ -n "$public_base_url" ]; then
  bash "$verify_script" "$public_base_url" /about
fi
'
BASH);
});

// =====================
// 部署流程
// =====================
desc('部署 dogeow');
task('deploy', [
    'deploy:info',
    'deploy:setup',
    'deploy:lock',
    'deploy:preflight_permissions',
    'deploy:release',
    'deploy:update_code',
    'deploy:runtime_files',
    'deploy:shared',
    'deploy:writable',
    'deploy:vendors',
    'deploy:prepare_next_cache',
    'deploy:build',
    'deploy:preserve_next_static',
    'deploy:prune_missing_next_static_refs',
    'deploy:symlink',
    'pm2:restart',
    'deploy:healthcheck',
    'deploy:unlock',
    'deploy:cleanup',
    'deploy:success',
]);

// =====================
// Hooks
// =====================
after('deploy:failed', 'deploy:unlock');
after('rollback', 'pm2:restart');

desc('发送部署完成站内通知');
task('deploy:notify', function () {
    $apiPath = getenv('DOGEOW_API_CURRENT_PATH');
    if (! is_string($apiPath) || $apiPath === '') {
        $deployPath = getenv('DEPLOY_PATH') ?: getenv('APP_ROOT');
        if (is_string($deployPath) && $deployPath !== '') {
            $apiPath = dirname(rtrim($deployPath, '/')) . '/' . basename(rtrim($deployPath, '/')) . '-api/current';
        } else {
            $apiPath = '/var/www/dogeow-api/current';
        }
    }

    run(<<<BASH
if [ -f "{$apiPath}/artisan" ]; then
  cd "{$apiPath}" && {{bin/php}} artisan notify:deploy dogeow --no-interaction || echo "[deploy] notify:deploy 执行失败，已忽略"
else
  echo "[deploy] 未找到 dogeow-api ({$apiPath})，跳过部署通知"
fi
BASH);
});
after('deploy:success', 'deploy:notify');
