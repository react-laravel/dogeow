'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { logger } from '@/lib/logger'
import { normalizeNote } from '../utils/api'
import { PageContainer } from '@/components/layout'
import { NoteEditorToolbar } from '../components/NoteEditorToolbar'
import { useNoteShortcuts } from '../hooks/useNoteShortcuts'

const TailwindAdvancedEditor = dynamic(() => import('@/components/novel-editor'), { ssr: false })

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

function EditorLoadingPlaceholder() {
  return (
    <div className="animate-pulse space-y-2" role="status" aria-label="编辑器加载中">
      <div className="flex justify-end gap-2 pr-1">
        <div className="bg-muted h-7 w-16 rounded-lg" />
        <div className="bg-muted h-7 w-20 rounded-lg" />
      </div>
      <div className="border-border/80 bg-muted/30 min-h-[500px] rounded-[24px] border" />
    </div>
  )
}

export default function NewNotePage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    window.localStorage.removeItem('novel-content')
    window.localStorage.removeItem('html-content')
    window.localStorage.removeItem('markdown')
    setIsLoaded(true)
  }, [])

  const getCurrentContent = () => {
    const content = window.localStorage.getItem('novel-content')
    const markdown = window.localStorage.getItem('markdown')
    return {
      content:
        content ||
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
      markdown: markdown ?? '',
    }
  }

  const handleTogglePrivacy = useCallback(() => {
    setIsPrivate(current => !current)
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()

    try {
      setIsSaving(true)

      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: isPrivate,
      }

      const result = await apiRequest<Note | { note: Note }>('/notes', 'POST', data)
      const normalizedNote = normalizeNote<Note>(result)
      if (!normalizedNote) {
        throw new Error('创建笔记失败')
      }

      toast.success('笔记已创建')

      window.localStorage.removeItem('novel-content')
      window.localStorage.removeItem('html-content')
      window.localStorage.removeItem('markdown')

      router.push(`/note/edit/${normalizedNote.id}`)
    } catch (error) {
      logger.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, router, isPrivate])

  useNoteShortcuts({
    title,
    isSaving,
    onSave: handleSave,
    onTogglePrivacy: handleTogglePrivacy,
  })

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-screen-lg">
        <NoteEditorToolbar
          title={title}
          isPrivate={isPrivate}
          isSaving={isSaving}
          onTitleChange={setTitle}
          onSave={handleSave}
          onTogglePrivacy={handleTogglePrivacy}
        />

        {isLoaded ? <TailwindAdvancedEditor /> : <EditorLoadingPlaceholder />}
      </div>
    </PageContainer>
  )
}
