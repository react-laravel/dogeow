import React from 'react'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'
import {
  isTipTapDocObject,
  resolveNoteRenderableContent,
  type NoteRenderableSource,
} from './noteUtils'

const ReadonlyEditor = dynamic(() => import('@/components/novel-editor/readonly'), { ssr: false })
const MarkdownPreview = dynamic(() => import('@/components/novel-editor/markdown-preview'), {
  ssr: false,
})

/**
 * 判断编辑器内容是否为空
 */
export function isEditorContentEmpty(parsedContent: {
  content?: Array<{ type: string; content?: Array<{ text: string }> }>
}): boolean {
  if (!parsedContent?.content || parsedContent.content.length === 0) {
    return true
  }
  if (parsedContent.content.length === 1) {
    const firstBlock = parsedContent.content[0]
    if (firstBlock.type === 'paragraph') {
      if (!firstBlock.content || firstBlock.content.length === 0) {
        return true
      }
      if (firstBlock.content.length === 1 && firstBlock.content[0].text === '') {
        return true
      }
    }
  }
  return false
}

function EmptyContent() {
  return (
    <div className="prose max-w-none py-8">
      <span className="text-gray-500 italic">(无内容)</span>
    </div>
  )
}

function renderFromSource(source: NoteRenderableSource) {
  if (source.kind === 'empty') {
    return <EmptyContent />
  }

  if (source.kind === 'tiptap') {
    if (isEditorContentEmpty(source.doc)) {
      return <EmptyContent />
    }
    try {
      return <ReadonlyEditor content={source.doc} />
    } catch (renderError) {
      logger.error('ReadonlyEditor render failed:', renderError)
      return (
        <div className="prose max-w-none py-8">
          <span className="text-gray-500 italic">(内容渲染失败)</span>
        </div>
      )
    }
  }

  if (source.kind === 'markdown') {
    return (
      <div className="prose max-w-none py-8">
        <MarkdownPreview content={source.markdown} />
      </div>
    )
  }

  return (
    <div className="prose max-w-none py-8">
      <pre className="whitespace-pre-wrap">{source.text}</pre>
    </div>
  )
}

/**
 * 渲染笔记内容（仅 content 字符串，兼容旧调用）
 */
export function renderNoteContent(content: string) {
  if (!content || !content.trim()) {
    return <EmptyContent />
  }

  try {
    const parsedContent: unknown = JSON.parse(content)
    if (isTipTapDocObject(parsedContent)) {
      return renderFromSource({
        kind: 'tiptap',
        doc: parsedContent as Record<string, unknown>,
      })
    }
  } catch (error) {
    logger.error('Failed to parse note content:', error)
  }

  return renderFromSource({ kind: 'plain', text: content })
}

/**
 * 渲染笔记详情：同时考虑 content 与 content_markdown
 */
export function renderNoteDetailContent(note: {
  content?: string | null
  content_markdown?: string | null
}) {
  const source = resolveNoteRenderableContent({
    content: note.content ?? '',
    content_markdown: note.content_markdown ?? '',
  })
  return renderFromSource(source)
}
