import React from 'react'
import { ImageIcon, User, VideoIcon, Music, Bot, Check, Copy, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChatMessage } from '../types'
import { SimpleMarkdown } from './SimpleMarkdown'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ChatMessageItemProps {
  message: ChatMessage
  variant?: 'dialog' | 'page'
  streaming?: boolean
}

export const ChatMessageItem = React.memo<ChatMessageItemProps>(
  ({ message, variant = 'page', streaming = false }) => {
    const isUser = message.role === 'user'
    const [copied, setCopied] = React.useState(false)
    const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    React.useEffect(
      () => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current)
      },
      []
    )
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        if (copyTimer.current) clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('复制失败，请重试')
      }
    }
    const messageImages = message.images ?? []
    const messageVideos = message.videos ?? []
    const messageMusics = message.musics ?? []
    const hasImages = messageImages.length > 0
    const hasVideos = messageVideos.length > 0
    const hasMusics = messageMusics.length > 0

    const imageNodes = messageImages.map((item, index) => {
      const key = item.id ?? item.url ?? `placeholder-${index}`

      if (item.isPlaceholder || !item.url) {
        return (
          <div
            key={key}
            className="border-border bg-background/60 relative h-24 w-24 overflow-hidden rounded-md border border-dashed"
          >
            <Skeleton className="h-full w-full rounded-none" />
            <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageIcon className="h-5 w-5" />
              <span className="text-[11px]">生成中</span>
            </div>
          </div>
        )
      }

      return (
        <Image
          key={key}
          src={item.url}
          alt={`消息图片 ${index + 1}`}
          width={128}
          height={128}
          className="h-24 w-24 rounded-md border object-cover"
        />
      )
    })

    const videoNodes = messageVideos.map((item, index) => {
      const key = item.id ?? item.url ?? `placeholder-${index}`

      if (item.isPlaceholder || !item.url) {
        return (
          <div
            key={key}
            className="border-border bg-background/60 relative h-32 w-56 max-w-full overflow-hidden rounded-md border border-dashed"
          >
            <Skeleton className="h-full w-full rounded-none" />
            <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1">
              <VideoIcon className="h-5 w-5" />
              <span className="text-[11px]">视频生成中</span>
            </div>
          </div>
        )
      }

      return (
        <video
          key={key}
          src={item.url}
          controls
          className="h-32 w-56 max-w-full rounded-md border object-cover"
        />
      )
    })

    const musicNodes = messageMusics.map((item, index) => {
      const key = item.id ?? item.url ?? `placeholder-${index}`

      if (item.isPlaceholder || !item.url) {
        return (
          <div
            key={key}
            className="border-border bg-background/60 relative h-16 w-48 max-w-full overflow-hidden rounded-md border border-dashed"
          >
            <Skeleton className="h-full w-full rounded-none" />
            <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Music className="h-5 w-5" />
              <span className="text-[11px]">音乐生成中</span>
            </div>
          </div>
        )
      }

      return <audio key={key} src={item.url} controls className="h-12 w-48 max-w-full" />
    })

    if (variant === 'dialog') {
      return (
        <article
          aria-label={isUser ? '你的消息' : 'AI 回复'}
          className={`flex min-w-0 flex-col ${isUser ? 'items-end' : 'items-start'}`}
        >
          {!isUser && (
            <div
              className={`mb-2 flex items-center gap-2 text-xs font-medium ${message.error ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {message.error ? (
                <AlertCircle className="size-4" />
              ) : (
                <Bot className="text-primary size-4" />
              )}
              <span>{message.error ? '暂时无法回答' : 'AI'}</span>
            </div>
          )}
          <div
            className={`min-w-0 max-w-full space-y-3 break-words ${isUser ? 'bg-muted/70 rounded-2xl rounded-tr-md px-4 py-3 sm:max-w-[85%]' : message.error ? 'bg-destructive/5 border-destructive/20 w-full rounded-xl border p-4' : 'w-full'}`}
          >
            {hasImages && <div className="flex flex-wrap gap-2">{imageNodes}</div>}
            {hasVideos && <div className="flex flex-wrap gap-2">{videoNodes}</div>}
            {hasMusics && <div className="flex flex-wrap gap-2">{musicNodes}</div>}
            {message.content && (
              <SimpleMarkdown
                content={message.content}
                className="text-sm leading-7 break-words [overflow-wrap:anywhere] [&_p]:my-3 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_th]:border-b [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border-b [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_table]:my-4 [&_table]:border-collapse [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted/60 [&_pre]:p-4 [&_pre]:text-xs [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_a]:text-primary"
              />
            )}
          </div>
          {!isUser && message.content && !streaming && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground mt-2 h-8 gap-1.5 px-2 text-xs"
              onClick={() => void copy()}
              aria-label={copied ? '已复制回答' : '复制回答'}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? '已复制' : '复制'}
            </Button>
          )}
        </article>
      )
    }

    // page variant
    return (
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            isUser ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Image
              src="/80.png"
              alt="DogeOW Logo"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* 消息气泡 */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
          <div
            className={`rounded-2xl px-4 py-2.5 ${
              isUser ? 'bg-muted text-foreground' : 'bg-muted text-foreground'
            }`}
          >
            {hasImages && (
              <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
                {imageNodes}
              </div>
            )}
            {message.content && (
              <SimpleMarkdown
                content={message.content}
                className={isUser ? '[&_*]:text-foreground' : '[&_*]:text-foreground'}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
)

ChatMessageItem.displayName = 'ChatMessageItem'
