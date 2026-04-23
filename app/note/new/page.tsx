'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { logger } from '@/lib/logger'
import { Save, Loader2, Lock, Unlock } from 'lucide-react'
import { normalizeNote } from '../utils/api'
import { PageContainer } from '@/components/layout'

// 使用dynamic import避免服务端渲染问题
const TailwindAdvancedEditor = dynamic(() => import('@/components/novel-editor'), { ssr: false })

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

export default function NewNotePage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false) // 隐私状态
  const [editorSaveStatus, setEditorSaveStatus] = useState('Saved')
  const [editorWordCount, setEditorWordCount] = useState<number | undefined>(undefined)

  // 添加按钮交互状态
  const [privacyButtonHovered, setPrivacyButtonHovered] = useState(false)
  const [saveButtonHovered, setSaveButtonHovered] = useState(false)
  const [privacyButtonPressed, setPrivacyButtonPressed] = useState(false)
  const [saveButtonPressed, setSaveButtonPressed] = useState(false)

  // 在客户端组件挂载后设置为已加载，并清空编辑器内容
  useEffect(() => {
    // 清空之前的编辑器内容，确保新建笔记是空的
    window.localStorage.removeItem('novel-content')
    window.localStorage.removeItem('html-content')
    window.localStorage.removeItem('markdown')

    setIsLoaded(true)
  }, [])

  // 获取当前编辑器内容和markdown
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

  // 切换隐私状态
  const handleTogglePrivacy = useCallback(() => {
    setIsPrivate(!isPrivate)
  }, [isPrivate])

  const handleEditorStatusChange = useCallback(
    ({ saveStatus, wordCount }: { saveStatus: string; wordCount?: number }) => {
      setEditorSaveStatus(saveStatus)
      setEditorWordCount(wordCount)
    },
    []
  )

  // 保存笔记
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
        is_draft: isPrivate, // 私密状态对应 is_draft
      }

      const result = await apiRequest<Note | { note: Note }>('/notes', 'POST', data)
      const normalizedNote = normalizeNote<Note>(result)
      if (!normalizedNote) {
        throw new Error('创建笔记失败')
      }

      toast.success('笔记已创建')

      // 清除本地存储的内容
      window.localStorage.removeItem('novel-content')
      window.localStorage.removeItem('html-content')
      window.localStorage.removeItem('markdown')

      // 跳转到编辑页面
      router.push(`/note/edit/${normalizedNote.id}`)
    } catch (error) {
      logger.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, router, isPrivate])

  // 添加快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleSave()
        }
      }
      // Ctrl+Shift+P 或 Cmd+Shift+P 切换隐私状态
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        if (title.trim() && !isSaving) {
          handleTogglePrivacy()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [title, isSaving, handleSave, handleTogglePrivacy])

  return (
    <PageContainer className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 px-1 sm:px-2">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请输入笔记标题"
              className="h-12 flex-1 rounded-2xl border bg-background px-4 text-lg font-semibold shadow-sm placeholder:text-muted-foreground/80"
            />
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <div className="flex items-center gap-2">
                <div className="bg-accent text-muted-foreground rounded-lg px-2 py-1 text-xs sm:text-sm">
                  {editorSaveStatus}
                </div>
                <div
                  className={
                    editorWordCount
                      ? 'bg-accent text-muted-foreground rounded-lg px-2 py-1 text-xs sm:text-sm'
                      : 'hidden'
                  }
                >
                  {editorWordCount} Words
                </div>
              </div>
              <Button
                onClick={handleTogglePrivacy}
                onMouseEnter={() => setPrivacyButtonHovered(true)}
                onMouseLeave={() => setPrivacyButtonHovered(false)}
                onMouseDown={() => setPrivacyButtonPressed(true)}
                onMouseUp={() => setPrivacyButtonPressed(false)}
                variant="ghost"
                disabled={isSaving || !title.trim()}
                className="h-10 rounded-xl border bg-background px-3 text-sm text-muted-foreground shadow-sm hover:bg-muted/70 hover:text-foreground"
                title={`${isPrivate ? '切换为公开' : '切换为私密'} (Ctrl+Shift+P)`}
                style={{
                  transform: `translateY(${privacyButtonHovered ? '-1px' : '0'}) scale(${privacyButtonPressed ? '0.98' : '1'})`,
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: privacyButtonHovered ? '0 6px 14px rgba(15,23,42,0.08)' : 'none',
                }}
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : isPrivate ? (
                  <Lock className="mr-1.5 h-4 w-4" />
                ) : (
                  <Unlock className="mr-1.5 h-4 w-4" />
                )}
                {isPrivate ? '私密' : '公开'}
              </Button>
              <Button
                onClick={handleSave}
                onMouseEnter={() => setSaveButtonHovered(true)}
                onMouseLeave={() => setSaveButtonHovered(false)}
                onMouseDown={() => setSaveButtonPressed(true)}
                onMouseUp={() => setSaveButtonPressed(false)}
                disabled={isSaving || !title.trim()}
                className="h-10 rounded-xl px-4 text-sm shadow-sm"
                title="保存 (Ctrl+S)"
                style={{
                  transform: `translateY(${saveButtonHovered ? '-1px' : '0'}) scale(${saveButtonPressed ? '0.98' : '1'})`,
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: saveButtonHovered ? '0 8px 18px rgba(249,115,22,0.2)' : 'none',
                }}
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                保存笔记
              </Button>
            </div>
          </div>
        </div>

        {isLoaded && (
          <TailwindAdvancedEditor showStatusBar={false} onStatusChange={handleEditorStatusChange} />
        )}
      </div>
    </PageContainer>
  )
}
