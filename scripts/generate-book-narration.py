#!/usr/bin/env python3
"""Generate Qwen3-TTS narration aligned with the book reader.

Usage:
  ./scripts/generate-book-narration.sh --book luxun --chapter 0-0
  ./scripts/generate-book-narration.sh --book luxun --all --voices Serena,Uncle_Fu
  ./scripts/generate-book-narration.sh --all-books --voices Serena,Uncle_Fu --publish-each
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
    """Match `splitVolumeParagraphs` in the reader, including CRLF chapter files."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
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


def speak_paragraph(reader, text: str, voice: str, language: str, wav_path: Path) -> None:
    """Match the 127.0.0.1:7860 Qwen3 path: generate_custom_voice, empty instruct."""
    import time

    import mlx.core as mx
    import numpy as np
    from mlx_audio.audio_io import write
    from mlx_audio.tts.utils import load_model
    from tts import MODEL, text_segments  # type: ignore

    cleanup_sidecars(wav_path)
    if reader.model is None:
        print("正在加载本地模型，首次运行可能稍久……", flush=True)
        started = time.perf_counter()
        reader.model = load_model(str(MODEL))
        print(f"模型已加载，用时 {time.perf_counter() - started:.1f} 秒。", flush=True)

    segments = list(text_segments(text))
    chunks = []
    started = time.perf_counter()
    generate_custom = getattr(reader.model, "generate_custom_voice", None)
    for index, segment in enumerate(segments, 1):
        print(f"正在生成 {index}/{len(segments)} 段 · {voice} · {language}", flush=True)
        if generate_custom:
            results = generate_custom(
                text=segment,
                speaker=voice,
                language=language,
                instruct=None,
                max_tokens=4096,
            )
        else:
            results = reader.model.generate(
                text=segment,
                voice=voice,
                lang_code=language,
                max_tokens=4096,
                verbose=False,
            )
        for result in results:
            chunks.append(np.asarray(result.audio, dtype=np.float32).reshape(-1))
    if not chunks:
        raise RuntimeError("模型没有返回音频。")
    audio = np.concatenate(chunks)
    if not audio.size or not np.isfinite(audio).all() or np.max(np.abs(audio)) < 1e-5:
        raise RuntimeError("生成的音频为空、静音或含有无效数值。")
    seconds = len(audio) / reader.model.sample_rate
    elapsed = time.perf_counter() - started
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    write(str(wav_path), audio, reader.model.sample_rate, format="wav")
    wav_path.with_suffix(".txt").write_text(text + "\n", encoding="utf-8")
    wav_path.with_suffix(".json").write_text(
        json.dumps(
            {
                "voice": voice,
                "language": language,
                "instruct": "",
                "interface": "q3tts-mlx-demo-local",
                "sample_rate": reader.model.sample_rate,
                "audio_seconds": seconds,
                "generation_seconds": elapsed,
                "peak_mlx_memory_gb": mx.get_peak_memory() / 1e9,
                "segments": len(segments),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"已保存：{wav_path}\n音频 {seconds:.1f} 秒，生成用时 {elapsed:.1f} 秒。", flush=True)


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
    if chapters:
        return chapters
    for chapter in index.get("chapters") or []:
        chapters.append(
            (
                str(chapter.get("id") or ""),
                str(chapter.get("title") or chapter.get("name") or ""),
                str(chapter.get("file") or ""),
            )
        )
    return [item for item in chapters if item[0] and item[2]]


def load_paragraphs(source: Path) -> list[str]:
    if source.suffix.lower() == ".json":
        payload = json.loads(source.read_text(encoding="utf-8-sig"))
        pairs = payload.get("pairs") if isinstance(payload, dict) else None
        if isinstance(pairs, list):
            return [str(pair.get("o") or "") if isinstance(pair, dict) else "" for pair in pairs]
        raise ValueError(f"JSON 章节没有 pairs：{source}")
    return split_volume_paragraphs(source.read_text(encoding="utf-8-sig"))


def discover_books() -> list[str]:
    books_root = ROOT / "public" / "books"
    ids = []
    for path in sorted(books_root.iterdir()):
        if path.is_dir() and (path / "index.json").is_file() and re.fullmatch(r"[a-z0-9]+", path.name):
            ids.append(path.name)
    return ids


def book_size(book_id: str) -> int:
    book_dir = ROOT / "public" / "books" / book_id
    try:
        chapters = list_chapters(load_index(book_dir))
    except Exception:
        return 0
    return len(chapters)


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
    data: dict = {
        "defaultVoice": "serena",
        "voices": ["serena", "uncle_fu"],
        "chapters": {},
    }
    if CATALOG_PATH.is_file():
        try:
            loaded = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                if isinstance(loaded.get("chapters"), dict):
                    data["chapters"] = loaded["chapters"]
                if isinstance(loaded.get("voices"), list) and loaded["voices"]:
                    data["voices"] = loaded["voices"]
        except json.JSONDecodeError:
            pass

    key = f"{book_id}:{chapter_id}"
    entry = data["chapters"].get(key) if isinstance(data["chapters"].get(key), dict) else {}
    voices = entry.get("voices") if isinstance(entry.get("voices"), dict) else {}
    if not voices and isinstance(entry.get("pairs"), list):
        voices = {"serena": entry["pairs"]}
    voices[voice.lower()] = pairs
    data["chapters"][key] = {"title": title, "voices": voices}
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
    overwrite: bool = False,
) -> dict:
    source = book_dir / relative_file
    if not source.is_file():
        raise FileNotFoundError(f"找不到章节文件：{source}")

    paragraphs = load_paragraphs(source)
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
            if not overwrite and mp3_path.is_file() and mp3_path.stat().st_size > 0:
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
        if not overwrite and mp3_path.is_file() and mp3_path.stat().st_size > 0:
            skipped += 1
            print(f"  {stem} 已有 MP3，跳过", flush=True)
            continue

        if dry_run:
            print(f"  {stem} 将生成 {len(paragraph.strip())} 字", flush=True)
            continue

        wav_path = dest_dir / f"{stem}.generating.wav"
        cleanup_sidecars(wav_path)
        print(f"  {stem} 正在生成 · {len(paragraph.strip())} 字", flush=True)
        speak_paragraph(reader, paragraph.strip(), voice, language, wav_path)
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


def parse_voices(raw: str) -> list[str]:
    voices = []
    for item in raw.split(","):
        name = item.strip()
        if not name:
            continue
        if name.lower() == "uncle_fu":
            name = "Uncle_Fu"
        voices.append(name)
    return voices or ["Serena"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="为书目生成与阅读器对齐的 Qwen3-TTS 朗读音频")
    parser.add_argument("--book", help="书籍 id，例如 luxun；可与 --all-books 一起省略")
    parser.add_argument("--all-books", action="store_true", help="生成 public/books 下全部书目")
    parser.add_argument("--chapter", help="章节 id，例如 0-0 或 1")
    parser.add_argument("--all", action="store_true", help="生成该书全部章节")
    parser.add_argument("--limit", type=int, default=0, help="每本书最多生成前 N 章")
    parser.add_argument("--voice", help="单个音色，例如 Serena")
    parser.add_argument(
        "--voices",
        default="Serena,Uncle_Fu",
        help="逗号分隔音色，默认 Serena,Uncle_Fu",
    )
    parser.add_argument("--language", default="Chinese")
    parser.add_argument("--overwrite", action="store_true", help="覆盖已有 MP3")
    parser.add_argument("--dry-run", action="store_true", help="只列出分段，不调用模型")
    parser.add_argument("--publish", action="store_true", help="全部完成后上传又拍云")
    parser.add_argument("--publish-each", action="store_true", help="每本书生成后立刻上传")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    voices = [args.voice] if args.voice else parse_voices(args.voices)
    book_ids = discover_books() if args.all_books or not args.book else [args.book]
    if not book_ids:
        raise SystemExit("没有可生成的书目。")
    if args.book and not re.fullmatch(r"[a-z0-9]+", args.book):
        raise SystemExit(f"无效的书籍 id：{args.book}")
    if not args.all_books and not args.book:
        raise SystemExit("请指定 --book luxun，或使用 --all-books。")
    if not args.all_books and not args.chapter and not args.all:
        raise SystemExit("请指定 --chapter 0-0，或使用 --all / --all-books。")

    if args.all_books:
        book_ids = sorted(book_ids, key=book_size)

    reader = None
    if not args.dry_run:
        tts_root = resolve_tts_root()
        print(f"使用本地 TTS：{tts_root}", flush=True)
        print(f"音色：{', '.join(voices)}", flush=True)
        reader = load_reader(tts_root)

    for book_id in book_ids:
        book_dir = ROOT / "public" / "books" / book_id
        index = load_index(book_dir)
        chapters = list_chapters(index)
        if not chapters:
            print(f"跳过 {book_id}：没有章节", flush=True)
            continue

        selected = chapters
        if args.chapter and not args.all_books:
            selected = [item for item in chapters if item[0] == args.chapter]
            if not selected:
                raise SystemExit(f"找不到章节 {args.chapter}")
        if args.limit and args.limit > 0:
            selected = selected[: args.limit]

        print(f"\n======== {book_id} · {len(selected)} 章 ========", flush=True)
        summaries = []
        for voice in voices:
            for chapter_id, title, relative_file in selected:
                print(f"\n[{book_id}] {voice} {chapter_id} {title}", flush=True)
                summaries.append(
                    generate_chapter(
                        reader,
                        book_id=book_id,
                        book_dir=book_dir,
                        chapter_id=chapter_id,
                        title=title,
                        relative_file=relative_file,
                        voice=voice,
                        language=args.language,
                        dry_run=args.dry_run,
                        overwrite=args.overwrite,
                    )
                )

        generated = sum(item["generated"] for item in summaries)
        skipped = sum(item["skipped"] for item in summaries)
        print(f"\n{book_id} 完成：新生成 {generated}，已存在 {skipped}", flush=True)
        if (args.publish or args.publish_each) and not args.dry_run:
            print(f"正在上传 {book_id} …", flush=True)
            publish_audio(book_id)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n已中断。", file=sys.stderr)
        sys.exit(130)
    except Exception as error:
        print(f"运行失败：{error}", file=sys.stderr)
        sys.exit(1)
