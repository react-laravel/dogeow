import type { Word } from '../types'

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface EligibleQuizWord extends Word {
  quizExplanation: string
}

export interface WordQuizQuestion {
  id: string
  wordId: number
  promptWord: string
  correctExplanation: string
  options: QuizOption[]
}

const DEFAULT_OPTION_COUNT = 4

function shuffle<T>(items: T[]): T[] {
  const next = [...items]

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }

  return next
}

export function normalizeQuizExplanation(explanation?: string): string | null {
  if (!explanation) return null

  const firstLine = explanation
    .split('\n')
    .map(line => line.trim())
    .find(Boolean)

  if (!firstLine) return null

  const cleaned = firstLine
    .replace(/^[\d\-\u2022、.()\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || null
}

export function getQuizEligibleWords(words: Word[]): EligibleQuizWord[] {
  const seenByContent = new Set<string>()

  return words.reduce<EligibleQuizWord[]>((result, word) => {
    const quizExplanation = normalizeQuizExplanation(word.explanation)
    const normalizedContent = word.content.trim().toLowerCase()

    if (!quizExplanation || !normalizedContent || seenByContent.has(normalizedContent)) {
      return result
    }

    seenByContent.add(normalizedContent)
    result.push({ ...word, quizExplanation })
    return result
  }, [])
}

export function buildQuizQuestion(
  words: EligibleQuizWord[],
  recentWordIds: number[] = [],
  optionCount = DEFAULT_OPTION_COUNT
): WordQuizQuestion | null {
  const requiredWrongOptions = Math.max(1, optionCount - 1)

  if (words.length < optionCount) {
    return null
  }

  const recentSet = new Set(recentWordIds)
  const preferredTargets = words.filter(word => !recentSet.has(word.id))
  const targetPool = preferredTargets.length > 0 ? preferredTargets : words
  const target = shuffle(targetPool)[0]

  if (!target) {
    return null
  }

  const distractors = shuffle(
    words.filter(word => word.id !== target.id && word.quizExplanation !== target.quizExplanation)
  ).slice(0, requiredWrongOptions)

  if (distractors.length < requiredWrongOptions) {
    return null
  }

  return {
    id: `quiz-${target.id}-${Date.now()}`,
    wordId: target.id,
    promptWord: target.content,
    correctExplanation: target.quizExplanation,
    options: shuffle([
      {
        id: `${target.id}-correct`,
        text: target.quizExplanation,
        isCorrect: true,
      },
      ...distractors.map(candidate => ({
        id: `${target.id}-${candidate.id}`,
        text: candidate.quizExplanation,
        isCorrect: false,
      })),
    ]),
  }
}

export function estimateVocabularySize(
  correctAnswers: number,
  answeredQuestions: number,
  totalEligibleWords: number
): number {
  if (answeredQuestions <= 0 || totalEligibleWords <= 0) {
    return 0
  }

  const rawEstimate = (correctAnswers / answeredQuestions) * totalEligibleWords
  return Math.max(0, Math.min(totalEligibleWords, Math.round(rawEstimate)))
}

export function getEstimateConfidence(answeredQuestions: number): 'low' | 'medium' | 'high' {
  if (answeredQuestions >= 40) return 'high'
  if (answeredQuestions >= 15) return 'medium'
  return 'low'
}
