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
set('keep_releases', 5);
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

desc('构建 Next.js 生产产物');
task('deploy:build', function () {
    run('cd {{release_path}} && npm run build');
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

desc('重启 PM2 应用');
task('pm2:restart', function () {
    run(<<<'BASH'
bash -lc '
app_name="{{pm2_app}}"
runtime_cwd="{{current_path}}"
ecosystem_path="{{current_path}}/ecosystem.config.js"

if pm2 info "$app_name" >/dev/null 2>&1; then
  echo "[deploy] 重启 PM2 应用: $app_name"

  if PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 restart "$ecosystem_path" --only "$app_name" --update-env; then
    pm2 status
    exit 0
  fi

  echo "[deploy] PM2 restart 失败，尝试重建应用进程表"
  pm2 delete "$app_name" || true
fi

if ! pm2 info "$app_name" >/dev/null 2>&1; then
  echo "[deploy] PM2 中未找到应用，准备首次启动: $app_name"
fi

PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 start "$ecosystem_path" --only "$app_name" --update-env
pm2 status
'
BASH);
});

desc('校验页面引用的 Next 静态资源可访问');
task('deploy:healthcheck', function () {
    run(<<<'BASH'
bash -lc '
set -euo pipefail

verify_script="{{current_path}}/scripts/verify-next-assets.sh"
local_base_url="{{local_healthcheck_base_url}}"
public_base_url="{{verify_base_url}}"

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
    'deploy:release',
    'deploy:update_code',
    'deploy:runtime_files',
    'deploy:shared',
    'deploy:writable',
    'deploy:vendors',
    'deploy:build',
    'deploy:preserve_next_static',
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
