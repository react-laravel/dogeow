import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BookAiChatPanel } from '../BookAiChatPanel'

const { setPrompt, send, clear, chat } = vi.hoisted(() => ({
  setPrompt: vi.fn(),
  send: vi.fn(),
  clear: vi.fn(),
  chat: { hasMessages: true, isLoading: false },
}))
vi.mock('@/app/ai/features/chat/hooks/useAiChat', () => ({
  useAiChat: () => ({
    prompt: '解释这段文字',
    setPrompt,
    messages: [],
    hasMessages: chat.hasMessages,
    isLoading: chat.isLoading,
    handleSend: send,
    handleClear: clear,
  }),
}))
vi.mock('@/app/ai/features/chat/components', () => ({
  ChatMessageList: () => <p>围绕选中文字展开讨论</p>,
  ChatInput: ({ prompt, textareaMaxHeight }: { prompt: string; textareaMaxHeight?: number }) => (
    <textarea aria-label="AI 问题" value={prompt} readOnly data-textarea-max={textareaMaxHeight} />
  ),
}))

describe('reader AI panel', () => {
  beforeEach(() => {
    chat.hasMessages = true
    chat.isLoading = false
  })

  it('prefills a selection without sending automatically and retains the expand action', () => {
    const expand = vi.fn()
    render(
      <BookAiChatPanel
        open
        seedPrompt="选中的段落"
        onClose={vi.fn()}
        onExpand={expand}
        theme="sepia"
      />
    )
    expect(screen.getByRole('dialog', { name: 'AI 助理' })).toBeInTheDocument()
    expect(setPrompt).toHaveBeenCalledWith('选中的段落')
    expect(send).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '全屏展开' }))
    expect(expand).toHaveBeenCalledWith('解释这段文字')
    fireEvent.click(screen.getByRole('button', { name: '新会话' }))
    expect(clear).toHaveBeenCalled()
  })
  it('closes through the shared panel control', () => {
    const close = vi.fn()
    render(<BookAiChatPanel open seedPrompt={null} onClose={close} />)
    fireEvent.click(screen.getByRole('button', { name: '关闭AI 助理' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('hides the idle hero until there is a reply', () => {
    chat.hasMessages = false
    render(<BookAiChatPanel open seedPrompt="选中的段落" onClose={vi.fn()} />)
    expect(screen.queryByText('围绕选中文字展开讨论')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'AI 问题' })).toHaveAttribute(
      'data-textarea-max',
      '480'
    )
  })
})
