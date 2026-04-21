import type { Word } from '../types'

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
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

export function getQuizEligibleWords(words: Word[]): Array<Word & { quizExplanation: string }> {
  const seenByContent = new Set<string>()

  return words.reduce<Array<Word & { quizExplanation: string }>>((result, word) => {
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

export function buildWordQuizQuestions(
  words: Word[],
  questionCount = 10,
  optionCount = DEFAULT_OPTION_COUNT
): WordQuizQuestion[] {
  const eligibleWords = getQuizEligibleWords(words)
  const requiredWrongOptions = Math.max(1, optionCount - 1)

  if (eligibleWords.length < optionCount) {
    return []
  }

  const questions: WordQuizQuestion[] = []
  const shuffledCandidates = shuffle(eligibleWords)

  for (const word of shuffledCandidates) {
    const distractors = shuffle(
      eligibleWords.filter(
        candidate => candidate.id !== word.id && candidate.quizExplanation !== word.quizExplanation
      )
    ).slice(0, requiredWrongOptions)

    if (distractors.length < requiredWrongOptions) {
      continue
    }

    const options = shuffle([
      {
        id: `${word.id}-correct`,
        text: word.quizExplanation,
        isCorrect: true,
      },
      ...distractors.map(candidate => ({
        id: `${word.id}-${candidate.id}`,
        text: candidate.quizExplanation,
        isCorrect: false,
      })),
    ])

    questions.push({
      id: `quiz-${word.id}`,
      wordId: word.id,
      promptWord: word.content,
      correctExplanation: word.quizExplanation,
      options,
    })

    if (questions.length >= questionCount) {
      break
    }
  }

  return questions
}
