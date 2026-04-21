'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Brain, CircleHelp, Gauge, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { get, post } from '@/lib/api'

import type { Book, Word } from '../types'
import {
  buildQuizQuestion,
  estimateVocabularySize,
  getQuizEligibleWords,
  type EligibleQuizWord,
  type WordQuizQuestion,
} from '../utils/quiz'

type BookWordsResponse = {
  data: Word[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

type QuizEstimateAnswer = {
  word_id: number
  correct: boolean
}

type QuizEstimateResponse = {
  estimated_vocabulary_size?: number
  accuracy?: number
  confidence?: 'low' | 'medium' | 'high'
  tested_count?: number
  correct_count?: number
}

function parseBooksResponse(response: unknown): Book[] {
  if (Array.isArray(response)) {
    return response as Book[]
  }

  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: unknown }).data
    if (Array.isArray(data)) {
      return data as Book[]
    }
  }

  return []
}

function parseBookWordsResponse(response: unknown): BookWordsResponse {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: unknown }).data
    const meta = (response as { meta?: BookWordsResponse['meta'] }).meta

    if (Array.isArray(data)) {
      return { data: data as Word[], meta }
    }
  }

  return { data: [], meta: undefined }
}

const QUIZ_FETCH_PER_PAGE = 200
const QUIZ_RECENT_SIZE = 20
const UNKNOWN_SUBMISSION_ID = '__unknown__'

function getOptionClasses(submitted: boolean, isSelected: boolean, isCorrect: boolean): string {
  if (!submitted) {
    return isSelected
      ? 'border-primary bg-primary/10 text-foreground'
      : 'border-border hover:border-primary/40 hover:bg-accent/40'
  }

  if (isCorrect) {
    return 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300'
  }

  if (isSelected) {
    return 'border-destructive bg-destructive/10 text-destructive'
  }

  return 'border-border opacity-60'
}

async function fetchAllSystemQuizWords(): Promise<EligibleQuizWord[]> {
  const booksResponse = await get<unknown>('/word/books')
  const books = parseBooksResponse(booksResponse)

  if (!books.length) {
    return []
  }

  const collectedWords: Word[] = []

  for (const book of books) {
    let currentPage = 1
    let lastPage = 1

    while (currentPage <= lastPage) {
      const response = await get<unknown>(
        `/word/books/${book.id}/words?page=${currentPage}&per_page=${QUIZ_FETCH_PER_PAGE}&filter=all`
      )
      const parsedResponse = parseBookWordsResponse(response)

      collectedWords.push(...parsedResponse.data)
      lastPage = parsedResponse.meta?.last_page ?? currentPage
      currentPage += 1
    }
  }

  return getQuizEligibleWords(collectedWords)
}

