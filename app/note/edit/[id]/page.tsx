'use client'

import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import { createMutation } from '@/lib/api'
import { logger } from '@/lib/logger'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { useNoteLoader } from '../../hooks/useNoteLoader'
import { useNoteContent } from '../../hooks/useNoteContent'
import { useNoteShortcuts } from '../../hooks/useNoteShortcuts'
import { NoteEditorToolbar } from '../../components/NoteEditorToolbar'
import { NoteLoadingState } from '../../components/NoteLoadingState'
import { NoteErrorState } from '../../components/NoteErrorState'
import { PageContainer } from '@/components/layout'
import {
  addInFlightNoteMutation,
  hasInFlightNoteMutation as getHasInFlightNoteMutation,
  removeInFlightNoteMutation,
  subscribeToInFlightNoteMutations,
} from './noteMutationLockStore'

// 使用dynamic import避免服务端渲染问题
const TailwindAdvancedEditor = dynamic(() => import('@/components/novel-editor'), { ssr: false })

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

// 笔记编辑页面
export default function EditNotePage() {
  const { id } = useParams()
  const noteId = id ? (Array.isArray(id) ? id[0] : id) : ''
  const { note, loading, error } = useNoteLoader(noteId)
  const { getCurrentContent } = useNoteContent()
  const [clientReady, setClientReady] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false) // 隐私状态
  const activeNoteIdRef = useRef(noteId)
  const previousNoteIdRef = useRef(noteId)
  const noteSessionRef = useRef(0)
  const isMountedRef = useRef(true)
  const mutationInFlightRef = useRef(false)
  const hasInFlightNoteMutation = useSyncExternalStore(
    subscribeToInFlightNoteMutations,
    () => getHasInFlightNoteMutation(noteId),
    () => false
  )

  useLayoutEffect(() => {
    activeNoteIdRef.current = noteId

    if (previousNoteIdRef.current !== noteId) {
      previousNoteIdRef.current = noteId
      noteSessionRef.current += 1
      mutationInFlightRef.current = false
      setIsSaving(false)
    }
  }, [noteId])

  useEffect(() => {
    // 标记客户端组件已加载
    setClientReady(true)
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (loading || !note) {
      setTitle('')
      setIsPrivate(false)
      return
    }

    if (note) {
      setTitle(note.title)
      setIsPrivate(note.is_draft) // 设置初始隐私状态
    }
  }, [loading, note])

  // 切换隐私状态
  const handleTogglePrivacy = useCallback(async () => {
    const requestNoteId = noteId
    const requestSession = noteSessionRef.current

    if (
      loading ||
      !note ||
      mutationInFlightRef.current ||
      getHasInFlightNoteMutation(requestNoteId)
    ) {
      return
    }

    if (activeNoteIdRef.current !== requestNoteId || noteSessionRef.current !== requestSession) {
      return
    }

    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()
    const newPrivacyStatus = !isPrivate

    try {
      mutationInFlightRef.current = true
      addInFlightNoteMutation(requestNoteId)
      setIsSaving(true)

      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: newPrivacyStatus, // 私密状态对应 is_draft
      }

      const updateNote = createMutation<Note>(`/notes/${noteId}`, 'PUT', { handleError: false })
      await updateNote(data)

      if (
        !isMountedRef.current ||
        activeNoteIdRef.current !== requestNoteId ||
        noteSessionRef.current !== requestSession
      ) {
        return
      }

      setIsPrivate(newPrivacyStatus)
      toast.success(newPrivacyStatus ? '已私密' : '已公开')
    } catch (error) {
      if (
        !isMountedRef.current ||
        activeNoteIdRef.current !== requestNoteId ||
        noteSessionRef.current !== requestSession
      ) {
        return
      }

      logger.error('切换隐私状态错误:', error)
      toast.error('操作失败')
    } finally {
      removeInFlightNoteMutation(requestNoteId)
      if (isMountedRef.current && activeNoteIdRef.current === requestNoteId) {
        if (noteSessionRef.current === requestSession) {
          mutationInFlightRef.current = false
        }

        setIsSaving(getHasInFlightNoteMutation(requestNoteId))
      }
    }
  }, [title, noteId, isPrivate, getCurrentContent, loading, note])

  // 保存笔记
  const handleSave = useCallback(async () => {
    const requestNoteId = noteId
    const requestSession = noteSessionRef.current

    if (
      loading ||
      !note ||
      mutationInFlightRef.current ||
      getHasInFlightNoteMutation(requestNoteId)
    ) {
      return
    }

    if (activeNoteIdRef.current !== requestNoteId || noteSessionRef.current !== requestSession) {
      return
    }

    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()

    try {
      mutationInFlightRef.current = true
      addInFlightNoteMutation(requestNoteId)
      setIsSaving(true)

      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: isPrivate, // 保持当前隐私状态
      }

      const updateNote = createMutation<Note>(`/notes/${noteId}`, 'PUT', { handleError: false })
      await updateNote(data)

      if (
        !isMountedRef.current ||
        activeNoteIdRef.current !== requestNoteId ||
        noteSessionRef.current !== requestSession
      ) {
        return
      }

      toast.success('笔记已更新')
    } catch (error) {
      if (
        !isMountedRef.current ||
        activeNoteIdRef.current !== requestNoteId ||
        noteSessionRef.current !== requestSession
      ) {
        return
      }

      logger.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      removeInFlightNoteMutation(requestNoteId)
      if (isMountedRef.current && activeNoteIdRef.current === requestNoteId) {
        if (noteSessionRef.current === requestSession) {
          mutationInFlightRef.current = false
        }

        setIsSaving(getHasInFlightNoteMutation(requestNoteId))
      }
    }
  }, [title, noteId, isPrivate, getCurrentContent, loading, note])

  // 添加快捷键支持
  useNoteShortcuts({
    title,
    isSaving: isSaving || loading || !note || hasInFlightNoteMutation,
    onSave: handleSave,
    onTogglePrivacy: handleTogglePrivacy,
  })

  if (loading) {
    return <NoteLoadingState />
  }

  if (error) {
    return <NoteErrorState message={error} variant="error" />
  }

  if (!note) {
    return <NoteErrorState message="找不到笔记" variant="warning" />
  }

  return (
    <PageContainer>
      <div className="flex justify-center">
        <div className="w-full max-w-screen-lg">
          <NoteEditorToolbar
            title={title}
            isPrivate={isPrivate}
            isSaving={isSaving || hasInFlightNoteMutation}
            onTitleChange={setTitle}
            onSave={handleSave}
            onTogglePrivacy={handleTogglePrivacy}
          />

          {/* Novel 编辑器 */}
          {clientReady && <TailwindAdvancedEditor />}
        </div>
      </div>
    </PageContainer>
  )
}
