import { describe, expect, it } from 'vitest'

import type { Word } from '../../types'
import {
  buildQuizQuestion,
  estimateVocabularySize,
  getEstimateConfidence,
  getQuizEligibleWords,
  normalizeQuizExplanation,
} from '../quiz'

const createWord = (id: number, content: string, explanation?: string): Word => ({
  id,
  content,
  explanation,
  difficulty: 1,
  frequency: 1,
})

describe('quiz utils', () => {
  it('normalizes explanation using the first non-empty line', () => {
    expect(normalizeQuizExplanation('\n  n. 苹果 \n可食用水果')).toBe('n. 苹果')
    expect(normalizeQuizExplanation('')).toBeNull()
  })

  it('filters out words without explanations and duplicate content', () => {
    const words = [
      createWord(1, 'apple', 'n. 苹果'),
      createWord(2, 'APPLE', 'n. 苹果(重复)'),
      createWord(3, 'banana'),
      createWord(4, 'orange', 'n. 橙子'),
    ]

    const eligible = getQuizEligibleWords(words)

    expect(eligible).toHaveLength(2)
    expect(eligible.map(word => word.content)).toEqual(['apple', 'orange'])
  })

  it('builds one multiple choice question with one correct option', () => {
    const words = getQuizEligibleWords([
      createWord(1, 'apple', 'n. 苹果'),
      createWord(2, 'banana', 'n. 香蕉'),
      createWord(3, 'orange', 'n. 橙子'),
      createWord(4, 'grape', 'n. 葡萄'),
      createWord(5, 'peach', 'n. 桃子'),
    ])

    const question = buildQuizQuestion(words, [])

    expect(question).not.toBeNull()
    expect(question?.options).toHaveLength(4)
    expect(question?.options.filter(option => option.isCorrect)).toHaveLength(1)

    const correctOption = question?.options.find(option => option.isCorrect)
    expect(correctOption?.text).toBe(question?.correctExplanation)
  })

  it('estimates vocabulary size from running accuracy', () => {
    expect(estimateVocabularySize(18, 20, 5000)).toBe(4500)
    expect(estimateVocabularySize(0, 0, 5000)).toBe(0)
  })

  it('returns confidence buckets from answer count', () => {
    expect(getEstimateConfidence(5)).toBe('low')
    expect(getEstimateConfidence(20)).toBe('medium')
    expect(getEstimateConfidence(50)).toBe('high')
  })
})
