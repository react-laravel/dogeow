import React from 'react'
import { ImageIcon, User, VideoIcon, Music } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChatMessage } from '../types'
import { SimpleMarkdown } from './SimpleMarkdown'

interface ChatMessageItemProps {
  message: ChatMessage
  variant?: 'dialog' | 'page'
}

export const ChatMessageItem = React.memo<ChatMessageItemProps>(({ message, variant = 'page' }) => {
  const isUser = message.role === 'user'
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
        unoptimized
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
          className="border-border bg-background/60 relative h-32 w-56 overflow-hidden rounded-md border border-dashed"
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
        className="h-32 w-56 rounded-md border object-cover"
      />
    )
  })

  const musicNodes = messageMusics.map((item, index) => {
    const key = item.id ?? item.url ?? `placeholder-${index}`

    if (item.isPlaceholder || !item.url) {
      return (
        <div
          key={key}
          className="border-border bg-background/60 relative h-16 w-48 overflow-hidden rounded-md border border-dashed"
        >
          <Skeleton className="h-full w-full rounded-none" />
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Music className="h-5 w-5" />
            <span className="text-[11px]">音乐生成中</span>
          </div>
        </div>
      )
    }

    return <audio key={key} src={item.url} controls className="h-12 w-48" />
  })

  if (variant === 'dialog') {
    return (
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* 消息气泡 */}
        <div
          className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} ${isUser ? 'max-w-[80%]' : 'max-w-full'} min-w-0`}
        >
          <div
            className={`rounded-xl px-3 py-2 break-words ${isUser ? '' : 'w-full'} ${
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}
          >
            {hasImages && (
              <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
                {imageNodes}
              </div>
            )}
            {hasVideos && (
              <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
                {videoNodes}
              </div>
            )}
            {hasMusics && (
              <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
                {musicNodes}
              </div>
            )}
            {message.content && (
              <div
                className={
                  isUser
                    ? '[&_.prose]:prose-invert [&_.prose_*]:!text-primary-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0'
                    : '[&_.prose]:prose-neutral [&_.prose_*]:!text-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0'
                }
              >
                <SimpleMarkdown content={message.content} />
              </div>
            )}
          </div>
        </div>
      </div>
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
})

ChatMessageItem.displayName = 'ChatMessageItem'
