import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const { searchWord, createWord, classifyWordEducationLevel } = vi.hoisted(() => ({
  searchWord: vi.fn(),
  createWord: vi.fn(),
  classifyWordEducationLevel: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

vi.mock('../../hooks/useWord', () => ({
  searchWord,
  createWord,
  classifyWordEducationLevel,
}))

vi.mock('../../components/WordDataEditor', () => ({
  WordDataEditor: ({ wordContent }: { wordContent: string }) => (
    <div data-testid="word-editor">editor:{wordContent}</div>
  ),
}))

import SearchWordPage from '../page'
import { toast } from 'sonner'

describe('SearchWordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the query and shows empty-state CTA when API omits keyword', async () => {
    searchWord.mockResolvedValueOnce({ found: false })
    const user = userEvent.setup()

    render(<SearchWordPage />)

    await user.type(screen.getByPlaceholderText('输入要搜索的单词...'), 'hello')
    await user.click(screen.getByRole('button', { name: /搜索/ }))

    await waitFor(() => {
      expect(screen.getByText('未找到单词「hello」')).toBeInTheDocument()
    })
    expect(screen.getByTestId('word-editor')).toHaveTextContent('editor:hello')
    expect(toast.info).toHaveBeenCalled()
    expect(screen.getByPlaceholderText('输入要搜索的单词...')).toHaveValue('hello')
  })
})
