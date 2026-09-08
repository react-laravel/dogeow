import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BookAiChatPanel } from '../BookAiChatPanel'

const { setPrompt, send, clear } = vi.hoisted(() => ({
  setPrompt: vi.fn(),
  send: vi.fn(),
  clear: vi.fn(),
}))
vi.mock('@/app/ai/features/chat/hooks/useAiChat', () => ({
  useAiChat: () => ({
    prompt: '解释这段文字',
    setPrompt,
    messages: [],
    hasMessages: true,
    isLoading: false,
    handleSend: send,
    handleClear: clear,
  }),
}))
vi.mock('@/app/ai/features/chat/components', () => ({
  ChatMessageList: () => <p>围绕选中文字展开讨论</p>,
  ChatInput: ({ prompt }: { prompt: string }) => (
    <textarea aria-label="AI 问题" value={prompt} readOnly />
  ),
}))

describe('reader AI panel', () => {
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
})
