#!/usr/bin/env sh
# Husky / Git GUI 启动时 PATH 很精简，nvm 的 node/npx 常常不在其中。

if command -v node >/dev/null 2>&1; then
  return 0 2>/dev/null || exit 0
fi

PROJECT_ROOT="${1:-}"

resolve_nvm_bin() {
  version=""
  if [ -n "$PROJECT_ROOT" ] && [ -f "$PROJECT_ROOT/.nvmrc" ]; then
    version=$(tr -d ' \t\r\nv' < "$PROJECT_ROOT/.nvmrc")
  fi

  nvm_base="${NVM_DIR:-$HOME/.nvm}/versions/node"
  [ -d "$nvm_base" ] || return 1

  if [ -n "$version" ]; then
    for dir in "$nvm_base/v${version}/bin" "$nvm_base/${version}/bin" "$nvm_base"/v${version}*/bin; do
      if [ -x "$dir/node" ] 2>/dev/null; then
        printf '%s' "$dir"
        return 0
      fi
    done
  fi

  latest=$(ls -1 "$nvm_base" 2>/dev/null | sort -V | tail -1)
  if [ -n "$latest" ] && [ -x "$nvm_base/$latest/bin/node" ]; then
    printf '%s' "$nvm_base/$latest/bin"
    return 0
  fi

  return 1
}

node_bin=""
for candidate in "$(resolve_nvm_bin)" /opt/homebrew/bin /usr/local/bin; do
  if [ -n "$candidate" ] && [ -x "$candidate/node" ]; then
    node_bin="$candidate"
    break
  fi
done

if [ -z "$node_bin" ]; then
  echo "husky: 找不到 node。请安装 Node.js（项目要求见 .nvmrc）或配置 nvm PATH。"
  return 1 2>/dev/null || exit 1
fi

PATH="$node_bin:$PATH"
export PATH
return 0 2>/dev/null || exit 0
