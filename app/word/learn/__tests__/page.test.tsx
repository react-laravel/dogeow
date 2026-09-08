import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Word } from '../../types'
import { useWordStore } from '../../stores/wordStore'
import LearnPage from '../page'

const { mutate, useSearchParams, useWordStats, checkIn } = vi.hoisted(() => ({
  mutate: vi.fn(),
  checkIn: vi.fn(),
  useSearchParams: vi.fn(),
  useWordStats: vi.fn(),
}))

const firstGroup: Word[] = [{ id: 1, content: 'first', difficulty: 1, frequency: 1 }]
const nextGroup: Word[] = [{ id: 2, content: 'next', difficulty: 1, frequency: 1 }]

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('../../hooks/useWord', () => ({
  useWordSettings: () => ({ data: { current_book_id: 1 }, isLoading: false }),
  useWordStats,
  useDailyWords: () => ({
    data: firstGroup,
    isLoading: false,
    error: undefined,
    mutate,
  }),
  checkIn,
}))

vi.mock('../../components/WordCard', () => ({
  WordCard: ({ word, onResult }: { word: Word; onResult: (remembered: boolean) => void }) => (
    <div>
      正在学习：{word.content}
      <button onClick={() => onResult(true)}>记住测试单词</button>
    </div>
  ),
}))

describe('LearnPage continuation', () => {
  beforeEach(() => {
    useWordStore.getState().reset()
    checkIn.mockReset()
    mutate.mockReset()
    mutate.mockResolvedValue(nextGroup)
    useSearchParams.mockReturnValue(new URLSearchParams('continue=1'))
    useWordStats.mockReturnValue({
      data: { today_checked_in: true },
      isLoading: false,
    })
  })

  it('starts the next group after confirming from the checked-in prompt', async () => {
    render(<LearnPage />)

    expect(await screen.findByText('今日已打卡')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '再学一组' }))

    expect(await screen.findByText('正在学习：next')).toBeInTheDocument()
    expect(screen.queryByText('今日已打卡')).not.toBeInTheDocument()
  })

  it('starts another group from the completed screen without returning to the prompt', async () => {
    useWordStore.getState().setLearningStatus('completed')
    render(<LearnPage />)

    expect(await screen.findByText('学习完成！')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '再学一组' }))

    await waitFor(() => expect(screen.getByText('正在学习：next')).toBeInTheDocument())
    expect(screen.queryByText('今日已打卡')).not.toBeInTheDocument()
  })
  it('keeps the completed queue empty while check-in is pending, and can retry a failure', async () => {
    useSearchParams.mockReturnValue(new URLSearchParams())
    useWordStats.mockReturnValue({ data: { today_checked_in: false }, isLoading: false })
    let reject!: (reason: Error) => void
    checkIn.mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail
        })
    )
    render(<LearnPage />)
    fireEvent.click(await screen.findByRole('button', { name: '记住测试单词' }))
    expect(await screen.findByText('正在记录本次学习…')).toBeInTheDocument()
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
    await act(async () => {
      reject(new Error('offline'))
    })
    expect(await screen.findByRole('button', { name: '重试打卡' })).toBeInTheDocument()
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
    checkIn.mockResolvedValue({ message: 'ok' })
    fireEvent.click(screen.getByRole('button', { name: '重试打卡' }))
    expect(await screen.findByText('学习完成！')).toBeInTheDocument()
  })
  it('starts a learning queue instead of reusing a review session', async () => {
    useSearchParams.mockReturnValue(new URLSearchParams())
    useWordStats.mockReturnValue({ data: { today_checked_in: false }, isLoading: false })
    useWordStore
      .getState()
      .setCurrentWords([{ id: 8, content: 'review-only', difficulty: 1, frequency: 1 }])
    useWordStore.getState().startStudy('reviewing')
    render(<LearnPage />)
    expect(await screen.findByText('正在学习：first')).toBeInTheDocument()
    expect(useWordStore.getState().sessionMode).toBe('learning')
  })
})
