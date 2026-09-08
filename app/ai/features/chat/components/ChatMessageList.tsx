import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatLoadingIndicator } from './ChatLoadingIndicator'
import { ChatEmptyState } from './ChatEmptyState'
import type { ChatMessage } from '../types'

interface ChatMessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  completion?: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  variant?: 'dialog' | 'page'
  emptyState?: React.ReactNode
}

export const ChatMessageList = React.memo<ChatMessageListProps>(
  ({ messages, isLoading, completion, messagesEndRef, variant = 'page', emptyState }) => {
    const viewportRef = useRef<HTMLDivElement>(null)
    const followEndRef = useRef(true)
    const previousMessagesRef = useRef(messages)
    const [showJump, setShowJump] = useState(false)
    const displayMessages = useMemo(
      () => messages.filter(message => message.role !== 'system'),
      [messages]
    )
    const hasMessages = displayMessages.length > 0 || isLoading

    const jumpToEnd = () => {
      const viewport = viewportRef.current
      if (!viewport) return
      followEndRef.current = true
      viewport.scrollTop = viewport.scrollHeight
      setShowJump(false)
    }
    useLayoutEffect(() => {
      const viewport = viewportRef.current
      const sentMessage =
        previousMessagesRef.current !== messages && messages.at(-1)?.role === 'user'
      previousMessagesRef.current = messages
      if (sentMessage) followEndRef.current = true
      if (viewport && followEndRef.current) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }, [messages, completion, isLoading])

    useLayoutEffect(() => {
      const viewport = viewportRef.current
      if (!viewport || typeof ResizeObserver === 'undefined') return
      const observer = new ResizeObserver(() => {
        if (followEndRef.current) viewport.scrollTop = viewport.scrollHeight
      })
      observer.observe(viewport)
      return () => observer.disconnect()
    }, [])

    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={viewportRef}
          role="region"
          aria-label="对话内容"
          tabIndex={0}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
          onScroll={event => {
            const element = event.currentTarget
            const atEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 80
            followEndRef.current = atEnd
            setShowJump(!atEnd)
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-6">
            {hasMessages ? (
              <div className="space-y-6">
                {displayMessages.map((message, index) => (
                  <ChatMessageItem key={message.id ?? index} message={message} variant={variant} />
                ))}
                {isLoading && <ChatLoadingIndicator completion={completion} variant={variant} />}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              (emptyState ?? <ChatEmptyState variant={variant} />)
            )}
          </div>
        </div>
        {showJump && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="pointer-events-auto rounded-full border shadow-md"
              onClick={jumpToEnd}
            >
              <ArrowDown className="size-4" />
              回到最新
            </Button>
          </div>
        )}
      </div>
    )
  }
)
ChatMessageList.displayName = 'ChatMessageList'
