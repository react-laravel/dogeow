import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiDialog } from '../AiDialog'

vi.unmock('@/components/ui/popover')

const mocks = vi.hoisted(() => ({
  allowed: true,
  general: { setPrompt: vi.fn(), stop: vi.fn(), send: vi.fn() },
  knowledge: { setPrompt: vi.fn(), stop: vi.fn(), send: vi.fn() },
}))
vi.mock('@/stores/authStore', () => ({
  default: (selector: (state: unknown) => unknown) =>
    selector({ user: mocks.allowed ? { id: 1, is_admin: true } : { id: 2, is_admin: false } }),
}))
vi.mock('swr', () => ({
  default: () => ({
    data: { success: true, documents: [{ title: '使用指南', slug: 'guide' }] },
    mutate: vi.fn(),
  }),
}))
vi.mock('@/app/ai/features/knowledge/hooks/useKnowledgeIndexStatus', () => ({
  useKnowledgeIndexStatus: () => ({ updatedAt: null }),
}))

const baseChat = () => ({
  prompt: '',
  messages: [],
  hasMessages: false,
  completion: undefined,
  isLoading: false,
  model: 'gpt-5.6-luna',
  setModel: vi.fn(),
  provider: 'codex',
  setProvider: vi.fn(),
  ollamaModels: [],
  codexModels: [],
  codexReasoningEffort: 'medium',
  setCodexReasoningEffort: vi.fn(),
  handleClear: vi.fn(),
  messagesEndRef: { current: null },
  images: [],
  supportsImages: false,
})
vi.mock('@/app/ai/features/chat/hooks/useAiChat', () => ({
  useAiChat: () => ({
    ...baseChat(),
    setPrompt: mocks.general.setPrompt,
    stop: mocks.general.stop,
    handleSend: mocks.general.send,
  }),
}))
vi.mock('@/app/ai/features/knowledge/hooks/useKnowledgeChat', () => ({
  useKnowledgeChat: () => ({
    ...baseChat(),
    setPrompt: mocks.knowledge.setPrompt,
    stop: mocks.knowledge.stop,
    handleSend: mocks.knowledge.send,
  }),
}))

describe('AiDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.allowed = true
  })
  it('prefills a suggestion without sending a request', () => {
    render(<AiDialog open onOpenChange={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'AI 助理' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '解释一个概念' }))
    expect(mocks.general.setPrompt).toHaveBeenCalledWith('请用简单的语言和例子解释：')
    expect(mocks.general.send).not.toHaveBeenCalled()
  })
  it('switches to a knowledge welcome panel and stops the previous generation', () => {
    render(<AiDialog open onOpenChange={vi.fn()} />)
    fireEvent.mouseDown(screen.getByRole('tab', { name: '知识库 AI' }), {
      button: 0,
      ctrlKey: false,
    })
    expect(screen.getByRole('heading', { name: '从知识中找到答案' })).toBeInTheDocument()
    expect(mocks.general.stop).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '使用指南' }))
    expect(mocks.knowledge.setPrompt).toHaveBeenCalledWith(
      '请根据知识库介绍《使用指南》的主要内容。'
    )
    expect(mocks.knowledge.send).not.toHaveBeenCalled()
  })
  it('closes using the labelled close button', () => {
    const onOpenChange = vi.fn()
    render(<AiDialog open onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByRole('button', { name: '关闭 AI 助理' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
  it('does not show the dialog to users without AI access', () => {
    mocks.allowed = false
    render(<AiDialog open onOpenChange={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
