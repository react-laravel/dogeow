import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  get: getMock,
  post: postMock,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import WordQuizPage from '../page'

describe('WordQuizPage loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a timeout error with retry instead of spinning forever', async () => {
    getMock.mockImplementation(() => new Promise(() => {}))

    render(<WordQuizPage />)

    expect(screen.getByText('正在加载词库，请稍候…')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(21_000)
    })

    await waitFor(() => {
      expect(screen.getByText('暂时无法开始测验')).toBeInTheDocument()
    })
    expect(screen.getByText(/加载测验超时/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
  })
})
