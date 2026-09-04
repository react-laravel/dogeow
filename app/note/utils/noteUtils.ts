/**
 * Note 模块的实用函数
 */

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Note } from '../types/note'
import { extractTextFromJSON } from '@/lib/helpers/wordCount'

const CONTENT_PREVIEW_MAX_LENGTH = 150

/**
 * 格式化日期
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  } catch {
    return dateString
  }
}

/**
 * 从 HTML 或 Markdown 内容中获取预览文本
 */
export const getContentPreview = (
  content: string,
  maxLength = CONTENT_PREVIEW_MAX_LENGTH
): string => {
  if (!content) return ''

  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*(?:[-*_]\s*){3,}$/gm, '')
    .replace(/[#*`>]/g, '')
    .trim()

  return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText
}

/**
 * 判断字符串是否为 TipTap / ProseMirror 文档 JSON
 */
export function isTipTapDocJson(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)
    return isTipTapDocObject(parsed)
  } catch {
    return false
  }
}

/**
 * 判断解析后的对象是否为 TipTap / ProseMirror 文档
 */
export function isTipTapDocObject(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const doc = value as Record<string, unknown>
  return doc.type === 'doc' && Array.isArray(doc.content)
}

/**
 * 从编辑器 JSON 中提取文本
 */
const extractTextFromEditorJSON = (jsonContent: unknown): string => {
  if (!jsonContent || typeof jsonContent !== 'object') {
    return ''
  }

  let text = ''

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return

    const nodeObj = node as Record<string, unknown>

    if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
      text += nodeObj.text
    } else if (nodeObj.type === 'paragraph' && text && !text.endsWith('\n')) {
      if (text.length > 0) {
        text += '\n'
      }
    }

    if (nodeObj.content && Array.isArray(nodeObj.content)) {
      nodeObj.content.forEach(traverse)
    }
  }

  traverse(jsonContent)
  return text.trim()
}

/**
 * 从可能是 TipTap JSON 字符串的内容中提取纯文本
 */
export function extractPlainTextFromContent(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsedContent: unknown = JSON.parse(trimmed)
      if (isTipTapDocObject(parsedContent)) {
        let extractedText = extractTextFromJSON(parsedContent)
        if (!extractedText || !extractedText.trim()) {
          extractedText = extractTextFromEditorJSON(parsedContent)
        }
        return extractedText.trim()
      }

      // Valid JSON but not a TipTap doc — never surface raw JSON as preview text
      let extractedText = extractTextFromJSON(parsedContent)
      if (!extractedText || !extractedText.trim()) {
        extractedText = extractTextFromEditorJSON(parsedContent)
      }
      return extractedText.trim()
    } catch {
      // not JSON — fall through to markdown/html stripping
    }
  }

  return getContentPreview(trimmed, Number.POSITIVE_INFINITY)
}

/**
 * 判断笔记是否有内容
 */
export const hasNoteContent = (note: Pick<Note, 'content' | 'content_markdown'>): boolean => {
  if (note.content_markdown && note.content_markdown.trim()) {
    const markdownText = extractPlainTextFromContent(note.content_markdown)
    if (markdownText.trim().length > 0) {
      return true
    }
    // TipTap / JSON 空文档：继续检查 content 字段
    if (looksLikeJson(note.content_markdown)) {
      // fall through
    } else {
      return true
    }
  }

  if (note.content && note.content.trim()) {
    const contentText = extractPlainTextFromContent(note.content)
    if (contentText.trim().length > 0) {
      return true
    }
    if (looksLikeJson(note.content)) {
      return false
    }
    return true
  }

  return false
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false
  }
  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

/**
 * 截断预览文本
 */
function truncatePreview(text: string, maxLength: number): string {
  const cleanedText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleanedText) return ''
  return cleanedText.length > maxLength ? `${cleanedText.substring(0, maxLength)}...` : cleanedText
}

/**
 * 获取笔记预览文本（优先可读纯文本，绝不回退展示原始 TipTap JSON）
 */
export const getNotePreviewText = (
  note: Pick<Note, 'content' | 'content_markdown'>,
  maxLength = CONTENT_PREVIEW_MAX_LENGTH
): string => {
  if (note.content_markdown && note.content_markdown.trim()) {
    const fromMarkdown = extractPlainTextFromContent(note.content_markdown)
    if (fromMarkdown) {
      return truncatePreview(fromMarkdown, maxLength)
    }
    // TipTap 空文档：继续尝试 content 字段
    if (!isTipTapDocJson(note.content_markdown)) {
      return ''
    }
  }

  if (note.content && note.content.trim()) {
    const fromContent = extractPlainTextFromContent(note.content)
    return truncatePreview(fromContent, maxLength)
  }

  return ''
}

export type NoteRenderableSource =
  | { kind: 'tiptap'; doc: Record<string, unknown> }
  | { kind: 'markdown'; markdown: string }
  | { kind: 'plain'; text: string }
  | { kind: 'empty' }

/**
 * 解析笔记详情页应渲染的内容来源
 * 兼容 content / content_markdown 任一字段存放 TipTap JSON 或 Markdown 的情况
 */
export function resolveNoteRenderableContent(
  note: Pick<Note, 'content' | 'content_markdown'>
): NoteRenderableSource {
  const candidates = [note.content, note.content_markdown].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  )

  for (const candidate of candidates) {
    const trimmed = candidate.trim()
    if (isTipTapDocJson(trimmed)) {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (isTipTapDocObject(parsed)) {
          return { kind: 'tiptap', doc: parsed as Record<string, unknown> }
        }
      } catch {
        // continue
      }
    }
  }

  // Prefer markdown field for non-JSON markdown
  if (
    note.content_markdown &&
    note.content_markdown.trim() &&
    !isTipTapDocJson(note.content_markdown)
  ) {
    return { kind: 'markdown', markdown: note.content_markdown }
  }

  if (note.content && note.content.trim() && !isTipTapDocJson(note.content)) {
    return { kind: 'plain', text: note.content }
  }

  return { kind: 'empty' }
}
