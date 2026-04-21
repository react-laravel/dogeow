import { describe, expect, it } from 'vitest'

import type { Word } from '../../types'
import { buildWordQuizQuestions, getQuizEligibleWords, normalizeQuizExplanation } from '../quiz'

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

  it('builds multiple choice questions with one correct option', () => {
    const words = [
      createWord(1, 'apple', 'n. 苹果'),
      createWord(2, 'banana', 'n. 香蕉'),
      createWord(3, 'orange', 'n. 橙子'),
      createWord(4, 'grape', 'n. 葡萄'),
      createWord(5, 'peach', 'n. 桃子'),
    ]

    const questions = buildWordQuizQuestions(words, 3)

    expect(questions).toHaveLength(3)

    for (const question of questions) {
      expect(question.options).toHaveLength(4)
      expect(question.options.filter(option => option.isCorrect)).toHaveLength(1)

      const correctOption = question.options.find(option => option.isCorrect)
      expect(correctOption?.text).toBe(question.correctExplanation)
    }
  })

  it('returns an empty list when there are not enough valid options', () => {
    const words = [
      createWord(1, 'apple', 'n. 苹果'),
      createWord(2, 'banana', 'n. 香蕉'),
      createWord(3, 'orange', 'n. 橙子'),
    ]

    expect(buildWordQuizQuestions(words, 10)).toEqual([])
  })
})
