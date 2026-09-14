#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from narration_progress import (  # noqa: E402
    TITLE_INSTRUCT,
    instruct_for_paragraph,
    is_chapter_published,
    mark_chapter_published,
    order_book_ids,
    parse_book_list,
    scan_progress,
)


class NarrationProgressTest(unittest.TestCase):
    def test_orders_luxun_before_smaller_books(self) -> None:
        sizes = {"leiyu": 7, "luxun": 512, "biancheng": 21, "laorenyuhai": 4}
        ordered = order_book_ids(["leiyu", "luxun", "biancheng", "laorenyuhai"], sizes.__getitem__)
        self.assertEqual(ordered[0], "luxun")
        self.assertEqual(ordered[1:], ["laorenyuhai", "leiyu", "biancheng"])

    def test_parse_book_list(self) -> None:
        self.assertEqual(parse_book_list("luxun, laorenyuhai"), ["luxun", "laorenyuhai"])

    def test_title_paragraph_gets_calm_instruct(self) -> None:
        self.assertEqual(instruct_for_paragraph("一件小事", "一件小事"), TITLE_INSTRUCT)
        self.assertIsNone(instruct_for_paragraph("我从乡下跑到京城里，一转眼已经六年了。", "一件小事"))
        self.assertIsNone(instruct_for_paragraph("  ", "一件小事"))

    def test_generation_script_keeps_empty_body_instruct(self) -> None:
        source = Path(__file__).resolve().parent.parent / "generate-book-narration.py"
        text = source.read_text(encoding="utf-8")
        self.assertIn("instruct_for_paragraph", text)
        self.assertNotIn("不要阴郁", text)
        self.assertIn("generate_custom_voice", text)

    def test_scan_and_published_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            book = root / "luxun"
            chapter = book / "第1卷"
            chapter.mkdir(parents=True)
            (chapter / "一件小事.txt").write_text("标题\n\n正文一段。\n", encoding="utf-8")
            (book / "index.json").write_text(
                json.dumps(
                    {
                        "title": "鲁迅全集",
                        "volumes": [{"name": "第1卷", "chapters": [{"name": "一件小事", "file": "第1卷/一件小事.txt"}]}],
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            audio = book / "audio" / "serena" / "0-0"
            audio.mkdir(parents=True)
            (audio / "000.mp3").write_bytes(b"x")
            (audio / "001.mp3").write_bytes(b"x")
            self.assertFalse(is_chapter_published(book, "0-0"))
            mark_chapter_published(book, "0-0", ["serena", "uncle_fu"])
            self.assertTrue(is_chapter_published(book, "0-0"))
            snapshot = scan_progress(root)
            self.assertEqual(snapshot["books"][0]["id"], "luxun")
            self.assertEqual(snapshot["books"][0]["publishedChapters"], 1)
            self.assertEqual(snapshot["books"][0]["voices"]["serena"]["have"], 2)
            self.assertEqual(snapshot["books"][0]["voices"]["uncle_fu"]["have"], 0)


if __name__ == "__main__":
    unittest.main()
