import { useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { SWRConfig } from 'swr'
import { SettingsForm } from '../../components/SettingsForm'
import LearnPage from '../page'
import { useWordStore } from '../../stores/wordStore'
import type { UserWordSetting, Word } from '../../types'

vi.unmock('swr')
const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/api', () => api)
vi.mock('@/lib/api/internal-auth', () => ({ authenticatedInternalFetch: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('../../hooks/useWordPronunciation', () => ({
  useWordPronunciation: () => ({
    cancel: vi.fn(),
    playAmericanPronunciation: vi.fn(),
    playBritishPronunciation: vi.fn(),
  }),
}))
vi.mock('../../components/WordAIDialog', () => ({ WordAIDialog: () => null }))
vi.mock('../../components/EditWordDialog', () => ({ EditWordDialog: () => null }))

const initialSetting: UserWordSetting = {
  id: 1,
  user_id: 1,
  current_book_id: 1,
  daily_new_words: 4,
  review_multiplier: 1,
  is_auto_pronounce: false,
}
const pool: Word[] = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  content: `word-${index + 1}`,
  explanation: '释义',
  difficulty: 1,
  frequency: 1,
  is_review_word: false,
}))
let setting = initialSetting
let learned = new Set<number>()
beforeEach(() => {
  useWordStore.getState().reset()
  setting = { ...initialSetting }
  learned = new Set()
  api.get.mockReset().mockImplementation(async (url: string) => {
    if (url === '/word/settings') return setting
    if (url === '/word/stats') return { today_checked_in: learned.size >= 10 }
    if (url === '/word/daily')
      return { data: pool.filter(word => !learned.has(word.id)).slice(0, setting.daily_new_words) }
    throw new Error('Unexpected read: ' + url)
  })
  api.put.mockReset().mockImplementation(async (_url: string, values: Partial<UserWordSetting>) => {
    setting = { ...setting, ...values }
    return { setting }
  })
  api.post.mockReset().mockImplementation(async (url: string, data: { remembered?: boolean }) => {
    if (url.startsWith('/word/mark/') && data.remembered) learned.add(Number(url.split('/').at(-1)))
    return { message: 'ok' }
  })
})
function Flow() {
  const [learning, setLearning] = useState(false)
  return (
    <>
      <button onClick={() => setLearning(true)}>去学习</button>
      {learning ? <LearnPage /> : <SettingsForm />}
    </>
  )
}
it('uses real SWR hooks to apply saved quantities and advance after all words are marked', async () => {
  const cache = new Map()
  render(
    <SWRConfig
      value={{
        provider: () => cache,
        dedupingInterval: 0,
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        fallback: { '/word/daily': pool.slice(0, 4) },
      }}
    >
      <Flow />
    </SWRConfig>
  )
  await screen.findByLabelText('每日新词')
  fireEvent.click(screen.getByRole('button', { name: '10 个' }))
  fireEvent.click(screen.getByRole('radio', { name: /标准/ }))
  fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
  await waitFor(() => expect(screen.getByRole('button', { name: '保存设置' })).toBeDisabled())
  expect(setting.daily_new_words).toBe(10)
  expect(setting.review_multiplier).toBe(2)
  fireEvent.click(screen.getByRole('button', { name: '去学习' }))
  expect(await screen.findByText('本组新词 10 个 · 复习 0 个')).toBeInTheDocument()

  for (let index = 1; index <= 10; index++) {
    expect(await screen.findByRole('heading', { name: `word-${index}` })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看释义' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '记住了' }))
    })
  }
  expect(await screen.findByText('学习完成！')).toBeInTheDocument()
  expect(learned.size).toBe(10)
  fireEvent.click(screen.getByRole('button', { name: '再学一组' }))
  expect(await screen.findByRole('heading', { name: 'word-11' })).toBeInTheDocument()
  expect(useWordStore.getState().initialStudyCount).toBe(10)
  expect(useWordStore.getState().currentWords.every(word => !learned.has(word.id))).toBe(true)
})
