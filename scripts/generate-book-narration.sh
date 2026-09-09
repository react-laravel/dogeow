#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TTS_ROOT="${TTS_ROOT:-/Users/sam/Documents/Codex/2026-09-10/https-github-com-blaizzy-mlx-audio/outputs/mlx-audio}"
PYTHON="${TTS_ROOT}/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "找不到本地 TTS 环境：$PYTHON" >&2
  echo "请设置 TTS_ROOT，指向含 tts.py 与 .venv 的 mlx-audio 目录。" >&2
  exit 1
fi

exec "$PYTHON" "$ROOT/scripts/generate-book-narration.py" "$@"
