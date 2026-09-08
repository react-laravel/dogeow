import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWordStore } from '../../stores/wordStore'
import { WordCard } from '../WordCard'
import { markWord } from '../../hooks/useWord'

const pronunciationMocks = vi.hoisted(() => ({
  cancel: vi.fn(),
  playBritishPronunciation: vi.fn(),
  playAmericanPronunciation: vi.fn(),
}))

vi.mock('../../hooks/useWordPronunciation', () => ({
  useWordPronunciation: () => pronunciationMocks,
}))

vi.mock('../../hooks/useWord', () => ({
  markWord: vi.fn(),
  markWordAsSimple: vi.fn(),
}))

vi.mock('../WordAIDialog', () => ({
  WordAIDialog: () => null,
}))

vi.mock('../EditWordDialog', () => ({
  EditWordDialog: () => null,
}))

describe('WordCard', () => {
  afterEach(() => vi.useRealTimers())
  beforeEach(() => {
    vi.clearAllMocks()
    useWordStore.setState({ showTranslation: true })
  })

  it('reads an English example sentence from its speaker button', () => {
    const sentence = 'It angers me that people would fabricate a story like that.'

    render(
      <WordCard
        word={{
          id: 1,
          content: 'fabricate',
          difficulty: 1,
          frequency: 1,
          example_sentences: [{ en: sentence, zh: '人们编造这样的谎话让我感到愤怒。' }],
        }}
        onResult={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '朗读例句 1' }))

    expect(pronunciationMocks.playAmericanPronunciation).toHaveBeenCalledWith(sentence)
  })
  it.each([false, true])('respects automatic pronunciation = %s', async autoPronounce => {
    vi.useFakeTimers()
    render(
      <WordCard
        word={{ id: 1, content: 'test', difficulty: 1, frequency: 1 }}
        autoPronounce={autoPronounce}
        onResult={vi.fn()}
      />
    )
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(pronunciationMocks.playAmericanPronunciation).toHaveBeenCalledTimes(
      autoPronounce ? 1 : 0
    )
    fireEvent.click(screen.getByRole('button', { name: '美式发音' }))
    expect(pronunciationMocks.playAmericanPronunciation).toHaveBeenLastCalledWith('test')
  })
  it('locks repeat submissions and does not advance an unmounted card', async () => {
    let resolve!: () => void
    vi.mocked(markWord).mockImplementationOnce(
      () =>
        new Promise(done => {
          resolve = () => done({ message: 'ok' })
        })
    )
    const onResult = vi.fn()
    const { unmount } = render(
      <WordCard
        word={{ id: 1, content: 'test', difficulty: 1, frequency: 1 }}
        autoPronounce={false}
        onResult={onResult}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '记住了' }))
    fireEvent.click(screen.getByRole('button', { name: '保存中…' }))
    expect(markWord).toHaveBeenCalledTimes(1)
    unmount()
    await act(async () => {
      resolve()
    })
    expect(onResult).not.toHaveBeenCalled()
  })
  it('reveals the explanation before offering memory actions', () => {
    useWordStore.setState({ showTranslation: false })
    render(
      <WordCard
        word={{ id: 1, content: 'test', explanation: '测试', difficulty: 1, frequency: 1 }}
        autoPronounce={false}
        onResult={vi.fn()}
      />
    )
    expect(screen.queryByText('测试')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看释义' }))
    expect(screen.getByText('测试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '记住了' })).toBeEnabled()
  })
})
