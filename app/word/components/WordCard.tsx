'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, MoreHorizontal, Edit, CheckCircle, Volume2, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import type { Word } from '../types'
import { useWordStore } from '../stores/wordStore'
import { markWord, markWordAsSimple } from '../hooks/useWord'
import { WordAIDialog } from './WordAIDialog'
import { EditWordDialog } from './EditWordDialog'
import { toast } from 'sonner'
import { useWordPronunciation } from '../hooks/useWordPronunciation'

interface WordCardProps {
  word: Word
  autoPronounce?: boolean
  onResult: (remembered: boolean) => void
}

export function WordCard({ word, autoPronounce = true, onResult }: WordCardProps) {
  const { showTranslation, toggleTranslation } = useWordStore()
  const [isMarking, setIsMarking] = useState(false)
  const pending = useRef(false)
  const active = useRef(true)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { cancel, playBritishPronunciation, playAmericanPronunciation } = useWordPronunciation()

  useEffect(() => {
    active.current = true
    const timer = autoPronounce
      ? setTimeout(() => {
          void playAmericanPronunciation(word.content, { suppressErrors: true })
        }, 200)
      : undefined
    return () => {
      active.current = false
      clearTimeout(timer)
      cancel()
    }
  }, [word.content, autoPronounce, playAmericanPronunciation, cancel])

  const handleMark = async (remembered: boolean, simple = false) => {
    if (pending.current) return
    pending.current = true
    setIsMarking(true)
    try {
      if (simple) {
        await markWordAsSimple(word.id)
        toast.success('已设为简单词，后续不再背诵')
      } else if (remembered || word.is_review_word) {
        await markWord(word.id, remembered)
      }
      if (active.current) onResult(remembered)
    } catch {
      toast.error('标记失败，请重试')
    } finally {
      pending.current = false
      if (active.current) setIsMarking(false)
    }
  }

  return (
    <>
      <article className="bg-card rounded-2xl border">
        <div className="space-y-6 p-5 sm:p-8">
          <div className="text-center">
            <span className="text-muted-foreground text-xs">
              {word.is_review_word ? '复习词' : '学习卡片'}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight break-words sm:text-4xl">
              {word.content}
            </h2>
            {word.phonetic_us && (
              <p className="text-muted-foreground mt-2 text-sm break-words">/{word.phonetic_us}/</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => void playBritishPronunciation(word.content)}
                aria-label="英式发音"
              >
                <Volume2 className="size-4" />
                英音
              </Button>
              <Button
                variant="outline"
                onClick={() => void playAmericanPronunciation(word.content)}
                aria-label="美式发音"
              >
                <Volume2 className="size-4" />
                美音
              </Button>
            </div>
            {!!word.education_levels?.length && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {word.education_levels.map(level => (
                  <span
                    key={level.id}
                    className="text-muted-foreground bg-muted rounded-md px-2 py-1 text-xs"
                  >
                    {level.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {showTranslation ? (
            <div className="space-y-5">
              <section>
                <h3 className="mb-2 text-xs font-medium text-muted-foreground">释义</h3>
                <p className="bg-muted/50 rounded-xl p-4 leading-relaxed break-words whitespace-pre-line">
                  {word.explanation || '暂无中文释义'}
                </p>
              </section>
              {!!word.example_sentences?.length && (
                <section className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">例句</h3>
                  {word.example_sentences.slice(0, 2).map((example, index) => (
                    <div key={index} className="border-primary/30 border-l-2 pl-3">
                      <div className="flex items-start gap-2">
                        <p className="min-w-0 flex-1 text-sm leading-relaxed break-words">
                          {example.en}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mt-2 shrink-0"
                          onClick={() => void playAmericanPronunciation(example.en)}
                          aria-label={`朗读例句 ${index + 1}`}
                        >
                          <Volume2 className="size-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {example.zh}
                      </p>
                    </div>
                  ))}
                </section>
              )}
              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Button variant="ghost" onClick={() => setShowAIDialog(true)} aria-label="AI 学习">
                  <Bot className="size-4" />
                  AI 解答
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="更多操作">
                      <MoreHorizontal className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => void handleMark(true, true)}
                      disabled={isMarking}
                    >
                      <CheckCircle className="mr-2 size-4" />
                      设为简单词
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)} disabled={isMarking}>
                      <Edit className="mr-2 size-4" />
                      编辑单词
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-muted-foreground text-sm">先回想一下，这个单词是什么意思？</p>
            </div>
          )}
        </div>
        <div className="bg-card sticky bottom-0 z-10 rounded-b-2xl border-t p-4 sm:px-8">
          {showTranslation ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                disabled={isMarking}
                onClick={() => void handleMark(false)}
              >
                记不住
              </Button>
              <Button size="lg" disabled={isMarking} onClick={() => void handleMark(true)}>
                {isMarking ? '保存中…' : '记住了'}
              </Button>
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={toggleTranslation}>
              <Eye className="size-4" />
              查看释义
            </Button>
          )}
        </div>
      </article>
      <WordAIDialog word={word} open={showAIDialog} onOpenChange={setShowAIDialog} />
      <EditWordDialog word={word} open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  )
}
