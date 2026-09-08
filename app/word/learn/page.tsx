'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WordCard } from '../components/WordCard'
import { useDailyWords, useWordSettings, useWordStats, checkIn } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { mutate as mutateCache } from 'swr'
import { CheckCircle2, BookX } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout'
import { StudyHeader } from '../components/WordPageHeader'
import { normalizeWordsResponse } from '../types'

export default function LearnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wantsContinue = searchParams.get('continue') === '1'
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const { data: stats, isLoading: statsLoading } = useWordStats()
  const { data: words, isLoading: wordsLoading, error, mutate } = useDailyWords()
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
  const isCurrentSession = sessionMode === null || sessionMode === 'learning'
  const studyQueue = isCurrentSession ? storedQueue : []
  const [completionError, setCompletionError] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [isContinuing, setIsContinuing] = useState(false)
  const [hasConfirmedContinue, setHasConfirmedContinue] = useState(false)
  const [cardNonce, setCardNonce] = useState(0)
  const [hasPreparedSession, setHasPreparedSession] = useState(false)

  const isLoading = settingsLoading || statsLoading || wordsLoading || !hasPreparedSession
  const hasSelectedBook = !!settings?.current_book_id
  const todayCheckedIn = stats?.today_checked_in ?? false
  const shouldPromptContinue = !hasConfirmedContinue && (wantsContinue || todayCheckedIn)

  const beginSession = useCallback(
    (wordsArray: ReturnType<typeof normalizeWordsResponse>) => {
      if (wordsArray.length === 0) return
      setCurrentWords(wordsArray)
      startStudy('learning')
    },
    [setCurrentWords, startStudy]
  )

  useEffect(() => {
    void mutate().finally(() => setHasPreparedSession(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      !hasSelectedBook ||
      !words ||
      isCompleting ||
      completionError ||
      (learningStatus === 'completed' && isCurrentSession)
    )
      return
    // 今日已打卡或从首页点「再学一组」时，不自动开新组，等用户确认
    if (shouldPromptContinue && studyQueue.length === 0) return

    const wordsArray = normalizeWordsResponse(words)
    if (wordsArray.length > 0 && studyQueue.length === 0) {
      beginSession(wordsArray)
    }
  }, [
    words,
    hasSelectedBook,
    sessionKey,
    learningStatus,
    studyQueue.length,
    beginSession,
    shouldPromptContinue,
    isCompleting,
    completionError,
    isCurrentSession,
  ])

  const handleComplete = async () => {
    setCompletionError(false)
    setIsCompleting(true)
    try {
      await checkIn()
      setLearningStatus('completed')
      void mutateCache('/word/stats')
      void mutateCache(key => typeof key === 'string' && key.startsWith('/word/calendar'))
      toast.success('学习完成！已打卡')
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
    // URL 参数和「今日已打卡」会在整个页面生命周期内保持为 true。
    // 用户确认后必须显式解除拦截，否则重置队列后仍会回到确认页。
    setHasConfirmedContinue(true)
    reset()
    setSessionKey(key => key + 1)
    try {
      const nextWords = await mutate(undefined, { revalidate: true })
      const wordsArray = normalizeWordsResponse(nextWords ?? words)
      if (wordsArray.length > 0) {
        beginSession(wordsArray)
      }
    } catch (error) {
      toast.error('加载下一组失败，请重试')
      console.error('加载下一组单词失败:', error)
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
            <h1 className="text-lg font-semibold">学习已完成</h1>
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
              <p className="text-muted-foreground text-sm">
                选择一本适合自己的单词书，即可开始今天的学习
              </p>
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

  // 学习完成
  if (learningStatus === 'completed' && isCurrentSession) {
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
                再学一组
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const wordsArray = normalizeWordsResponse(words)

  // 今日已打卡 / 主动续学：等待用户点「再学一组」
  if (shouldPromptContinue && studyQueue.length === 0 && wordsArray.length > 0) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="text-primary mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">
                {todayCheckedIn ? '今日已打卡' : '继续学习'}
              </h2>
              <p className="text-muted-foreground text-sm">
                还有 {wordsArray.length} 个单词可以学习，要再学一组吗？
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
              <Button onClick={() => void handleContinue()} disabled={isContinuing}>
                再学一组
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

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
                这本单词书当前没有可学习或可复习的单词
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => void handleContinue()}
                disabled={isContinuing}
                variant="default"
              >
                再学一组
              </Button>
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
    <PageContainer maxWidth="3xl">
      <StudyHeader
        title="今日学习"
        description="先回想词义，再查看释义与例句。"
        completed={completedInSession}
        total={progressTotal}
      />
      {currentWord && (
        <div key={`card-wrapper-${currentWord.id}-${cardNonce}`} className="animate-card-enter">
          <WordCard
            key={`${currentWord.id}-${sessionKey}-${cardNonce}`}
            word={currentWord}
            autoPronounce={settings?.is_auto_pronounce ?? false}
            onResult={handleWordResult}
          />
        </div>
      )}
      {isCompleting && (
        <p className="text-muted-foreground mt-4 text-center text-sm">正在打卡...</p>
      )}
    </PageContainer>
  )
}
