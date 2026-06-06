'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WordCard } from '../components/WordCard'
import { useDailyWords, useWordSettings, checkIn } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { CheckCircle2, BookX, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout'
import { normalizeWordsResponse } from '../types'

export default function LearnPage() {
  const router = useRouter()
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const { data: words, isLoading: wordsLoading, error, mutate } = useDailyWords()
  const {
    studyQueue,
    initialStudyCount,
    setCurrentWords,
    learningStatus,
    setLearningStatus,
    dailyProgress,
    startStudy,
    resolveCurrentWord,
    getCurrentWord,
    reset,
  } = useWordStore()
  const [isCompleting, setIsCompleting] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [isContinuing, setIsContinuing] = useState(false)
  const [cardNonce, setCardNonce] = useState(0)

  const isLoading = settingsLoading || wordsLoading
  const hasSelectedBook = !!settings?.current_book_id

  const beginSession = useCallback(
    (wordsArray: ReturnType<typeof normalizeWordsResponse>) => {
      if (wordsArray.length === 0) return
      setCurrentWords(wordsArray)
      startStudy('learning')
    },
    [setCurrentWords, startStudy]
  )

  useEffect(() => {
    if (!hasSelectedBook || !words || learningStatus === 'completed') return

    const wordsArray = normalizeWordsResponse(words)
    if (wordsArray.length > 0 && studyQueue.length === 0) {
      beginSession(wordsArray)
    }
  }, [words, hasSelectedBook, sessionKey, learningStatus, studyQueue.length, beginSession])

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await checkIn()
      setLearningStatus('completed')
      toast.success('学习完成！已打卡')
    } catch (error) {
      toast.error('打卡失败')
      console.error('打卡失败:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleWordResult = (remembered: boolean) => {
    setCardNonce(n => n + 1)
    const isSessionComplete = resolveCurrentWord(remembered)
    if (isSessionComplete) {
      void handleComplete()
    }
  }

  const handleContinue = async () => {
    setIsContinuing(true)
    reset()
    setSessionKey(key => key + 1)
    try {
      const nextWords = await mutate()
      const wordsArray = normalizeWordsResponse(nextWords)
      if (wordsArray.length > 0) {
        beginSession(wordsArray)
      }
    } finally {
      setIsContinuing(false)
    }
  }

  // 加载中
  if (isLoading || isContinuing) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  // 错误处理
  if (error) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">
              加载失败: {error instanceof Error ? error.message : '未知错误'}
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => mutate()} variant="outline">
                重试
              </Button>
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 未选择单词书
  if (!hasSelectedBook) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <BookX className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">请先选择单词书</h2>
              <p className="text-muted-foreground text-sm">
                请先在首页选择要学习的单词书，再开始学习
              </p>
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

  // 学习完成
  if (learningStatus === 'completed') {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="text-primary mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">学习完成！</h2>
              <p className="text-muted-foreground text-sm">
                今天学习了 {dailyProgress.learned} 个新单词
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
              <Button onClick={() => void handleContinue()} disabled={isContinuing}>
                继续一组
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const wordsArray = normalizeWordsResponse(words)

  // 没有可学单词
  if (wordsArray.length === 0 && studyQueue.length === 0) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">当前没有新单词了</h2>
              <p className="text-muted-foreground text-sm">
                这本单词书的新词已学完，可以去复习，或换一本单词书继续
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/word/review">
                <Button>去复习</Button>
              </Link>
              <Link href="/word">
                <Button variant="outline">返回首页</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 正在初始化
  if (studyQueue.length === 0) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  const currentWord = getCurrentWord()
  const completedInSession = dailyProgress.learned
  const progressTotal = initialStudyCount || studyQueue.length + completedInSession

  return (
    <PageContainer maxWidth="2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/word">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <p className="text-muted-foreground text-sm">
          {completedInSession} / {progressTotal}
          {studyQueue.length > 1 && (
            <span className="text-muted-foreground/70 ml-1">（待完成 {studyQueue.length}）</span>
          )}
        </p>
        <div className="w-9" />
      </div>
      {currentWord && (
        <WordCard
          key={`${currentWord.id}-${sessionKey}-${cardNonce}`}
          word={currentWord}
          onResult={handleWordResult}
        />
      )}
      {isCompleting && (
        <p className="text-muted-foreground mt-4 text-center text-sm">正在打卡...</p>
      )}
    </PageContainer>
  )
}
