import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WordAIDialog } from '../WordAIDialog'

const fetchMocks = vi.hoisted(() => ({
  authenticatedInternalFetch: vi.fn(),
}))

vi.mock('@/lib/api/internal-auth', () => fetchMocks)

describe('WordAIDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    fetchMocks.authenticatedInternalFetch.mockResolvedValue(
      new Response('0:"fabricate 更强调编造或制造。"\n', { status: 200 })
    )
  })

  it('opens as a question panel without automatically editing or requesting', () => {
    render(
      <WordAIDialog
        word={{
          id: 1,
          content: 'fabricate',
          explanation: 'v. 制造；编造',
          difficulty: 1,
          frequency: 1,
        }}
        open
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('AI 解答 - fabricate')).toBeInTheDocument()
    expect(screen.getByText(/有什么疑问/)).toBeInTheDocument()
    expect(screen.queryByText('编辑单词 - fabricate')).not.toBeInTheDocument()
    expect(fetchMocks.authenticatedInternalFetch).not.toHaveBeenCalled()
  })

  it('sends the question to Codex with the current word as context', async () => {
    render(
      <WordAIDialog
        word={{
          id: 1,
          content: 'fabricate',
          explanation: 'v. 制造；编造',
          difficulty: 1,
          frequency: 1,
        }}
        open
        onOpenChange={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('textbox', { name: '输入问题' }), {
      target: { value: '和 manufacture 有什么区别？' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送' }))

    await waitFor(() => expect(fetchMocks.authenticatedInternalFetch).toHaveBeenCalledTimes(1))

    const [, request] = fetchMocks.authenticatedInternalFetch.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(request.body))

    expect(body).toMatchObject({
      provider: 'codex',
      model: 'gpt-5.3-codex-spark',
      useChat: true,
    })
    expect(body.command).toContain('当前单词：fabricate')
    expect(body.command).toContain('当前释义：v. 制造；编造')
    expect(await screen.findByText('fabricate 更强调编造或制造。')).toBeInTheDocument()
  })
})
