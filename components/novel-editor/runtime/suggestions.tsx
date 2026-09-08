// Adapted for Tiptap 3 from Novel 1.x (Apache-2.0); see NOTICE.md.
import { forwardRef, useImperativeHandle, useState, type ReactNode } from 'react'
import { Extension, type Editor, type Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, {
  exitSuggestion,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { computePosition, flip, shift, offset } from '@floating-ui/dom'

export interface SuggestionItem {
  title: string
  description: string
  searchTerms?: string[]
  icon: ReactNode
  command: (options: { editor: Editor; range: Range }) => void
}
const slashKey = new PluginKey('slash-command')
interface MenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}
const SuggestionMenu = forwardRef<MenuHandle, SuggestionProps<SuggestionItem>>((props, ref) => {
  const [selection, setSelection] = useState({ query: props.query, index: 0 })
  const index =
    selection.query === props.query
      ? Math.min(selection.index, Math.max(0, props.items.length - 1))
      : 0
  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (!props.items.length) return false
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        setSelection({
          query: props.query,
          index:
            (index + (event.key === 'ArrowUp' ? -1 : 1) + props.items.length) % props.items.length,
        })
        return true
      }
      if (event.key === 'Enter') {
        props.command(props.items[index])
        return true
      }
      return false
    },
  }))
  return (
    <div
      role="listbox"
      aria-label="编辑器命令"
      className="border-muted bg-background z-[200] max-h-80 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border p-1 shadow-md"
    >
      {props.items.length ? (
        props.items.map((item, position) => (
          <button
            type="button"
            key={item.title}
            role="option"
            aria-selected={position === index}
            className="hover:bg-accent aria-selected:bg-accent flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm"
            onMouseDown={event => event.preventDefault()}
            onClick={() => props.command(item)}
          >
            <span className="border-muted flex size-10 shrink-0 items-center justify-center rounded border">
              {item.icon}
            </span>
            <span>
              <span className="block font-medium">{item.title}</span>
              <span className="text-muted-foreground block text-xs">{item.description}</span>
            </span>
          </button>
        ))
      ) : (
        <div className="text-muted-foreground p-2">无匹配命令</div>
      )}
    </div>
  )
})
SuggestionMenu.displayName = 'SuggestionMenu'

export const createSuggestionItems = (items: SuggestionItem[]) => items
export const renderItems: NonNullable<SuggestionOptions<SuggestionItem>['render']> = () => {
  let renderer: ReactRenderer<MenuHandle> | undefined
  let latest: SuggestionProps<SuggestionItem> | undefined
  let active = false
  let scheduled = false
  const updatePosition = () => {
    if (!latest || latest.editor.isDestroyed) return
    const rect = latest.clientRect?.(),
      element = renderer?.element
    if (!rect || !element) return
    void computePosition(
      { getBoundingClientRect: () => rect, contextElement: latest.editor.view.dom },
      element,
      {
        strategy: 'fixed',
        placement: 'bottom-start',
        middleware: [offset(6), flip(), shift({ padding: 8 })],
      }
    ).then(({ x, y }) => {
      if (element.isConnected) Object.assign(element.style, { left: `${x}px`, top: `${y}px` })
    })
  }
  const scheduleRender = () => {
    if (scheduled) return
    scheduled = true
    // ReactRenderer 内部使用 flushSync，不能在 React effect / 热更新栈中调用。
    queueMicrotask(() => {
      scheduled = false
      if (!active || !latest || latest.editor.isDestroyed) return
      if (!renderer) {
        renderer = new ReactRenderer(SuggestionMenu, { editor: latest.editor, props: latest })
        Object.assign(renderer.element.style, { position: 'fixed', zIndex: '200' })
        ;(latest.editor.view.dom.closest('[role="dialog"]') ?? document.body).appendChild(
          renderer.element
        )
      } else {
        renderer.updateProps(latest)
      }
      updatePosition()
    })
  }
  return {
    onStart(props) {
      active = true
      latest = props
      scheduleRender()
      window.addEventListener('resize', updatePosition)
      document.addEventListener('scroll', updatePosition, true)
    },
    onUpdate(props) {
      latest = props
      scheduleRender()
    },
    onKeyDown({ event, view }) {
      if (event.key === 'Escape') {
        exitSuggestion(view, slashKey)
        return true
      }
      return renderer?.ref?.onKeyDown(event) ?? false
    },
    onExit() {
      active = false
      latest = undefined
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
      const previous = renderer
      previous?.element.remove()
      renderer = undefined
      queueMicrotask(() => previous?.destroy())
    },
  }
}

export const Command = Extension.create<{ suggestion: Partial<SuggestionOptions<SuggestionItem>> }>(
  {
    name: 'slash-command',
    addOptions() {
      return { suggestion: {} }
    },
    addProseMirrorPlugins() {
      return [
        Suggestion<SuggestionItem>({
          editor: this.editor,
          pluginKey: slashKey,
          char: '/',
          allow: ({ state }) => state.selection.$from.parent.type.name !== 'codeBlock',
          command: ({ editor, range, props }) => props.command({ editor, range }),
          ...this.options.suggestion,
        }),
      ]
    },
  }
)
