'use client'

import './novel-editor.css'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  EditorContent,
  EditorRoot,
  EditorDragHandle,
  handleImageDrop,
  handleImagePaste,
  type EditorInstance,
  type JSONContent,
} from './runtime'
import { defaultExtensions } from './extensions'
import { slashCommand } from './slash-command'
import { ColorSelector } from './selectors/color-selector'
import { LinkSelector } from './selectors/link-selector'
import { MathSelector } from './selectors/math-selector'
import { NodeSelector } from './selectors/node-selector'
import { TextButtons } from './selectors/text-buttons'
import { Separator } from './ui/separator'
import GenerativeMenuSwitch from './generative/generative-menu-switch'
import { uploadFn } from './image-upload'
import { countWords, extractTextFromJSON } from '@/lib/helpers/wordCount'

const extensions = [...defaultExtensions, slashCommand]
const emptyContent = (): JSONContent => ({ type: 'doc', content: [{ type: 'paragraph' }] })

interface TailwindAdvancedEditorProps {
  showStatusBar?: boolean
  onStatusChange?: (status: { saveStatus: string; wordCount?: number }) => void
}

export default function TailwindAdvancedEditor({
  showStatusBar = true,
  onStatusChange,
}: TailwindAdvancedEditorProps) {
  const pathname = usePathname()
  const initialContent = useMemo((): JSONContent => {
    if (typeof window === 'undefined' || pathname === '/note/new') return emptyContent()
    try {
      const stored = localStorage.getItem('novel-content')
      return stored ? JSON.parse(stored) : emptyContent()
    } catch {
      return emptyContent()
    }
  }, [pathname])
  const [saveStatus, setSaveStatus] = useState('Saved')
  const [charsCount, setCharsCount] = useState(0)
  const [openNode, setOpenNode] = useState(false)
  const [openColor, setOpenColor] = useState(false)
  const [openLink, setOpenLink] = useState(false)
  const [openAI, setOpenAI] = useState(false)

  useEffect(() => {
    onStatusChange?.({ saveStatus, wordCount: charsCount })
  }, [saveStatus, charsCount, onStatusChange])

  const persistDraft = (editor: EditorInstance) => {
    const json = editor.getJSON()
    setCharsCount(countWords(extractTextFromJSON(json)))
    try {
      // 保存按钮同步读取这些键；不能延迟写入，否则快速点击会丢掉最后输入的内容。
      localStorage.setItem('novel-content', JSON.stringify(json))
      localStorage.setItem('markdown', editor.getMarkdown())
      localStorage.setItem('html-content', editor.getHTML())
      setSaveStatus('Saved')
    } catch {
      setSaveStatus('Unsaved')
    }
  }

  return (
    <div className="relative w-full max-w-screen-lg">
      {showStatusBar && (
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          <div className="bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm">
            {saveStatus}
          </div>
          {charsCount > 0 && (
            <div className="bg-accent text-muted-foreground rounded-lg px-2 py-1 text-sm">
              {charsCount} Words
            </div>
          )}
        </div>
      )}
      <EditorRoot key={pathname}>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          className="border-border/80 bg-background relative min-h-[500px] w-full max-w-screen-lg rounded-[24px] border p-5 shadow-sm sm:mb-[calc(20vh)]"
          editorProps={{
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              role: 'textbox',
              'aria-label': '笔记正文',
              'aria-multiline': 'true',
              class:
                'prose prose-lg dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl font-sans focus:outline-none max-w-full',
            },
          }}
          onCreate={({ editor }) => persistDraft(editor)}
          onUpdate={({ editor }) => persistDraft(editor)}
        >
          <EditorDragHandle />
          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />
            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  )
}
export { default as MarkdownPreview } from './markdown-preview'
export { default as ReadonlyEditor } from './readonly'
