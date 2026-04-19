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

desc('重载 PM2 应用');
task('pm2:reload', function () {
    run(<<<'BASH'
bash -lc '
app_name="{{pm2_app}}"
runtime_cwd="{{current_path}}"
ecosystem_path="{{current_path}}/ecosystem.config.js"

if pm2 info "$app_name" >/dev/null 2>&1; then
  echo "[deploy] 重载 PM2 应用: $app_name"

  if PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 reload "$ecosystem_path" --only "$app_name" --update-env; then
    pm2 status
    exit 0
  fi

  echo "[deploy] PM2 reload 失败，尝试重建应用进程表"
  pm2 delete "$app_name" || true
else
  echo "[deploy] PM2 中未找到应用，准备首次启动: $app_name"
fi

PM2_CWD="$runtime_cwd" APP_ROOT="{{deploy_path}}" pm2 start "$ecosystem_path" --only "$app_name" --update-env
pm2 status
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
    'deploy:symlink',
    'pm2:reload',
    'deploy:unlock',
    'cleanup',
    'success',
]);

// =====================
// Hooks
// =====================
after('deploy:failed', 'deploy:unlock');
