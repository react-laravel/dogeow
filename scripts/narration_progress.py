#!/usr/bin/env python3
"""Scan and display book narration progress. Resume is skip-existing MP3s."""
from __future__ import annotations

import json
import os
import re
import time
from datetime import datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
BOOKS_ROOT = ROOT / "public" / "books"
STATE_DIR = ROOT / ".narration"
PROGRESS_PATH = STATE_DIR / "progress.json"
PUBLISHED_NAME = ".upyun-published.json"
PRIORITY_BOOKS = ["luxun"]
DEFAULT_VOICES = ("serena", "uncle_fu")
TITLE_INSTRUCT = "用平常说话的口吻、自然的语速朗读。"
TZ = timezone(timedelta(hours=8))

DASHBOARD_HTML = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>听书 TTS 进度</title>
  <style>
    :root { color-scheme: dark; }
    body { font: 14px/1.45 ui-sans-serif, system-ui, sans-serif; margin: 24px; background: #111827; color: #e5e7eb; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
    .meta { color: #9ca3af; margin-bottom: 16px; }
    .current { background: #1f2937; border: 1px solid #374151; padding: 12px 16px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #1f2937; white-space: nowrap; }
    th { color: #9ca3af; font-weight: 500; }
    tr.current-row { background: #1e3a5f; }
    .done { color: #34d399; }
    .wait { color: #9ca3af; }
    .run { color: #93c5fd; }
    .bar { height: 6px; background: #1f2937; width: 88px; display: inline-block; vertical-align: middle; margin-right: 8px; }
    .bar > span { display: block; height: 100%; background: #3b82f6; }
  </style>
</head>
<body>
  <h1>听书 TTS 进度</h1>
  <div class="meta" id="meta">读取中…</div>
  <div class="current" id="current" hidden></div>
  <table>
    <thead>
      <tr>
        <th>书</th><th>章节</th><th>Serena</th><th>Uncle Fu</th><th>合计</th><th>又拍云</th><th>状态</th>
      </tr>
    </thead>
    <tbody id="rows"></tbody>
  </table>
  <script>
    const fmtPct = (n) => (n * 100).toFixed(2) + '%';
    const bar = (n) => '<span class="bar"><span style="width:' + Math.min(100, n * 100).toFixed(1) + '%"></span></span>';
    async function refresh() {
      const data = await fetch('/progress.json?t=' + Date.now()).then(r => r.json());
      const running = data.running ? '运行中' : '未在生成';
      document.getElementById('meta').textContent =
        running + ' · 更新 ' + (data.updatedAt || '—') + ' · 合计 ' +
        data.have + '/' + data.need + ' 段 (' + fmtPct(data.percent) + ') · 每 5 秒刷新';
      const cur = data.current;
      const box = document.getElementById('current');
      if (cur && data.running) {
        box.hidden = false;
        box.textContent = '正在处理：' + (cur.bookTitle || cur.bookId) +
          ' · ' + (cur.voice || '') + ' · ' + (cur.chapterTitle || cur.chapterId) +
          ' · 第 ' + ((cur.pairIndex || 0) + 1) + '/' + (cur.pairCount || '?') + ' 段' +
          (cur.phase ? ' · ' + cur.phase : '');
      } else {
        box.hidden = true;
      }
      document.getElementById('rows').innerHTML = (data.books || []).map((book) => {
        const cls = book.id === (cur && cur.bookId) && data.running ? 'current-row' : '';
        const serena = (book.voices.serena && book.voices.serena.percent) || 0;
        const uncle = (book.voices.uncle_fu && book.voices.uncle_fu.percent) || 0;
        const upyun = book.publishedChapters + '/' + book.chapters + ' 章';
        return '<tr class="' + cls + '"><td>' + book.title + '</td><td>' +
          book.chaptersDone + '/' + book.chapters + '</td><td>' + bar(serena) + fmtPct(serena) +
          '</td><td>' + bar(uncle) + fmtPct(uncle) + '</td><td>' + bar(book.percent) + fmtPct(book.percent) +
          '</td><td>' + upyun + '</td><td class="' + book.statusClass + '">' + book.status + '</td></tr>';
      }).join('');
    }
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>
"""


def now_iso() -> str:
    return datetime.now(TZ).strftime("%Y-%m-%d %H:%M:%S")


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def split_volume_paragraphs(text: str) -> list[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return [part for part in re.split(r"\n{2,}", text) if part]


def load_index(book_dir: Path) -> dict:
    return json.loads((book_dir / "index.json").read_text(encoding="utf-8"))


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


def paragraph_count(source: Path) -> int:
    if not source.is_file():
        return 0
    if source.suffix.lower() == ".json":
        payload = json.loads(source.read_text(encoding="utf-8-sig"))
        pairs = payload.get("pairs") if isinstance(payload, dict) else None
        return len(pairs) if isinstance(pairs, list) else 0
    return len(split_volume_paragraphs(source.read_text(encoding="utf-8-sig")))


def discover_books(books_root: Path = BOOKS_ROOT) -> list[str]:
    ids = []
    for path in sorted(books_root.iterdir()):
        if path.is_dir() and (path / "index.json").is_file() and re.fullmatch(r"[a-z0-9]+", path.name):
            ids.append(path.name)
    return ids


def order_book_ids(book_ids: list[str], size_of: Callable[[str], int]) -> list[str]:
    remaining = [book_id for book_id in book_ids if book_id not in PRIORITY_BOOKS]
    remaining.sort(key=size_of)
    return [book_id for book_id in PRIORITY_BOOKS if book_id in book_ids] + remaining


def parse_book_list(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def instruct_for_paragraph(text: str, title: str = "") -> str | None:
    """Short chapter titles get a calm prompt; body text stays empty like 7860."""
    stripped = text.strip()
    if stripped and title.strip() and stripped == title.strip():
        return TITLE_INSTRUCT
    return None


def published_path(book_dir: Path) -> Path:
    return book_dir / "audio" / PUBLISHED_NAME


def load_published(book_dir: Path) -> dict[str, Any]:
    path = published_path(book_dir)
    if not path.is_file():
        return {"chapters": {}}
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"chapters": {}}
    chapters = loaded.get("chapters") if isinstance(loaded.get("chapters"), dict) else {}
    return {"chapters": chapters, "bookAt": loaded.get("bookAt")}


def is_chapter_published(book_dir: Path, chapter_id: str) -> bool:
    return chapter_id in load_published(book_dir)["chapters"]


def mark_chapter_published(book_dir: Path, chapter_id: str, voices: list[str]) -> None:
    data = load_published(book_dir)
    data["chapters"][chapter_id] = {"at": now_iso(), "voices": voices}
    atomic_write_json(published_path(book_dir), data)


def chapter_has_audio(book_dir: Path, chapter_id: str, voices: list[str]) -> bool:
    for voice in voices:
        dest = book_dir / "audio" / voice.lower() / chapter_id
        if dest.is_dir() and any(dest.glob("*.mp3")):
            return True
    return False


def pid_alive(pid: int | None) -> bool:
    if not pid:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def load_progress() -> dict[str, Any]:
    if not PROGRESS_PATH.is_file():
        return {}
    try:
        loaded = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return loaded if isinstance(loaded, dict) else {}


def update_live(current: dict[str, Any], *, pid: int | None = None, running: bool = True) -> None:
    data = load_progress()
    data["current"] = current
    data["pid"] = pid if pid is not None else os.getpid()
    data["running"] = running
    data["updatedAt"] = now_iso()
    atomic_write_json(PROGRESS_PATH, data)


def scan_progress(
    books_root: Path = BOOKS_ROOT,
    voices: tuple[str, ...] = DEFAULT_VOICES,
    current: dict[str, Any] | None = None,
    running: bool = False,
    pid: int | None = None,
    queue: list[str] | None = None,
) -> dict[str, Any]:
    books = []
    total_need = 0
    total_have = 0
    current_book = (current or {}).get("bookId")
    for book_id in discover_books(books_root):
        book_dir = books_root / book_id
        index = load_index(book_dir)
        chapters = list_chapters(index)
        published = load_published(book_dir)
        voice_stats: dict[str, dict[str, Any]] = {}
        need = 0
        have = 0
        chapters_done = 0
        for chapter_id, _title, relative_file in chapters:
            n = paragraph_count(book_dir / relative_file)
            need += n * len(voices)
            chapter_complete = True
            for voice in voices:
                mp3s = 0
                dest = book_dir / "audio" / voice / chapter_id
                if dest.is_dir():
                    mp3s = len(list(dest.glob("*.mp3")))
                have += mp3s
                if mp3s < n:
                    chapter_complete = False
            if chapter_complete and n > 0:
                chapters_done += 1
        for voice in voices:
            voice_need = need // len(voices) if voices else 0
            voice_have = 0
            for chapter_id, _title, _relative in chapters:
                dest = book_dir / "audio" / voice / chapter_id
                if dest.is_dir():
                    voice_have += len(list(dest.glob("*.mp3")))
            voice_stats[voice] = {
                "have": voice_have,
                "need": voice_need,
                "percent": (voice_have / voice_need) if voice_need else 0.0,
            }
        percent = (have / need) if need else 0.0
        published_chapters = len(published["chapters"])
        if percent >= 1:
            status, status_class = "完成", "done"
        elif current_book == book_id and running:
            status, status_class = "进行中", "run"
        elif have > 0:
            status, status_class = "未完成，可续跑", "wait"
        else:
            status, status_class = "排队", "wait"
        books.append(
            {
                "id": book_id,
                "title": str(index.get("title") or book_id),
                "chapters": len(chapters),
                "chaptersDone": chapters_done,
                "have": have,
                "need": need,
                "percent": percent,
                "voices": voice_stats,
                "publishedChapters": published_chapters,
                "published": published_chapters >= len(chapters) and len(chapters) > 0,
                "status": status,
                "statusClass": status_class,
            }
        )
        total_need += need
        total_have += have

    ordered_ids = order_book_ids([book["id"] for book in books], lambda book_id: next(b["need"] for b in books if b["id"] == book_id))
    by_id = {book["id"]: book for book in books}
    books = [by_id[book_id] for book_id in ordered_ids if book_id in by_id]
    return {
        "updatedAt": now_iso(),
        "running": running,
        "pid": pid,
        "current": current,
        "queue": queue or ordered_ids,
        "have": total_have,
        "need": total_need,
        "percent": (total_have / total_need) if total_need else 0.0,
        "books": books,
    }


def write_snapshot(snapshot: dict[str, Any]) -> None:
    atomic_write_json(PROGRESS_PATH, snapshot)


def format_table(snapshot: dict[str, Any]) -> str:
    lines = [
        f"听书 TTS  {'运行中' if snapshot.get('running') else '未在生成'} · {snapshot.get('updatedAt')}",
        f"合计 {snapshot.get('have')}/{snapshot.get('need')} 段 ({(snapshot.get('percent') or 0) * 100:.2f}%)",
    ]
    current = snapshot.get("current")
    if current and snapshot.get("running"):
        lines.append(
            "当前 {bookTitle} · {voice} · {chapterTitle} · {pair}/{total} · {phase}".format(
                bookTitle=current.get("bookTitle") or current.get("bookId"),
                voice=current.get("voice") or "",
                chapterTitle=current.get("chapterTitle") or current.get("chapterId"),
                pair=(current.get("pairIndex") or 0) + 1,
                total=current.get("pairCount") or "?",
                phase=current.get("phase") or "",
            )
        )
    lines.append("")
    header = f"{'书':<16}{'章节':<10}{'Serena':<10}{'Uncle Fu':<10}{'合计':<10}{'又拍云':<12}状态"
    lines.append(header)
    for book in snapshot.get("books") or []:
        serena = book.get("voices", {}).get("serena", {}).get("percent") or 0
        uncle = book.get("voices", {}).get("uncle_fu", {}).get("percent") or 0
        lines.append(
            f"{book['title']:<16}{book['chaptersDone']}/{book['chapters']:<8}"
            f"{serena * 100:>6.2f}%  {uncle * 100:>6.2f}%  {book['percent'] * 100:>6.2f}%  "
            f"{book['publishedChapters']}/{book['chapters']} 章   {book['status']}"
        )
    return "\n".join(lines)


def merge_live(snapshot: dict[str, Any]) -> dict[str, Any]:
    live = load_progress()
    pid = live.get("pid") if isinstance(live.get("pid"), int) else None
    running = bool(live.get("running")) and pid_alive(pid)
    current = live.get("current") if running and isinstance(live.get("current"), dict) else snapshot.get("current")
    snapshot["pid"] = pid if running else None
    snapshot["running"] = running
    snapshot["current"] = current if running else None
    if running:
        current_book = (current or {}).get("bookId")
        for book in snapshot["books"]:
            if book["id"] == current_book:
                book["status"] = "进行中"
                book["statusClass"] = "run"
            elif book["percent"] >= 1:
                book["status"] = "完成"
                book["statusClass"] = "done"
    return snapshot


def print_status(books_root: Path = BOOKS_ROOT) -> None:
    snapshot = merge_live(scan_progress(books_root))
    write_snapshot(snapshot)
    print(format_table(snapshot), flush=True)


def watch_status(interval: int = 30, books_root: Path = BOOKS_ROOT) -> None:
    while True:
        print("\033[2J\033[H", end="")
        print_status(books_root)
        time.sleep(max(5, interval))


def serve_dashboard(port: int = 7861, interval: int = 5, books_root: Path = BOOKS_ROOT) -> None:
    snapshot = merge_live(scan_progress(books_root))
    write_snapshot(snapshot)

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            path = urlparse(self.path).path
            if path in ("/", "/index.html"):
                body = DASHBOARD_HTML.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if path == "/progress.json":
                payload = PROGRESS_PATH.read_bytes() if PROGRESS_PATH.is_file() else b"{}"
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return
            self.send_error(404)

        def log_message(self, format: str, *args: Any) -> None:
            return

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"进度看板：http://127.0.0.1:{port}/", flush=True)
    print("每 {0} 秒刷新磁盘进度；生成进程会写入当前段落。".format(interval), flush=True)

    def loop() -> None:
        while True:
            write_snapshot(merge_live(scan_progress(books_root)))
            time.sleep(max(2, interval))

    import threading

    threading.Thread(target=loop, daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n看板已停止。", flush=True)
