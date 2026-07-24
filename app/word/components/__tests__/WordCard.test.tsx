import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWordStore } from '../../stores/wordStore'
import { WordCard } from '../WordCard'

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
})
