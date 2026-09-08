// Adapted for Tiptap 3 from Novel 1.x (Apache-2.0); see NOTICE.md.
'use client'

import { Fragment, forwardRef, useEffect, useRef, type HTMLAttributes } from 'react'
import { EditorProvider, useCurrentEditor, type EditorProviderProps } from '@tiptap/react'
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus'
import { isNodeSelection, type Editor, type JSONContent } from '@tiptap/core'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import { GripVertical } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'

export const EditorRoot = Fragment
export { useCurrentEditor as useEditor }
export type { Editor as EditorInstance, JSONContent } from '@tiptap/core'

function SyncContent({ content }: { content?: JSONContent | null }) {
  const { editor } = useCurrentEditor()
  const serialized = JSON.stringify(content)
  const previous = useRef(serialized)
  useEffect(() => {
    if (!editor || previous.current === serialized) return
    previous.current = serialized
    editor.commands.setContent(content ?? { type: 'doc', content: [] }, { emitUpdate: false })
  }, [content, editor, serialized])
  return null
}

export function EditorContent({
  initialContent,
  className,
  children,
  ...props
}: Omit<EditorProviderProps, 'content'> & {
  initialContent?: JSONContent | null
  className?: string
}) {
  return (
    <div className={className}>
      <EditorProvider
        immediatelyRender={false}
        shouldRerenderOnTransaction
        content={initialContent ?? undefined}
        {...props}
      >
        <SyncContent content={initialContent} />
        {children}
      </EditorProvider>
    </div>
  )
}

export function EditorDragHandle() {
  const { editor } = useCurrentEditor()
  if (!editor?.isEditable) return null
  return (
    <DragHandle editor={editor}>
      <div
        aria-label="拖动段落"
        className="text-muted-foreground cursor-grab rounded p-1 hover:bg-accent"
        contentEditable={false}
      >
        <GripVertical className="size-4" />
      </div>
    </DragHandle>
  )
}

export function EditorBubble(props: Omit<BubbleMenuProps, 'editor'>) {
  const { editor } = useCurrentEditor()
  if (!editor) return null
  return (
    <BubbleMenu
      editor={editor}
      appendTo={() => editor.view.dom.closest<HTMLElement>('[role="dialog"]') ?? document.body}
      shouldShow={({ editor: current, state }) =>
        current.isEditable &&
        !current.isActive('image') &&
        !state.selection.empty &&
        !isNodeSelection(state.selection)
      }
      {...props}
    />
  )
}

type BubbleItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
  asChild?: boolean
  onSelect?: (editor: Editor) => void
}
export const EditorBubbleItem = forwardRef<HTMLDivElement, BubbleItemProps>(
  ({ children, asChild, onSelect, ...props }, ref) => {
    const { editor } = useCurrentEditor()
    const Component = asChild ? Slot : 'div'
    return editor ? (
      <Component ref={ref} {...props} onClick={() => onSelect?.(editor)}>
        {children}
      </Component>
    ) : null
  }
)
EditorBubbleItem.displayName = 'EditorBubbleItem'
