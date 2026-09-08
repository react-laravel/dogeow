import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Editor, type JSONContent } from '@tiptap/core'
import { defaultExtensions } from '../extensions'
import { EditorContent } from '../runtime/editor'
import { getTweetId, removeAIHighlight } from '../runtime/custom-extensions'
import { createImageUpload } from '../runtime/image-upload'

vi.mock('react-tweet', () => ({ Tweet: ({ id }: { id: string }) => <span>{id}</span> }))

const editors: Editor[] = []
function createEditor(content?: JSONContent) {
  const element = document.createElement('div')
  document.body.appendChild(element)
  const editor = new Editor({ element, extensions: defaultExtensions, content, injectCSS: false })
  editors.push(editor)
  return editor
}
afterEach(() => {
  editors.splice(0).forEach(editor => {
    const element = editor.view.dom.parentElement
    editor.destroy()
    element?.remove()
  })
  vi.restoreAllMocks()
})

describe('Tiptap 3 document compatibility', () => {
  it('preserves legacy math, tweet, image dimensions and highlight JSON', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '旧笔记',
              marks: [{ type: 'bold' }, { type: 'ai-highlight', attrs: { color: '#c1ecf970' } }],
            },
            { type: 'math', attrs: { latex: 'x^2' } },
          ],
        },
        { type: 'twitter', attrs: { src: 'https://x.com/user/status/12345' } },
        { type: 'image', attrs: { src: 'https://example.com/image.png', width: 320, height: 200 } },
      ],
    }
    const editor = createEditor(content)
    expect(editor.getJSON()).toMatchObject(content)
    const reopened = createEditor(editor.getJSON())
    expect(reopened.getJSON()).toEqual(editor.getJSON())
    expect(editor.getHTML()).toContain('data-type="math"')
  })

  it('round-trips headings, lists, tasks, links and code through Markdown', () => {
    const editor = createEditor()
    const markdown =
      '# 标题\n\n**粗体** and [链接](https://example.com)\n\n- [x] 完成\n- [ ] 待办\n\n1. 第一项\n2. 第二项\n\n> 引用\n\n```js\nconst value = 1\n```'
    editor.commands.setContent(markdown, { contentType: 'markdown' })
    const before = editor.getJSON()
    const exported = editor.getMarkdown()
    editor.commands.setContent(exported, { contentType: 'markdown' })
    expect(editor.getJSON()).toEqual(before)
    expect(exported).toContain('- [x]')
    expect(exported).toContain('```js')
    editor.commands.setContent('公式 $x^2$ 结束', { contentType: 'markdown' })
    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [{ type: 'text' }, { type: 'math', attrs: { latex: 'x^2' } }, { type: 'text' }],
        },
      ],
    })
    expect(editor.getMarkdown()).toContain('$x^2$')
  })

  it('copies only the editor selection and converts pasted Markdown', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }] },
      ],
    })
    editor.commands.setTextSelection({ from: 1, to: 5 })
    const setData = vi.fn()
    const copy = new Event('copy', { bubbles: true, cancelable: true })
    Object.defineProperty(copy, 'clipboardData', { value: { setData } })
    editor.view.dom.dispatchEvent(copy)
    expect(setData).toHaveBeenCalledWith('text/plain', '**bold**')

    const pasted = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasted, 'clipboardData', {
      value: {
        files: [],
        getData: (type: string) => (type === 'text/plain' ? '## Pasted heading' : ''),
      },
    })
    editor.view.dom.dispatchEvent(pasted)
    expect(editor.getHTML()).toContain('<h2')
    expect(editor.getText().trim()).toBe('Pasted heading')
  })

  it('switches readonly document content without reporting a user edit', async () => {
    const onUpdate = vi.fn()
    const doc = (text: string): JSONContent => ({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    })
    const { rerender } = render(
      <EditorContent
        initialContent={doc('第一篇')}
        extensions={defaultExtensions}
        editable={false}
        onUpdate={onUpdate}
      />
    )
    await screen.findByText('第一篇')
    rerender(
      <EditorContent
        initialContent={doc('第二篇')}
        extensions={defaultExtensions}
        editable={false}
        onUpdate={onUpdate}
      />
    )
    await screen.findByText('第二篇')
    expect(screen.queryByText('第一篇')).not.toBeInTheDocument()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('keeps legacy formula editing and removes only temporary AI marks', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'math', attrs: { latex: 'x^2' } },
            {
              type: 'text',
              text: 'marked',
              marks: [
                { type: 'highlight', attrs: { color: 'yellow' } },
                { type: 'ai-highlight', attrs: { color: 'blue' } },
              ],
            },
          ],
        },
      ],
    })
    editor.view.dom.querySelector('[data-type="math"]')?.dispatchEvent(new MouseEvent('click'))
    expect(editor.isActive('math')).toBe(true)
    expect(editor.commands.unsetLatex()).toBe(true)
    expect(editor.getText()).toContain('x^2')
    removeAIHighlight(editor)
    const json = JSON.stringify(editor.getJSON())
    expect(json).not.toContain('ai-highlight')
    expect(json).toContain('yellow')
  })

  it('rejects non-Twitter embed destinations', () => {
    expect(getTweetId('https://x.com/user/status/123?ref=example')).toBe('123')
    expect(getTweetId('https://x.com.attacker.test/user/status/123')).toBeNull()
    expect(getTweetId('javascript:alert(1)')).toBeNull()
  })
})

describe('image upload lifecycle', () => {
  it('keeps the upload position mapped through edits and releases its preview', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    let resolveUpload: ((value: string) => void) | undefined
    const onUpload = vi.fn(
      () =>
        new Promise<string>(resolve => {
          resolveUpload = resolve
        })
    )
    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] })
    createImageUpload({ onUpload })(
      new File(['image'], 'image.png', { type: 'image/png' }),
      editor.view,
      1
    )
    editor.view.dispatch(editor.state.tr.insertText('typed', 1))
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1))
    resolveUpload?.('https://example.com/upload.png')
    await waitFor(() => expect(editor.getHTML()).toContain('https://example.com/upload.png'))
    expect(editor.getText()).toContain('typed')
    expect(revoke).toHaveBeenCalledWith('blob:preview')
    expect(editor.view.dom.querySelector('[alt="图片上传中"]')).toBeNull()
  })

  it('removes placeholders when uploads fail', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:failed')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const editor = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] })
    createImageUpload({ onUpload: () => Promise.reject(new Error('failed')) })(
      new File(['x'], 'x.png', { type: 'image/png' }),
      editor.view,
      1
    )
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:failed'))
    expect(editor.view.dom.querySelector('img')).toBeNull()
  })
})
