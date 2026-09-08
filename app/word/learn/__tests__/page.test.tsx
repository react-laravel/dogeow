import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getWordStudyPlanKey, type UserWordSetting, type Word } from '../../types'
import { useWordStore } from '../../stores/wordStore'
import LearnPage from '../page'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  useSearchParams: vi.fn(),
  useWordStats: vi.fn(),
  useWordSettings: vi.fn(),
  useDailyWords: vi.fn(),
  checkIn: vi.fn(),
}))
const setting: UserWordSetting = {
  id: 1,
  user_id: 1,
  current_book_id: 1,
  daily_new_words: 10,
  review_multiplier: 2,
  is_auto_pronounce: false,
}
const makeGroup = (prefix: string, count: number, startId = 1): Word[] =>
  Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    content: `${prefix}-${index + 1}`,
    difficulty: 1,
    frequency: 1,
  }))
const cachedFour = makeGroup('cached', 4)
const freshTen = makeGroup('fresh', 10, 101)
const nextGroup = makeGroup('next', 10, 201)
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (cause: Error) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
function completedSession() {
  useWordStore.getState().setCurrentWords(cachedFour)
  useWordStore.getState().startStudy('learning', getWordStudyPlanKey(setting))
  useWordStore.setState({
    learningStatus: 'completed',
    studyQueue: [],
    dailyProgress: { learned: 4, reviewed: 0 },
  })
}
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: mocks.useSearchParams,
}))
vi.mock('../../hooks/useWord', () => ({
  useWordSettings: mocks.useWordSettings,
  useWordStats: mocks.useWordStats,
  useDailyWords: mocks.useDailyWords,
  checkIn: mocks.checkIn,
}))
vi.mock('../../components/WordCard', () => ({
  WordCard: ({ word, onResult }: { word: Word; onResult: (remembered: boolean) => void }) => (
    <div>
      正在学习：{word.content}
      <button onClick={() => onResult(true)}>记住测试单词</button>
    </div>
  ),
}))

