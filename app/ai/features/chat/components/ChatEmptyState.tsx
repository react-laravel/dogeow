import React from 'react'
import { ArrowUpRight, BookOpen, Bot, Lightbulb, PenLine, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatEmptyStateProps {
  variant?: 'dialog' | 'page'
  mode?: 'ai' | 'knowledge'
  onSuggestion?: (prompt: string) => void
  documents?: Array<{ title: string; slug: string }>
  knowledgeLoading?: boolean
  knowledgeError?: boolean
  knowledgeUpdatedAt?: string
  onRetryKnowledge?: () => void
}

export const ChatEmptyState = React.memo<ChatEmptyStateProps>(
  ({
    mode = 'ai',
    onSuggestion,
    documents,
    knowledgeLoading,
    knowledgeError,
    knowledgeUpdatedAt,
    onRetryKnowledge,
  }) => {
    const knowledge = mode === 'knowledge'
    const suggestions = knowledge
      ? documents?.length
        ? documents.slice(0, 3).map(doc => ({
            title: doc.title,
            prompt: `请根据知识库介绍《${doc.title}》的主要内容。`,
            icon: BookOpen,
          }))
        : [{ title: '知识库里有哪些内容？', prompt: '请概括知识库中的主要内容。', icon: Search }]
      : [
          { title: '梳理一个想法', prompt: '帮我梳理这个想法：', icon: Lightbulb },
          { title: '解释一个概念', prompt: '请用简单的语言和例子解释：', icon: Search },
          { title: '润色一段文字', prompt: '帮我润色这段文字，让表达更清晰自然：', icon: PenLine },
        ]
    const Icon = knowledge ? BookOpen : Bot
    return (
      <div className="flex flex-1 flex-col justify-center px-1 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-lg">
          <span className="bg-primary/10 text-primary mb-5 flex size-12 items-center justify-center rounded-2xl">
            <Icon className="size-6" />
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            {knowledge ? '从知识中找到答案' : '有什么想聊的？'}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {knowledge
              ? '围绕已有文档提问，查找信息、归纳重点。'
              : '一个问题、一段文字，或一个还没成形的想法，都可以从这里开始。'}
          </p>
          {knowledge && (
            <div role="status" className="text-muted-foreground mt-4 text-xs leading-relaxed">
              {knowledgeLoading ? (
                '正在读取知识库…'
              ) : knowledgeError ? (
                <span>
                  知识库暂时无法读取。
                  <Button variant="link" size="sm" onClick={onRetryKnowledge}>
                    重试
                  </Button>
                </span>
              ) : documents?.length === 0 ? (
                '知识库暂时没有文档，可切换到通用 AI 提问。'
              ) : documents ? (
                `${documents.length} 篇文档${knowledgeUpdatedAt ? ` · ${knowledgeUpdatedAt}更新` : ''}`
              ) : (
                '基于知识库内容回答'
              )}
            </div>
          )}
          {onSuggestion &&
            !knowledgeLoading &&
            !knowledgeError &&
            (!knowledge || !!documents?.length) && (
              <div className="mt-6 space-y-2">
                <p className="text-muted-foreground mb-3 text-xs">
                  {knowledge ? '从这些内容开始' : '试试这样开始'}
                </p>
                {suggestions.map(item => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onSuggestion(item.prompt)}
                    className="bg-card hover:bg-accent/60 focus-visible:ring-ring flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <item.icon className="text-muted-foreground size-4 shrink-0" />
                    <span className="min-w-0 flex-1 break-words">{item.title}</span>
                    <ArrowUpRight className="text-muted-foreground size-4 shrink-0" />
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>
    )
  }
)
ChatEmptyState.displayName = 'ChatEmptyState'
