import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import { apiRequest } from '@/lib/api'
import { logger } from '@/lib/logger'
import { normalizeNote } from '../utils/api'

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

function isLoadedNote(value: unknown): value is Note {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Note).id === 'number' &&
    typeof (value as Note).title === 'string' &&
    typeof (value as Note).content === 'string' &&
    typeof (value as Note).content_markdown === 'string' &&
    typeof (value as Note).is_draft === 'boolean'
  )
}

function isEditorNodeContent(value: unknown): value is { type: string; content?: unknown[] } {
  if (!value || typeof value !== 'object') {
    return false
  }

  const node = value as { type?: unknown; content?: unknown[]; text?: unknown }

  if (typeof node.type !== 'string') {
    return false
  }

  if (node.type === 'text') {
    return !('content' in node) && typeof node.text === 'string'
  }

  if (Array.isArray(node.content)) {
    return node.content.every(isEditorNodeContent)
  }

  if ('content' in node) {
    return false
  }

  if ('text' in node) {
    return false
  }

  return typeof node.text === 'undefined' || typeof node.text === 'string'
}

function isEditorDocumentContent(value: unknown): value is { type: 'doc'; content?: unknown[] } {
  return isEditorNodeContent(value) && value.type === 'doc'
}

export function useNoteLoader(noteId: string | string[]) {
  const currentNoteId = Array.isArray(noteId) ? noteId[0] : noteId
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedNoteId, setResolvedNoteId] = useState<string | null>(null)
  const previousNoteIdRef = useRef(currentNoteId)
  const loadSessionRef = useRef(0)

  const clearNoteContent = useCallback(() => {
    window.localStorage.removeItem('novel-content')
    window.localStorage.removeItem('markdown')
  }, [])

  useLayoutEffect(() => {
    if (previousNoteIdRef.current !== currentNoteId) {
      previousNoteIdRef.current = currentNoteId
      loadSessionRef.current += 1
      setResolvedNoteId(null)
      clearNoteContent()
    }
  }, [currentNoteId, clearNoteContent])

  const loadNoteContent = useCallback(
    (normalizedNote: Note) => {
      // 将笔记内容加载到 Novel 编辑器
      if (normalizedNote.content) {
        try {
          // 尝试解析内容，如果是有效的JSON则使用，否则创建默认内容
          const parsedContent = JSON.parse(normalizedNote.content)
          if (isEditorDocumentContent(parsedContent)) {
            window.localStorage.setItem('novel-content', JSON.stringify(parsedContent))
          } else {
            const defaultContent = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: normalizedNote.content ?? '',
                    },
                  ],
                },
              ],
            }
            window.localStorage.setItem('novel-content', JSON.stringify(defaultContent))
          }
        } catch {
          const defaultContent = {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: normalizedNote.content ?? '',
                  },
                ],
              },
            ],
          }
          window.localStorage.setItem('novel-content', JSON.stringify(defaultContent))
        }
      } else {
        clearNoteContent()
      }

      // 同时设置 markdown 内容
      if (normalizedNote.content_markdown) {
        window.localStorage.setItem('markdown', normalizedNote.content_markdown)
      } else {
        window.localStorage.removeItem('markdown')
      }
    },
    [clearNoteContent]
  )

  useEffect(() => {
    let isCurrentRequest = true
    const requestSession = loadSessionRef.current

    const fetchNote = async () => {
      setLoading(true)
      setError(null)
      clearNoteContent()

      try {
        const data = await apiRequest<Note | { note: Note }>(`/notes/${currentNoteId}`)

        if (!isCurrentRequest || loadSessionRef.current !== requestSession) {
          return
        }

        const normalizedNote = normalizeNote<Note>(data)
        if (!isLoadedNote(normalizedNote) || String(normalizedNote.id) !== currentNoteId) {
          logger.error('获取笔记返回了无效数据', data)
          setNote(null)
          setResolvedNoteId(currentNoteId)
          clearNoteContent()
          setError('无法加载笔记，请重试')
          return
        }

        setNote(normalizedNote)
        setResolvedNoteId(currentNoteId)
        loadNoteContent(normalizedNote)
      } catch (err) {
        if (!isCurrentRequest || loadSessionRef.current !== requestSession) {
          return
        }

        logger.error('获取笔记失败', err)
        setNote(null)
        setResolvedNoteId(currentNoteId)
        clearNoteContent()
        setError('无法加载笔记，请重试')
      } finally {
        if (isCurrentRequest) {
          setLoading(false)
        }
      }
    }

    fetchNote()

    return () => {
      isCurrentRequest = false
    }
  }, [currentNoteId, clearNoteContent, loadNoteContent])

  const hasStaleState = resolvedNoteId !== currentNoteId

  return {
    note: hasStaleState ? null : note,
    loading: loading || hasStaleState,
    error: hasStaleState ? null : error,
  }
}