describe('LearnPage groups', () => {
  beforeEach(() => {
    useWordStore.getState().reset()
    vi.clearAllMocks()
    mocks.mutate.mockReset().mockResolvedValue(freshTen)
    mocks.checkIn.mockReset().mockResolvedValue({ message: 'ok' })
    mocks.useSearchParams.mockReturnValue(new URLSearchParams())
    mocks.useWordStats.mockReturnValue({ data: { today_checked_in: false }, isLoading: false })
    mocks.useWordSettings.mockReturnValue({ data: setting, isLoading: false })
    mocks.useDailyWords.mockReturnValue({
      data: cachedFour,
      isLoading: false,
      mutate: mocks.mutate,
    })
  })
  it('waits for fresh words instead of starting the cached four-word group', async () => {
    const request = deferred<Word[]>()
    mocks.mutate.mockReturnValue(request.promise)
    render(<LearnPage />)
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
    expect(screen.queryByText('正在学习：cached-1')).not.toBeInTheDocument()
    await act(async () => request.resolve(freshTen))
    expect(await screen.findByText('正在学习：fresh-1')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10')
    expect(useWordStore.getState().sessionPlanKey).toBe('1:10:2')
  })
  it('starts normally under StrictMode without accepting an abandoned request', async () => {
    render(
      <StrictMode>
        <LearnPage />
      </StrictMode>
    )
    expect(await screen.findByText('正在学习：fresh-1')).toBeInTheDocument()
  })
  it('confirms another group after check-in, then uses the new response', async () => {
    mocks.useSearchParams.mockReturnValue(new URLSearchParams('continue=1'))
    mocks.useWordStats.mockReturnValue({ data: { today_checked_in: true }, isLoading: false })
    render(<LearnPage />)
    expect(await screen.findByText('今日已打卡')).toBeInTheDocument()
    mocks.mutate.mockResolvedValueOnce(nextGroup)
    fireEvent.click(screen.getByRole('button', { name: '再学一组' }))
    expect(await screen.findByText('正在学习：next-1')).toBeInTheDocument()
  })
  it('completes four words and waits for a different next group', async () => {
    mocks.mutate.mockResolvedValueOnce(cachedFour)
    render(<LearnPage />)
    for (const word of cachedFour) {
      expect(await screen.findByText(`正在学习：${word.content}`)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '记住测试单词' }))
    }
    expect(await screen.findByText('学习完成！')).toBeInTheDocument()
    const request = deferred<Word[]>()
    mocks.mutate.mockReturnValueOnce(request.promise)
    fireEvent.click(screen.getByRole('button', { name: '再学一组' }))
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
    await act(async () => request.resolve(nextGroup))
    expect(await screen.findByText('正在学习：next-1')).toBeInTheDocument()
    expect(useWordStore.getState().currentWords.map(word => word.id)).toEqual(
      nextGroup.map(word => word.id)
    )
  })
  it('shows an exhausted book instead of replaying cached words when the server returns no words', async () => {
    completedSession()
    mocks.mutate.mockResolvedValueOnce([])
    render(<LearnPage />)
    fireEvent.click(screen.getByRole('button', { name: '再学一组' }))
    expect(await screen.findByText('当前没有新单词了')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '记住测试单词' })).not.toBeInTheDocument()
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
  })
  it.each(['failure', 'undefined'])(
    'does not replay a completed group on %s and supports retry',
    async outcome => {
      completedSession()
      if (outcome === 'failure') mocks.mutate.mockRejectedValueOnce(new Error('offline'))
      else mocks.mutate.mockResolvedValueOnce(undefined)
      render(<LearnPage />)
      fireEvent.click(screen.getByRole('button', { name: '再学一组' }))
      expect(await screen.findByRole('button', { name: '重试' })).toBeInTheDocument()
      expect(useWordStore.getState().studyQueue).toHaveLength(0)
      mocks.mutate.mockResolvedValueOnce(nextGroup)
      fireEvent.click(screen.getByRole('button', { name: '重试' }))
      expect(await screen.findByText('正在学习：next-1')).toBeInTheDocument()
    }
  )
  it('rebuilds a session when the saved learning quantities change', async () => {
    useWordStore.getState().setCurrentWords(cachedFour)
    useWordStore.getState().startStudy('learning', '1:4:1')
    render(<LearnPage />)
    expect(await screen.findByText('正在学习：fresh-1')).toBeInTheDocument()
    expect(useWordStore.getState().initialStudyCount).toBe(10)
  })
  it('retains an unfinished session when the book and quantities still match', () => {
    useWordStore.getState().setCurrentWords(cachedFour)
    useWordStore.getState().startStudy('learning', getWordStudyPlanKey(setting))
    render(<LearnPage />)
    expect(screen.getByText('正在学习：cached-1')).toBeInTheDocument()
    expect(mocks.mutate).not.toHaveBeenCalled()
  })
  it('ignores a response from the old plan if settings change during loading', async () => {
    const oldRequest = deferred<Word[]>()
    const newRequest = deferred<Word[]>()
    mocks.useWordSettings.mockReturnValue({
      data: { ...setting, daily_new_words: 4 },
      isLoading: false,
    })
    mocks.mutate.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise)
    const { rerender } = render(<LearnPage />)
    mocks.useWordSettings.mockReturnValue({ data: setting, isLoading: false })
    rerender(<LearnPage />)
    await act(async () => newRequest.resolve(freshTen))
    await act(async () => oldRequest.resolve(cachedFour))
    expect(screen.getByText('正在学习：fresh-1')).toBeInTheDocument()
    expect(useWordStore.getState().initialStudyCount).toBe(10)
  })
  it('preserves completion on check-in failure without reinitializing the group', async () => {
    mocks.mutate.mockResolvedValueOnce(cachedFour.slice(0, 1))
    const checkIn = deferred<unknown>()
    mocks.checkIn.mockReturnValueOnce(checkIn.promise)
    render(<LearnPage />)
    fireEvent.click(await screen.findByRole('button', { name: '记住测试单词' }))
    expect(await screen.findByText('正在记录本次学习…')).toBeInTheDocument()
    await act(async () => checkIn.reject(new Error('offline')))
    expect(await screen.findByRole('button', { name: '重试打卡' })).toBeInTheDocument()
    expect(useWordStore.getState().studyQueue).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '重试打卡' }))
    expect(await screen.findByText('学习完成！')).toBeInTheDocument()
  })
  it('shows separate new-word and review counts in a mixed group', async () => {
    mocks.mutate.mockResolvedValueOnce(
      cachedFour.map((word, index) => ({ ...word, is_review_word: index < 2 }))
    )
    render(<LearnPage />)
    expect(await screen.findByText('本组新词 2 个 · 复习 2 个')).toBeInTheDocument()
    for (let index = 0; index < 4; index++)
      fireEvent.click(screen.getByRole('button', { name: '记住测试单词' }))
    expect(await screen.findByText('本组学习了 2 个新词，复习了 2 个单词')).toBeInTheDocument()
  })
})
