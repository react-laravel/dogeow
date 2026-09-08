import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// 复制只处理本编辑器的选区，不监听全局文档，也不记录笔记正文。
export const MarkdownCopyExtension = Extension.create({
  name: 'markdownClipboard',
  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        props: {
          handleDOMEvents: {
            copy(view, event) {
              if (view.state.selection.empty || !event.clipboardData || !editor.markdown)
                return false
              const markdown = editor.markdown.serialize({
                type: 'doc',
                content: view.state.selection.content().content.toJSON(),
              })
              event.clipboardData.setData('text/plain', markdown)
              event.preventDefault()
              return true
            },
          },
          handlePaste(_view, event) {
            const data = event.clipboardData
            if (!editor.isEditable || !data || data.files.length || data.getData('text/html'))
              return false
            const text = data.getData('text/plain')
            if (!text) return false
            event.preventDefault()
            return editor.commands.insertContent(text, { contentType: 'markdown' })
          },
        },
      }),
    ]
  },
})
