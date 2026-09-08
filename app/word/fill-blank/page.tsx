'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FillBlankCard } from '../components/FillBlankCard'
import { useFillBlankWords, useWordSettings } from '../hooks/useWord'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { CheckCircle2, BookX, PartyPopper } from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout'
import { StudyHeader } from '../components/WordPageHeader'
import { normalizeWordsResponse, type Word } from '../types'

export default function FillBlankPage() {
  const router = useRouter()
  const { data: settings, isLoading: settingsLoading } = useWordSettings()
  const { data: words, isLoading: wordsLoading, error, mutate } = useFillBlankWords()
  const [currentWords, setCurrentWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const isLoading = settingsLoading || wordsLoading
  const hasSelectedBook = !!settings?.current_book_id

  useEffect(() => {
    if (!words || currentWords.length > 0 || isCompleted) return

    const wordsArray = normalizeWordsResponse(words)

    if (wordsArray.length > 0) {
      queueMicrotask(() => {
        setCurrentWords(wordsArray)
        setTotalCount(wordsArray.length)
      })
    }
  }, [words, currentWords.length, isCompleted])

  const handleNext = (correct: boolean) => {
    if (correct) {
      setCorrectCount(prev => prev + 1)
    }

    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(index => index + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    setIsCompleted(true)
    toast.success('练习完成！')
  }

  const handleContinue = () => {
    setCurrentWords([])
    setCurrentIndex(0)
    setIsCompleted(false)
    setCorrectCount(0)
    setTotalCount(0)
    mutate()
  }

  // 加载中
  if (isLoading) {
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
                请先在首页选择要学习的单词书，再开始练习
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

  // 练习完成
  if (isCompleted) {
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="text-primary mx-auto h-12 w-12" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">练习完成！</h2>
              <p className="text-muted-foreground text-sm">
                完成了 {totalCount} 个单词，正确 {correctCount} 个
              </p>
              <p className="text-muted-foreground mt-2 text-sm">正确率：{accuracy}%</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => router.push('/word')} variant="outline">
                返回首页
              </Button>
              <Button onClick={handleContinue}>再来一组</Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const wordsArray = normalizeWordsResponse(words)

  // 没有可练习的单词
  if (wordsArray.length === 0) {
    return (
      <PageContainer maxWidth="md">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <PartyPopper className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h2 className="mb-1 text-lg font-semibold">没有可练习的单词</h2>
              <p className="text-muted-foreground text-sm">
                请先学习一些单词，学过的单词才能用于填空练习
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/word/learn">
                <Button>去学习</Button>
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
  if (currentWords.length === 0) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </PageContainer>
    )
  }

  const currentWord = currentWords[currentIndex]

  return (
    <PageContainer maxWidth="3xl">
      <StudyHeader
        title="例句填空"
        description={`已答对 ${correctCount} 题 · 根据语境补全单词`}
        completed={currentIndex}
        total={currentWords.length}
        backHref="/word"
      />
      {currentWord && <FillBlankCard key={currentWord.id} word={currentWord} onNext={handleNext} />}
    </PageContainer>
  )
}
