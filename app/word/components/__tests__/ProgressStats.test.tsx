import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressStats } from '../ProgressStats'

interface MockWordStatsReturn {
  data: unknown
  isLoading: boolean
  error: unknown
}

const { mockUseSWR, setWordStatsReturn } = vi.hoisted(() => {
  let wordStatsReturn: MockWordStatsReturn = {
    data: undefined,
    isLoading: true,
    error: undefined,
  }
  const mockUseSWR = vi.fn(() => wordStatsReturn)
  const setWordStatsReturn = (val: MockWordStatsReturn) => {
    wordStatsReturn = val
  }
  return { mockUseSWR, setWordStatsReturn }
})

vi.mock('swr', () => ({
  default: mockUseSWR,
  useSWRConfig: () => ({ mutate: vi.fn() }),
}))

describe('ProgressStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setWordStatsReturn({ data: undefined, isLoading: true, error: undefined })
  })

  it('shows loading spinner when isLoading is true', () => {
    setWordStatsReturn({ data: undefined, isLoading: true, error: undefined })
    render(<ProgressStats />)

    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('returns null when data is null', () => {
    setWordStatsReturn({ data: null, isLoading: false, error: undefined })
    const { container } = render(<ProgressStats />)

    expect(container.innerHTML).toBe('')
  })

  it('renders stats when data is available', () => {
    setWordStatsReturn({
      data: {
        check_in_days: 30,
        learned_words_count: 150,
        total_words: 200,
        progress_percentage: 75,
      },
      isLoading: false,
      error: undefined,
    })

    render(<ProgressStats />)

    expect(screen.getByText('30')).toBeTruthy()
    expect(screen.getByText('打卡天数')).toBeTruthy()
    expect(screen.getByText('150')).toBeTruthy()
    expect(screen.getByText('/ 200')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('学习进度')).toBeTruthy()
  })

  it('shows "已学单词" when total_words is 0', () => {
    setWordStatsReturn({
      data: {
        check_in_days: 5,
        learned_words_count: 0,
        total_words: 0,
        progress_percentage: 0,
      },
      isLoading: false,
      error: undefined,
    })

    render(<ProgressStats />)

    expect(screen.getByText('已学单词')).toBeTruthy()
    expect(screen.queryByText('/ 0')).toBeFalsy()
  })

  it('renders progress bar when total_words > 0', () => {
    setWordStatsReturn({
      data: {
        check_in_days: 10,
        learned_words_count: 50,
        total_words: 100,
        progress_percentage: 50,
      },
      isLoading: false,
      error: undefined,
    })

    render(<ProgressStats />)

    const progressBar = screen.getByRole('progressbar', { name: '单词学习进度' })
    const fill = progressBar.firstElementChild
    expect(fill).toBeTruthy()
    expect(fill?.getAttribute('style')).toContain('50%')
  })

  it('does not render progress bar when total_words is 0', () => {
    setWordStatsReturn({
      data: {
        check_in_days: 0,
        learned_words_count: 0,
        total_words: 0,
        progress_percentage: 0,
      },
      isLoading: false,
      error: undefined,
    })

    render(<ProgressStats />)

    expect(screen.queryByRole('progressbar')).toBeFalsy()
  })

  it('clamps progress_percentage to 100% in bar width', () => {
    setWordStatsReturn({
      data: {
        check_in_days: 100,
        learned_words_count: 200,
        total_words: 200,
        progress_percentage: 150,
      },
      isLoading: false,
      error: undefined,
    })

    render(<ProgressStats />)

    expect(screen.getByText('150%')).toBeTruthy()

    const progressBar = screen.getByRole('progressbar', { name: '单词学习进度' })
    const fill = progressBar.firstElementChild
    expect(fill?.getAttribute('style')).toContain('100%')
  })
})
