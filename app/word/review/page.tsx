'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WordCard } from '../components/WordCard'
import { useDailyWords, useReviewWords, useWordSettings, checkIn } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { mutate as mutateCache } from 'swr'
import { CheckCircle2, BookX, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout'
import { StudyHeader } from '../components/WordPageHeader'
import { normalizeWordsResponse } from '../types'

export default function ReviewPage() {
  const router = useRouter()
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const { data: words, isLoading: wordsLoading, error, mutate } = useReviewWords()
  const { data: dailyWords, isLoading: dailyWordsLoading } = useDailyWords()
  const {
    studyQueue: storedQueue,
    sessionMode,
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
  const isCurrentSession = sessionMode === null || sessionMode === 'reviewing'
  const studyQueue = isCurrentSession ? storedQueue : []
  const [completionError, setCompletionError] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [isContinuing, setIsContinuing] = useState(false)
  const [cardNonce, setCardNonce] = useState(0)

  const isLoading = settingsLoading || wordsLoading || dailyWordsLoading
  const hasSelectedBook = !!settings?.current_book_id

  const beginSession = useCallback(
    (wordsArray: ReturnType<typeof normalizeWordsResponse>) => {
      if (wordsArray.length === 0) return
      setCurrentWords(wordsArray)
      startStudy('reviewing')
    },
    [setCurrentWords, startStudy]
  )

  useEffect(() => {
    if (
      !hasSelectedBook ||
      !words ||
      isCompleting ||
      completionError ||
      (learningStatus === 'completed' && isCurrentSession)
    )
      return

    const wordsArray = normalizeWordsResponse(words)
    if (wordsArray.length > 0 && studyQueue.length === 0) {
      beginSession(wordsArray)
    }
  }, [
    words,
    sessionKey,
    learningStatus,
    studyQueue.length,
    beginSession,
    isCompleting,
    completionError,
    isCurrentSession,
    hasSelectedBook,
  ])

  const handleComplete = async () => {
    setCompletionError(false)
    setIsCompleting(true)
    try {
      await checkIn()
      setLearningStatus('completed')
      void mutateCache('/word/stats')
      void mutateCache(key => typeof key === 'string' && key.startsWith('/word/calendar'))
      toast.success('复习完成！已打卡')
    } catch (error) {
      setCompletionError(true)
      toast.error('打卡失败，请重试')
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
    } catch {
      toast.error('加载复习内容失败，请重试')
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

  if (isCompleting || completionError) {
    return (
      <PageContainer maxWidth="3xl">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-lg font-semibold">复习已完成</h1>
            <p role="status" className="text-muted-foreground text-sm">
              {isCompleting ? '正在记录本次学习…' : '打卡暂未成功，本次进度已保留。'}
            </p>
            {completionError && <Button onClick={() => void handleComplete()}>重试打卡</Button>}
          </CardContent>
        </Card>
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
              <p className="text-muted-foreground text-sm">选择正在学习的单词书，查看待复习内容</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/word/books">选择单词书</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  // 复习完成
  if (learningStatus === 'completed' && isCurrentSession) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="text-primary mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">复习完成！</h2>
              <p className="text-muted-foreground text-sm">
                今天复习了 {dailyProgress.reviewed} 个单词
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
              <Button onClick={() => void handleContinue()} disabled={isContinuing}>
                再复习一组
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const wordsArray = normalizeWordsResponse(words)
  const dailyWordsArray = normalizeWordsResponse(dailyWords)
  const hasLearnableWords = dailyWordsArray.length > 0

  // 今天没有需要复习的单词
  if (wordsArray.length === 0 && studyQueue.length === 0) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <PartyPopper className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">今天没有需要复习的单词</h2>
              <p className="text-muted-foreground text-sm">
                {hasLearnableWords
                  ? '先去学习新单词吧，学过的单词会在适当的时间提醒你复习'
                  : '这本单词书当前没有可学习或可复习的单词，可以换一本单词书继续'}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              {hasLearnableWords && (
                <Link href="/word/learn">
                  <Button>去学习</Button>
                </Link>
              )}
              <Link href="/word">
                <Button variant={hasLearnableWords ? 'outline' : 'default'}>返回首页</Button>
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
  const completedInSession = dailyProgress.reviewed
  const progressTotal = initialStudyCount || studyQueue.length + completedInSession

  return (
    <PageContainer maxWidth="3xl">
      <StudyHeader
        title="复习巩固"
        description="回顾到期单词，巩固记忆。"
        completed={completedInSession}
        total={progressTotal}
        backHref="/word"
      />
      {currentWord && (
        <WordCard
          key={`${currentWord.id}-${sessionKey}-${cardNonce}`}
          word={currentWord}
          autoPronounce={settings?.is_auto_pronounce ?? false}
          onResult={handleWordResult}
        />
      )}
      {isCompleting && (
        <p className="text-muted-foreground mt-4 text-center text-sm">正在打卡...</p>
      )}
    </PageContainer>
  )
}