export default function WordQuizPage() {
  const [quizWords, setQuizWords] = useState<EligibleQuizWord[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<WordQuizQuestion | null>(null)
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [recentWordIds, setRecentWordIds] = useState<number[]>([])
  const [submittedAnswers, setSubmittedAnswers] = useState<QuizEstimateAnswer[]>([])
  const [vocabularyEstimate, setVocabularyEstimate] = useState(0)

  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / Math.max(1, answeredCount)) * 100) : 0
  const applyNextQuestion = useCallback((words: EligibleQuizWord[], recentIds: number[] = []) => {
    const nextQuestion = buildQuizQuestion(words, recentIds)
    setCurrentQuestion(nextQuestion)
    setSelectedOptionId(null)
    setSubmittedOptionId(null)
    return nextQuestion
  }, [])

  const loadQuiz = useCallback(async () => {
    setIsQuizLoading(true)
    setLoadError(null)
    setAnsweredCount(0)
    setCorrectCount(0)
    setRecentWordIds([])
    setSubmittedAnswers([])
    setVocabularyEstimate(0)

    try {
      const words = await fetchAllSystemQuizWords()
      setQuizWords(words)

      if (words.length < 4) {
        setCurrentQuestion(null)
        setLoadError('系统内可用于测验的单词不足，请先补充更多带释义的单词。')
        return
      }

      const nextQuestion = buildQuizQuestion(words, [])

      if (!nextQuestion) {
        setCurrentQuestion(null)
        setLoadError('当前无法生成有效题目，请稍后重试。')
        return
      }

      setCurrentQuestion(nextQuestion)
    } catch (error) {
      setQuizWords([])
      setCurrentQuestion(null)
      setLoadError(error instanceof Error ? error.message : '加载测验失败')
    } finally {
      setIsQuizLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQuiz()
  }, [loadQuiz])

  const submitAnswer = async (selectedAnswerId: string | null) => {
    if (!currentQuestion || submittedOptionId || isSubmittingAnswer) {
      return
    }

    const selectedOption = currentQuestion.options.find(option => option.id === selectedAnswerId)
    const isCorrect = !!selectedOption?.isCorrect
    const nextAnswers = [
      ...submittedAnswers,
      { word_id: currentQuestion.wordId, correct: isCorrect },
    ]

    setIsSubmittingAnswer(true)
    setSubmittedOptionId(selectedAnswerId ?? UNKNOWN_SUBMISSION_ID)

    try {
      const estimateResponse = await post<QuizEstimateResponse>('/word/quiz/estimate', {
        answers: nextAnswers,
      })

      setSubmittedAnswers(nextAnswers)
      setAnsweredCount(estimateResponse.tested_count ?? nextAnswers.length)
      setCorrectCount(
        estimateResponse.correct_count ?? nextAnswers.filter(answer => answer.correct).length
      )

      if (typeof estimateResponse.estimated_vocabulary_size === 'number') {
        setVocabularyEstimate(estimateResponse.estimated_vocabulary_size)
      } else {
        setVocabularyEstimate(
          estimateVocabularySize(
            estimateResponse.correct_count ?? nextAnswers.filter(answer => answer.correct).length,
            estimateResponse.tested_count ?? nextAnswers.length,
            quizWords.length
          )
        )
      }
    } catch (error) {
      setSubmittedOptionId(null)
      toast.error(error instanceof Error ? error.message : '估算词汇量失败')
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handleSubmit = async () => {
    await submitAnswer(selectedOptionId)
  }

  const handleUnknown = async () => {
    await submitAnswer(null)
  }

  const handleNext = () => {
    if (!currentQuestion || !submittedOptionId) {
      return
    }

    const nextRecentWordIds = [...recentWordIds, currentQuestion.wordId].slice(-QUIZ_RECENT_SIZE)
    setRecentWordIds(nextRecentWordIds)
    applyNextQuestion(quizWords, nextRecentWordIds)
  }

  if (isQuizLoading) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  if (loadError && !currentQuestion) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CircleHelp className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">暂时无法开始测验</h2>
              <p className="text-muted-foreground text-sm">{loadError}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => void loadQuiz()} variant="outline">
                重试
              </Button>
              <Link href="/word">
                <Button>返回首页</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (!currentQuestion) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  const primaryButtonLabel = submittedOptionId ? '下一题' : selectedOptionId ? '提交答案' : '不知道'

  const handlePrimaryAction = () => {
    if (submittedOptionId) {
      handleNext()
      return
    }

    if (selectedOptionId) {
      void handleSubmit()
      return
    }

    void handleUnknown()
  }

  return (
    <PageContainer maxWidth="4xl" className="space-y-3">
      <div className="flex items-center justify-between">
        <Link href="/word">
          <Button variant="ghost" size="icon" aria-label="返回背单词首页">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">词汇量测验</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void loadQuiz()} title="重新开始测验">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="space-y-3 p-3">
            <div className="rounded-xl border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gauge className="text-primary h-4 w-4" />
                估算词汇量
              </div>
              <div className="mt-2 text-3xl leading-none font-bold">
                {vocabularyEstimate.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border px-2 py-3">
                <div className="text-muted-foreground text-[11px]">已测试</div>
                <div className="mt-1 text-base font-semibold">{answeredCount}</div>
              </div>
              <div className="rounded-xl border px-2 py-3">
                <div className="text-muted-foreground text-[11px]">答对</div>
                <div className="mt-1 text-base font-semibold">{correctCount}</div>
              </div>
              <div className="rounded-xl border px-2 py-3">
                <div className="text-muted-foreground text-[11px]">正确率</div>
                <div className="mt-1 text-base font-semibold">{accuracy}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-full p-2">
                <Brain className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">这个单词最接近哪个释义？</p>
                <p className="text-muted-foreground text-xs">第 {answeredCount + 1} 题</p>
              </div>
            </div>

            <div className="py-1 text-center">
              <div className="text-3xl font-bold tracking-wide sm:text-[2rem]">
                {currentQuestion.promptWord}
              </div>
            </div>

            <div className="grid gap-2.5 md:grid-cols-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOptionId === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!!submittedOptionId}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${getOptionClasses(
                      !!submittedOptionId,
                      isSelected,
                      option.isCorrect
                    )}`}
                    title={option.text}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                          isSelected ? 'border-current' : 'border-muted-foreground/40'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span
                        className="text-sm leading-5 sm:text-[15px]"
                        style={{
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3,
                          overflow: 'hidden',
                        }}
                      >
                        {option.text}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-0.5">
              <Button onClick={handlePrimaryAction} disabled={isSubmittingAnswer} variant="outline">
                {isSubmittingAnswer ? '计算中...' : primaryButtonLabel}
                {submittedOptionId && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
