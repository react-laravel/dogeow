'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { getWordStudyPlanKey, normalizeWordsResponse, type Word } from '../types'

export default function LearnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wantsContinue = searchParams.get('continue') === '1'
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const { data: stats, isLoading: statsLoading } = useWordStats()
  const { mutate } = useDailyWords()
  const {
    studyQueue: storedQueue,
    sessionMode,
    sessionPlanKey,
    currentWords,
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
  const planKey = settings ? getWordStudyPlanKey(settings) : null
  const isCurrentSession = sessionMode === 'learning' && sessionPlanKey === planKey
  const studyQueue = isCurrentSession ? storedQueue : []
  const [completionError, setCompletionError] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [hasConfirmedContinue, setHasConfirmedContinue] = useState(false)
  const [cardNonce, setCardNonce] = useState(0)
  const requestIdRef = useRef(0)
  const initialPlanRef = useRef<string | null>(null)
  const [group, setGroup] = useState<{
    key: string | null
    phase: 'idle' | 'loading' | 'ready' | 'error'
    words: Word[]
    error?: string
  }>({ key: null, phase: 'idle', words: [] })

  const hasSelectedBook = !!settings?.current_book_id
  const todayCheckedIn = stats?.today_checked_in ?? false
  const shouldPromptContinue = !hasConfirmedContinue && (wantsContinue || todayCheckedIn)
  const isContinuing = group.key === planKey && group.phase === 'loading'
  const isLoading =
    settingsLoading ||
    statsLoading ||
    isContinuing ||
    (hasSelectedBook && !isCurrentSession && (group.key !== planKey || group.phase === 'idle'))
  const wordsArray = group.key === planKey ? group.words : []
  const error = group.key === planKey && group.phase === 'error' ? group.error : undefined

  // Only a completed revalidation may supply a new group. Cached SWR data is never a fallback.
  const loadGroup = useCallback(
    async (start: boolean) => {
      if (!planKey) return
      const requestId = ++requestIdRef.current
      setGroup({ key: planKey, phase: 'loading', words: [] })
      try {
        const response = await mutate()
        if (requestId !== requestIdRef.current) return
        if (response === undefined) throw new Error('暂时无法获取新的词组，请重试')
        const freshWords = normalizeWordsResponse(response)
        if (start) {
          reset()
          if (freshWords.length > 0) {
            setCurrentWords(freshWords)
            startStudy('learning', planKey)
            setCardNonce(value => value + 1)
          }
        }
        setGroup({ key: planKey, phase: 'ready', words: freshWords })
      } catch (cause) {
        if (requestId !== requestIdRef.current) return
        setGroup({
          key: planKey,
          phase: 'error',
          words: [],
          error: cause instanceof Error ? cause.message : '词组加载失败，请重试',
        })
      }
    },
    [planKey, mutate, reset, setCurrentWords, startStudy]
  )

  useEffect(() => {
    if (
      !hasSelectedBook ||
      !planKey ||
      settingsLoading ||
      statsLoading ||
      initialPlanRef.current === planKey
    )
      return
    initialPlanRef.current = planKey
    // An unfinished session can resume only if its book and learning quantities still match.
    if (isCurrentSession && learningStatus !== 'idle') return
    void loadGroup(!shouldPromptContinue)
  }, [
    hasSelectedBook,
    planKey,
    settingsLoading,
    statsLoading,
    isCurrentSession,
    learningStatus,
    loadGroup,
    shouldPromptContinue,
  ])

  useEffect(
    () => () => {
      requestIdRef.current += 1
      initialPlanRef.current = null
    },
    []
  )

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

  const handleContinue = () => {
    setHasConfirmedContinue(true)
    void loadGroup(true)
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
            <p className="text-destructive mb-4">加载失败：{error}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => void loadGroup(!shouldPromptContinue)} variant="outline">
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
                本组学习了 {dailyProgress.learned} 个新词，复习了 {dailyProgress.reviewed} 个单词
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
              <Button asChild>
                <Link href="/word/books">选择其他词书</Link>
              </Button>
              <Button onClick={() => void loadGroup(true)} variant="outline">
                刷新词组
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
  const completedInSession = dailyProgress.learned + dailyProgress.reviewed
  const progressTotal = initialStudyCount || studyQueue.length + completedInSession
  const newCount = currentWords.filter(word => !word.is_review_word).length
  const reviewCount = currentWords.length - newCount

  return (
    <PageContainer maxWidth="3xl">
      <StudyHeader
        title="今日学习"
        description={`本组新词 ${newCount} 个 · 复习 ${reviewCount} 个`}
        completed={completedInSession}
        total={progressTotal}
      />
      <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
        计划新词 {settings?.daily_new_words} 个，最多复习{' '}
        {(settings?.daily_new_words ?? 0) * (settings?.review_multiplier ?? 0)}{' '}
        个。复习仅安排到期单词，数量不足时以实际可学内容为准。
      </p>
      {currentWord && (
        <div key={`card-wrapper-${currentWord.id}-${cardNonce}`} className="animate-card-enter">
          <WordCard
            key={`${currentWord.id}-${cardNonce}`}
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
