'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BookX,
  Brain,
  CheckCircle2,
  CircleHelp,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { get } from '@/lib/api'

import { useWordSettings } from '../hooks/useWord'
import type { Word } from '../types'
import { buildWordQuizQuestions, getQuizEligibleWords, type WordQuizQuestion } from '../utils/quiz'

type BookWordsResponse = {
  data: Word[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

const QUIZ_QUESTION_COUNT = 10
const QUIZ_TARGET_POOL_SIZE = 80
const QUIZ_FETCH_PER_PAGE = 100
const QUIZ_MAX_PAGES = 10

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

  return 'border-border opacity-70'
}

async function fetchQuizWords(bookId: number): Promise<Word[]> {
  const collectedWords: Word[] = []
  let currentPage = 1
  let lastPage = 1

  while (currentPage <= lastPage && currentPage <= QUIZ_MAX_PAGES) {
    const response = await get<BookWordsResponse>(
      `/word/books/${bookId}/words?page=${currentPage}&per_page=${QUIZ_FETCH_PER_PAGE}&filter=all`
    )

    const pageWords = response.data ?? []
    collectedWords.push(...pageWords)

    lastPage = response.meta?.last_page ?? currentPage

    if (getQuizEligibleWords(collectedWords).length >= QUIZ_TARGET_POOL_SIZE) {
      break
    }

    currentPage += 1
  }

  return collectedWords
}

export default function WordQuizPage() {
  const router = useRouter()
  const { data: settings, isLoading: settingsLoading } = useWordSettings()

  const [questions, setQuestions] = useState<WordQuizQuestion[]>([])
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [submittedOptionId, setSubmittedOptionId] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const hasSelectedBook = !!settings?.current_book_id
  const isLoading = settingsLoading || isQuizLoading
  const isCompleted = questions.length > 0 && currentIndex >= questions.length

  const currentQuestion = questions[currentIndex]
  const submittedOption = useMemo(
    () => currentQuestion?.options.find(option => option.id === submittedOptionId) ?? null,
    [currentQuestion, submittedOptionId]
  )
  const accuracy =
    questions.length > 0 ? Math.round((correctCount / Math.max(1, questions.length)) * 100) : 0

  const resetProgress = useCallback(() => {
    setCurrentIndex(0)
    setSelectedOptionId(null)
    setSubmittedOptionId(null)
    setCorrectCount(0)
  }, [])

  const loadQuiz = useCallback(async () => {
    if (!settings?.current_book_id) return

    setIsQuizLoading(true)
    setLoadError(null)
    resetProgress()

    try {
      const words = await fetchQuizWords(settings.current_book_id)
      const nextQuestions = buildWordQuizQuestions(words, QUIZ_QUESTION_COUNT)

      setQuestions(nextQuestions)

      if (nextQuestions.length === 0) {
        setLoadError('当前单词书可用于出题的单词不足，请先补充更多带释义的单词。')
      }
    } catch (error) {
      setQuestions([])
      setLoadError(error instanceof Error ? error.message : '加载测验失败')
    } finally {
      setIsQuizLoading(false)
    }
  }, [resetProgress, settings?.current_book_id])

  useEffect(() => {
    if (!settings?.current_book_id) return
    void loadQuiz()
  }, [loadQuiz, settings?.current_book_id])

  const handleSubmit = () => {
    if (!currentQuestion || !selectedOptionId) {
      toast.error('请先选择一个答案')
      return
    }

    if (submittedOptionId) {
      return
    }

    setSubmittedOptionId(selectedOptionId)

    const selectedOption = currentQuestion.options.find(option => option.id === selectedOptionId)
    if (selectedOption?.isCorrect) {
      setCorrectCount(prev => prev + 1)
      toast.success('回答正确')
    } else {
      toast.error('回答错误')
    }
  }

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1)
    setSelectedOptionId(null)
    setSubmittedOptionId(null)
  }

  if (isLoading) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  if (!hasSelectedBook) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <BookX className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">请先选择单词书</h2>
              <p className="text-muted-foreground text-sm">词汇量测验会基于当前单词书随机出题</p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/word">
                <Button>返回首页选书</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (loadError && questions.length === 0) {
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
              <Link href="/word/books">
                <Button>管理单词书</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (isCompleted) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-5 p-6 text-center">
            <Trophy className="text-primary mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">测验完成</h2>
              <p className="text-muted-foreground text-sm">
                本轮共 {questions.length} 题，答对 {correctCount} 题
              </p>
              <p className="mt-2 text-2xl font-bold">{accuracy}%</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
              <Button onClick={() => void loadQuiz()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                再测一轮
              </Button>
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

  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)
  const selectedOption =
    currentQuestion.options.find(option => option.id === selectedOptionId) ?? null
  const answeredCorrectly = !!submittedOption?.isCorrect

  return (
    <PageContainer maxWidth="2xl" className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/word">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">词汇量测验</p>
          <p className="text-muted-foreground text-xs">
            {settings?.current_book?.name ?? '当前单词书'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void loadQuiz()} title="重新抽题">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              第 {currentIndex + 1} / {questions.length} 题
            </span>
            <span className="text-muted-foreground">已答对 {correctCount} 题</span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Brain className="text-primary h-5 w-5" />
            </div>
            <CardTitle className="text-base">这个单词最接近哪个释义？</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-center">
            <div className="text-3xl font-bold tracking-wide">{currentQuestion.promptWord}</div>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map(option => {
              const isSelected = selectedOptionId === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!!submittedOptionId}
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${getOptionClasses(
                    !!submittedOptionId,
                    isSelected,
                    option.isCorrect
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                        isSelected ? 'border-current' : 'border-muted-foreground/40'
                      }`}
                    >
                      {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                    </div>
                    <span className="leading-6">{option.text}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {submittedOptionId && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                answeredCorrectly
                  ? 'border-green-500/40 bg-green-500/10'
                  : 'border-amber-500/40 bg-amber-500/10'
              }`}
            >
              <div className="mb-2 flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {answeredCorrectly ? '答对了' : '正确答案'}
              </div>
              <p>{currentQuestion.correctExplanation}</p>
              {!answeredCorrectly && selectedOption && (
                <p className="text-muted-foreground mt-2">你选择的是：{selectedOption.text}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedOptionId || !!submittedOptionId}
              variant="outline"
            >
              提交答案
            </Button>
            <Button onClick={handleNext} disabled={!submittedOptionId}>
              {currentIndex === questions.length - 1 ? '查看结果' : '下一题'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
