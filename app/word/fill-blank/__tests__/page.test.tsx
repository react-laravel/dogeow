import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../page'
import { useWordStore } from '../../stores/wordStore'
import type { Word } from '../../types'
const words: Word[] = [
  { id: 1, content: 'first', difficulty: 1, frequency: 1 },
  { id: 2, content: 'second', difficulty: 1, frequency: 1 },
]
vi.mock('../../hooks/useWord', () => ({
  useWordSettings: () => ({ data: { current_book_id: 1 } }),
  useFillBlankWords: () => ({ data: words, mutate: vi.fn() }),
}))
vi.mock('../../components/FillBlankCard', () => ({
  FillBlankCard: ({ word, onNext }: { word: Word; onNext: (correct: boolean) => void }) => (
    <div>
      <span>当前题：{word.content}</span>
      <button onClick={() => onNext(true)}>答对并下一题</button>
    </div>
  ),
}))
describe('FillBlankPage', () => {
  beforeEach(() => useWordStore.getState().reset())
  it('advances through distinct questions and restarts without touching the study queue', async () => {
    useWordStore
      .getState()
      .setCurrentWords([{ id: 9, content: 'ongoing', difficulty: 1, frequency: 1 }])
    useWordStore.getState().startStudy('learning')
    render(<Page />)
    expect(await screen.findByText('当前题：first')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '答对并下一题' }))
    expect(await screen.findByText('当前题：second')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '答对并下一题' }))
    expect(await screen.findByText('正确率：100%')).toBeInTheDocument()
    expect(useWordStore.getState().getCurrentWord()?.content).toBe('ongoing')
    fireEvent.click(screen.getByRole('button', { name: '再来一组' }))
    expect(await screen.findByText('当前题：first')).toBeInTheDocument()
  })
})
