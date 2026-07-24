'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Word } from '../types'
import { Send, Bot, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { authenticatedInternalFetch } from '@/lib/api/internal-auth'
import { getWordAIRequestConfig } from '../utils/aiRequest'
import { cn } from '@/lib/helpers'
import { SimpleMarkdown } from '@/app/ai/features/chat/components/SimpleMarkdown'

interface WordAIDialogProps {
  word: Word
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function WordAIDialog({ word, open, onOpenChange }: WordAIDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setMessages([])
      setInput('')
      setErrorMessage(null)
      setCopiedIdx(null)
    }
  }, [open, word])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const copyMessage = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIdx(idx)
      toast.success('已复制')
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setErrorMessage(null)
      const userMessage: Message = { role: 'user', content }
      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      try {
        const chatMessages = [
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content },
        ]

        const body = {
          ...getWordAIRequestConfig(),
          useChat: true,
          messages: chatMessages,
          command: [
            '你是一个英语学习助手，专门解答用户对当前单词的疑问。',
            '请用中文清晰、简洁地回答；需要时解释词义、语法、搭配、语境和例句。',
            `当前单词：${word.content}`,
            `当前释义：${word.explanation || '暂无'}`,
            `当前例句：${word.example_sentences?.map(example => `${example.en}（${example.zh}）`).join('；') || '暂无'}`,
          ].join('\n'),
        }

        const response = await authenticatedInternalFetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const text = await response.text()
          let message = 'AI 请求失败'
          try {
            const data = text ? JSON.parse(text) : {}
            if (typeof (data as { error?: string })?.error === 'string')
              message = (data as { error: string }).error
          } catch {
            if (text.trim()) message = text.trim()
          }
          throw new Error(message)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('无法读取响应')

        let assistantContent = ''
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = new TextDecoder().decode(value)
          const lines = text.split('\n').filter(line => line.trim())

          for (const line of lines) {
            try {
              if (line.startsWith('0:')) {
                const match = line.match(/^0:"(.*)"$/)
                if (match) {
                  const decodedContent = match[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\')
                  assistantContent += decodedContent
                  setMessages(prev => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantContent,
                    }
                    return newMessages
                  })
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      } catch (error) {
        console.error('AI 请求失败:', error)
        const apiMsg = error instanceof Error ? error.message : ''
        const toShow =
          typeof apiMsg === 'string' && apiMsg && apiMsg !== 'AI 请求失败'
            ? apiMsg
            : 'AI 请求失败，请稍后重试'
        setErrorMessage(toShow)
        toast.error(toShow)
        setMessages(prev => {
          const lastMessage = prev.at(-1)
          return lastMessage?.role === 'assistant' && !lastMessage.content
            ? prev.slice(0, -1)
            : prev
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, word]
  )

  const handleSubmit = () => {
    void sendMessage(input)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
        <SheetHeader className="shrink-0 border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Bot className="text-primary h-4 w-4" />
            AI 解答 - {word.content}
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="font-medium">关于 “{word.content}” 有什么疑问？</h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                可以询问词义区别、语法、常见搭配、使用场景或例句。
              </p>
            </div>
          ) : (
            <div className="space-y-4" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'group relative max-w-[88%] rounded-2xl px-4 py-3 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap'
                        : 'bg-muted rounded-bl-md pr-10'
                    )}
                  >
                    {message.role === 'assistant' && message.content ? (
                      <SimpleMarkdown
                        content={message.content}
                        className="prose-p:my-1 prose-pre:overflow-x-auto prose-code:break-words"
                      />
                    ) : (
                      message.content || (isLoading ? '正在思考…' : '')
                    )}
                    {message.role === 'assistant' && message.content ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 opacity-70 hover:opacity-100"
                        onClick={() => void copyMessage(message.content, index)}
                        aria-label="复制回答"
                      >
                        {copiedIdx === index ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {isLoading && messages.at(-1)?.role !== 'assistant' ? (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                    正在思考…
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {errorMessage ? (
            <p className="text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-sm">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="bg-background/95 shrink-0 border-t p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={`询问关于 ${word.content} 的问题…`}
              aria-label="输入问题"
              rows={2}
              className="max-h-32 min-h-11 resize-none"
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="h-11 shrink-0 gap-2 px-4"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">发送</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
