// Adapted for Tiptap 3 from Novel 1.x (Apache-2.0); see NOTICE.md.
import {
  Extension,
  Node,
  mergeAttributes,
  nodePasteRule,
  type Editor,
  type JSONContent,
} from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import katex, { type KatexOptions } from 'katex'
import { Tweet } from 'react-tweet'
import { Highlight } from '@tiptap/extension-highlight'

// 保留已有 Novel JSON 的 math / twitter / ai-highlight 节点名和属性。
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    legacyMath: {
      setLatex: (attributes: { latex: string }) => ReturnType
      unsetLatex: () => ReturnType
    }
    legacyTweet: { setTweet: (attributes: { src: string }) => ReturnType }
    aiHighlight: {
      setAIHighlight: (attributes?: { color: string }) => ReturnType
      unsetAIHighlight: () => ReturnType
    }
  }
}

export const Mathematics = Node.create<{
  HTMLAttributes: Record<string, string>
  katexOptions: KatexOptions
}>({
  name: 'math',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  marks: '',
  addOptions() {
    return { HTMLAttributes: {}, katexOptions: { throwOnError: false, trust: false } }
  },
  addAttributes() {
    return { latex: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'span[data-type="math"]' }]
  },
  markdownTokenizer: {
    name: 'math',
    level: 'inline',
    start: source => source.indexOf('$'),
    tokenize(source) {
      const match = /^\$((?:\\.|[^$\\\n])+)\$/.exec(source)
      return match ? { type: 'math', raw: match[0], text: match[1] } : undefined
    },
  },
  parseMarkdown(token, helpers) {
    return helpers.createNode('math', { latex: token.text ?? '' })
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'math' }),
      String(node.attrs.latex),
    ]
  },
  renderText({ node }) {
    return String(node.attrs.latex)
  },
  renderMarkdown(node) {
    return `$${String(node.attrs?.latex ?? '')}$`
  },
  addCommands() {
    return {
      setLatex:
        ({ latex }) =>
        ({ commands, state }) =>
          !!latex &&
          state.selection.$from.parent.type.name !== 'codeBlock' &&
          commands.insertContent({ type: this.name, attrs: { latex } }),
      unsetLatex:
        () =>
        ({ editor, commands }) => {
          const latex: unknown = editor.getAttributes(this.name).latex
          return typeof latex === 'string' && commands.insertContent({ type: 'text', text: latex })
        },
    }
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span')
      dom.dataset.type = 'math'
      dom.contentEditable = 'false'
      dom.className = this.options.HTMLAttributes.class ?? ''
      katex.render(String(node.attrs.latex), dom, { ...this.options.katexOptions, trust: false })
      dom.addEventListener('click', () => {
        const pos = getPos()
        if (editor.isEditable && pos !== undefined)
          editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize })
      })
      return { dom }
    }
  },
})

export function getTweetId(source: unknown): string | null {
  if (typeof source !== 'string') return null
  try {
    const url = new URL(source)
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname)
    )
      return null
    return url.pathname.match(/^\/[\w]+\/status\/(\d+)\/?$/)?.[1] ?? null
  } catch {
    return null
  }
}
function TweetView({ node }: NodeViewProps) {
  const id = getTweetId(node.attrs.src)
  return (
    <NodeViewWrapper data-twitter="" contentEditable={false}>
      {id ? <Tweet id={id} /> : <span>无效的帖子链接</span>}
    </NodeViewWrapper>
  )
}
export const Twitter = Node.create<{ HTMLAttributes: Record<string, string>; inline: boolean }>({
  name: 'twitter',
  group() {
    return this.options.inline ? 'inline' : 'block'
  },
  inline() {
    return this.options.inline
  },
  atom: true,
  draggable: true,
  addOptions() {
    return { HTMLAttributes: {}, inline: false }
  },
  addAttributes() {
    return { src: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'div[data-twitter]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-twitter': '' }),
    ]
  },
  renderMarkdown(node) {
    return getTweetId(node.attrs?.src) ? `[Post](${node.attrs?.src})` : ''
  },
  addNodeView() {
    return ReactNodeViewRenderer(TweetView)
  },
  addCommands() {
    return {
      setTweet:
        attributes =>
        ({ commands }) =>
          !!getTweetId(attributes.src) &&
          commands.insertContent({ type: this.name, attrs: attributes }),
    }
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/\w+\/status\/\d+\b/g,
        type: this.type,
        getAttributes: match => ({ src: match[0] }),
      }),
    ]
  },
})

export const AIHighlight = Highlight.extend({
  name: 'ai-highlight',
  parseHTML() {
    return [{ tag: 'mark[data-ai-highlight]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-ai-highlight': '' }),
      0,
    ]
  },
  addCommands() {
    return {
      setAIHighlight:
        attrs =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetAIHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
}).configure({ multicolor: true })

export function removeAIHighlight(editor: Editor) {
  const mark = editor.schema.marks['ai-highlight']
  if (mark) editor.view.dispatch(editor.state.tr.removeMark(0, editor.state.doc.content.size, mark))
}
export function addAIHighlight(editor: Editor, color = '#c1ecf970') {
  editor.commands.setAIHighlight({ color })
}
export function getPrevText(editor: Editor, position: number) {
  return serializeEditorFragment(editor, editor.state.doc.cut(0, position).toJSON())
}
export function serializeEditorFragment(editor: Editor, content: JSONContent | JSONContent[]) {
  const doc = Array.isArray(content) ? { type: 'doc', content } : content
  return editor.markdown?.serialize(doc) ?? ''
}

export const CustomKeymap = Extension.create({
  name: 'customKeymap',
  addKeyboardShortcuts() {
    return {
      'Mod-a': () => {
        const { from, to, $from, $to } = this.editor.state.selection
        const start = $from.start(),
          end = $to.end()
        return (
          (from > start || to < end) &&
          this.editor.commands.setTextSelection({ from: start, to: end })
        )
      },
    }
  },
})
