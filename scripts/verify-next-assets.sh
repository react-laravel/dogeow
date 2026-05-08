#!/bin/bash

set -euo pipefail

BASE_URL="${1:-}"
shift || true

if [ -z "$BASE_URL" ]; then
  echo "用法: bash scripts/verify-next-assets.sh <base-url> [route ...]" >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  set -- /about
fi

extract_asset_paths() {
  grep -oE '(src|href)="/_next/static/[^"]+"' \
    | sed -E 's/^(src|href)="([^"]+)"$/\2/' \
    | awk '!seen[$0]++'
}

check_route_assets() {
  local route="$1"
  local base_url="${BASE_URL%/}"
  local page_url="${base_url}${route}"
  local html
  local assets
  local count=0

  html="$(curl -fsSL "$page_url")"
  assets="$(printf '%s' "$html" | extract_asset_paths)"

  if [ -z "$assets" ]; then
    echo "[verify] $page_url 未找到任何 /_next/static 资源引用" >&2
    return 1
  fi

  while IFS= read -r asset; do
    local status

    [ -n "$asset" ] || continue
    status="$(curl -s -o /dev/null -w '%{http_code}' "${base_url}${asset}")"

    if [ "$status" -lt 200 ] || [ "$status" -ge 400 ]; then
      echo "[verify] $page_url 引用的资源 ${base_url}${asset} 返回 $status" >&2
      return 1
    fi

    count=$((count + 1))
  done <<< "$assets"

  echo "[verify] $page_url 通过，共检查 $count 个静态资源"
}

for route in "$@"; do
  check_route_assets "$route"
done