#!/usr/bin/env python3
"""Generate Qwen3-TTS narration that lines up with VolumeBookReader paragraphs.

Usage:
  ./scripts/generate-book-narration.sh --book luxun --chapter 0-0
  ./scripts/generate-book-narration.sh --book luxun --all
  ./scripts/generate-book-narration.sh --book luxun --chapter 0-0 --dry-run
  ./scripts/generate-book-narration.sh --book luxun --chapter 0-0 --publish

The reader splits chapter text with /\\n{2,}/ and keeps whitespace-only parts
so indexes stay stable. This script uses the same split, writes 1.0x MP3
files, fills blank parts with a short silence, and updates
app/book/data/ai-narration.json.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API_ROOT = ROOT.parent / "dogeow-api"
CATALOG_PATH = ROOT / "app" / "book" / "data" / "ai-narration.json"
DEFAULT_TTS_ROOT = Path(
    "/Users/sam/Documents/Codex/2026-09-10/https-github-com-blaizzy-mlx-audio/outputs/mlx-audio"
)
BLANK_SILENCE_SECONDS = 0.4


def split_volume_paragraphs(text: str) -> list[str]:
    """Match `text.split(/\\n{2,}/).filter(Boolean)` in VolumeBookReader."""
    return [part for part in re.split(r"\n{2,}", text) if part]


def pad_pair_index(index: int) -> str:
    return f"{index:03d}"


def resolve_tts_root() -> Path:
    configured = os.environ.get("TTS_ROOT", "").strip()
    root = Path(configured).expanduser() if configured else DEFAULT_TTS_ROOT
    python = root / ".venv" / "bin" / "python"
    tts_py = root / "tts.py"
    if not python.is_file() or not tts_py.is_file():
        raise FileNotFoundError(
            f"找不到本地 TTS：{root}\n请设置 TTS_ROOT，指向含 tts.py 与 .venv 的 mlx-audio 目录。"
        )
    return root


def load_reader(tts_root: Path):
    sys.path.insert(0, str(tts_root))
    from tts import Reader  # type: ignore

    return Reader()


def load_index(book_dir: Path) -> dict:
    index_path = book_dir / "index.json"
    if not index_path.is_file():
        raise FileNotFoundError(f"找不到书目索引：{index_path}")
    return json.loads(index_path.read_text(encoding="utf-8"))


def parse_chapter_id(chapter_id: str) -> tuple[int, int]:
    parts = chapter_id.split("-")
    if len(parts) != 2 or not all(part.isdigit() for part in parts):
        raise ValueError(f"无效的章节编号：{chapter_id}，应为 vol-chapter，例如 0-0")
    return int(parts[0]), int(parts[1])


def list_chapters(index: dict) -> list[tuple[str, str, str]]:
    chapters = []
    for vol_idx, volume in enumerate(index.get("volumes") or []):
        for ch_idx, chapter in enumerate(volume.get("chapters") or []):
            chapters.append(
                (
                    f"{vol_idx}-{ch_idx}",
                    str(chapter.get("name") or ""),
                    str(chapter.get("file") or ""),
                )
            )
    return chapters


def write_silence_mp3(mp3_path: Path, seconds: float = BLANK_SILENCE_SECONDS) -> None:
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=channel_layout=mono:sample_rate=24000",
            "-t",
            f"{seconds:.3f}",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(mp3_path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not mp3_path.is_file() or mp3_path.stat().st_size <= 0:
        detail = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(
            f"ffmpeg 生成静音失败：{mp3_path.name}" + (f"\n{detail}" if detail else "")
        )
    mp3_path.with_suffix(".json").write_text(
        json.dumps(
            {"silence": True, "audio_seconds": seconds, "sample_rate": 24000},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def convert_wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
            "-c:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(mp3_path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"ffmpeg 转 MP3 失败：{mp3_path.name}" + (f"\n{detail}" if detail else ""))


def cleanup_sidecars(path: Path) -> None:
    for suffix in (".wav", ".txt", ".json"):
        sidecar = path.with_suffix(suffix)
        if sidecar.exists():
            sidecar.unlink()


def update_catalog(book_id: str, chapter_id: str, title: str, pairs: list[int], voice: str) -> None:
    data = {"voice": voice.lower(), "chapters": {}}
    if CATALOG_PATH.is_file():
        try:
            loaded = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                data["voice"] = str(loaded.get("voice") or voice).lower()
                chapters = loaded.get("chapters")
                if isinstance(chapters, dict):
                    data["chapters"] = chapters
        except json.JSONDecodeError:
            pass

    data["chapters"][f"{book_id}:{chapter_id}"] = {"title": title, "pairs": pairs}
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_manifest(
    dest_dir: Path,
    *,
    book_id: str,
    chapter_id: str,
    title: str,
    voice: str,
    pair_count: int,
    pairs: list[dict],
) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "bookId": book_id,
        "chapterId": chapter_id,
        "title": title,
        "voice": voice,
        "pairCount": pair_count,
        "pairs": pairs,
    }
    (dest_dir / "manifest.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def generate_chapter(
    reader,
    *,
    book_id: str,
    book_dir: Path,
    chapter_id: str,
    title: str,
    relative_file: str,
    voice: str,
    language: str,
    dry_run: bool,
) -> dict:
    source = book_dir / relative_file
    if not source.is_file():
        raise FileNotFoundError(f"找不到章节文件：{source}")

    paragraphs = split_volume_paragraphs(source.read_text(encoding="utf-8-sig"))
    dest_dir = book_dir / "audio" / voice.lower() / chapter_id
    dest_dir.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    blank = 0
    pair_entries: list[dict] = []

    print(f"\n[{chapter_id}] {title} · {len(paragraphs)} 段", flush=True)

    for index, paragraph in enumerate(paragraphs):
        stem = pad_pair_index(index)
        mp3_path = dest_dir / f"{stem}.mp3"
        if not paragraph.strip():
            blank += 1
            pair_entries.append(
                {
                    "index": index,
                    "file": mp3_path.name,
                    "chars": 0,
                    "silence": True,
                }
            )
            if mp3_path.is_file() and mp3_path.stat().st_size > 0:
                skipped += 1
                print(f"  {stem} 空白，已有静音，跳过", flush=True)
                continue
            if dry_run:
                print(f"  {stem} 空白，将生成 {BLANK_SILENCE_SECONDS:.1f}s 静音", flush=True)
                continue
            print(f"  {stem} 空白，正在生成 {BLANK_SILENCE_SECONDS:.1f}s 静音", flush=True)
            write_silence_mp3(mp3_path)
            generated += 1
            continue

        pair_entries.append({"index": index, "file": mp3_path.name, "chars": len(paragraph.strip())})
        if mp3_path.is_file() and mp3_path.stat().st_size > 0:
            skipped += 1
            print(f"  {stem} 已有 MP3，跳过", flush=True)
            continue

        if dry_run:
            print(f"  {stem} 将生成 {len(paragraph.strip())} 字", flush=True)
            continue

        wav_path = dest_dir / f"{stem}.generating.wav"
        cleanup_sidecars(wav_path)
        print(f"  {stem} 正在生成 · {len(paragraph.strip())} 字", flush=True)
        reader.speak(paragraph.strip(), voice, language, wav_path)
        convert_wav_to_mp3(wav_path, mp3_path)
        generating_json = wav_path.with_suffix(".json")
        if generating_json.is_file():
            generating_json.replace(dest_dir / f"{stem}.json")
        cleanup_sidecars(wav_path)
        generated += 1

    pair_indexes = [item["index"] for item in pair_entries]
    write_manifest(
        dest_dir,
        book_id=book_id,
        chapter_id=chapter_id,
        title=title,
        voice=voice,
        pair_count=len(paragraphs),
        pairs=pair_entries,
    )
    if not dry_run:
        update_catalog(book_id, chapter_id, title, pair_indexes, voice)

    return {
        "chapterId": chapter_id,
        "title": title,
        "paragraphs": len(paragraphs),
        "audio": len(pair_entries),
        "generated": generated,
        "skipped": skipped,
        "blank": blank,
    }


def publish_audio(book_id: str) -> None:
    result = subprocess.run(
        ["php", "artisan", "books:upload", book_id, "--audio"],
        cwd=API_ROOT,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"上传失败：php artisan books:upload {book_id} --audio")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="为分卷书目生成与阅读器对齐的 Serena 朗读音频")
    parser.add_argument("--book", required=True, help="书籍 id，例如 luxun")
    parser.add_argument("--chapter", help="章节 id，例如 0-0")
    parser.add_argument("--all", action="store_true", help="生成该书全部章节")
    parser.add_argument("--limit", type=int, default=0, help="最多生成前 N 章（可与 --all 一起用）")
    parser.add_argument("--voice", default="Serena", help="Qwen3-TTS 音色，默认 Serena")
    parser.add_argument("--language", default="Chinese")
    parser.add_argument("--dry-run", action="store_true", help="只列出分段，不调用模型")
    parser.add_argument("--publish", action="store_true", help="生成后上传又拍云 audio 目录")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.chapter and not args.all:
        raise SystemExit("请指定 --chapter 0-0，或使用 --all 生成全书。")
    if not re.fullmatch(r"[a-z0-9]+", args.book):
        raise SystemExit(f"无效的书籍 id：{args.book}")

    book_dir = ROOT / "public" / "books" / args.book
    index = load_index(book_dir)
    chapters = list_chapters(index)
    if not chapters:
        raise SystemExit(f"索引里没有章节：{book_dir / 'index.json'}")

    selected: list[tuple[str, str, str]]
    if args.chapter:
        parse_chapter_id(args.chapter)
        selected = [item for item in chapters if item[0] == args.chapter]
        if not selected:
            raise SystemExit(f"找不到章节 {args.chapter}")
    else:
        selected = chapters

    if args.limit and args.limit > 0:
        selected = selected[: args.limit]

    reader = None
    if not args.dry_run:
        tts_root = resolve_tts_root()
        print(f"使用本地 TTS：{tts_root}", flush=True)
        reader = load_reader(tts_root)

    summaries = []
    for chapter_id, title, relative_file in selected:
        summaries.append(
            generate_chapter(
                reader,
                book_id=args.book,
                book_dir=book_dir,
                chapter_id=chapter_id,
                title=title,
                relative_file=relative_file,
                voice=args.voice,
                language=args.language,
                dry_run=args.dry_run,
            )
        )

    print("\n完成：")
    for item in summaries:
        print(
            f"  {item['chapterId']} {item['title']} · "
            f"{item['audio']} 段音频 / {item['paragraphs']} 段正文 "
            f"(新生成 {item['generated']}，已存在 {item['skipped']}，空白 {item['blank']})"
        )

    if args.publish:
        if args.dry_run:
            print("dry-run 跳过上传。", flush=True)
        else:
            print("\n正在上传又拍云…", flush=True)
            publish_audio(args.book)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已中断。", file=sys.stderr)
        sys.exit(130)
    except Exception as error:
        print(f"运行失败：{error}", file=sys.stderr)
        sys.exit(1)
