'use client'

import { X, Trash2, BookOpen, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import type { OllamaModelListItem } from '@/lib/utils/ollama-models'

type SearchMethod = 'simple' | 'rag'

interface KnowledgeChatHeaderProps {
  variant?: 'page' | 'dialog'
  title?: string
  subtitle?: string
  hasMessages: boolean
  isLoading: boolean
  useContext: boolean
  onUseContextChange: (value: boolean) => void
  searchMethod: SearchMethod
  onSearchMethodChange: (value: SearchMethod) => void
  model?: string
  onModelChange?: (value: string) => void
  ollamaModels?: OllamaModelListItem[]
  isLoadingOllamaModels?: boolean
  provider?: 'ollama'
  onProviderChange?: (value: 'ollama') => void
  onClear: () => void
  onClose?: () => void
  hideUseContext?: boolean
  hideAiLink?: boolean
  hideSearchMethod?: boolean
  hideModel?: boolean
  hideProvider?: boolean
  hideTitle?: boolean
  hideClear?: boolean
}

export function KnowledgeChatHeader({
  variant = 'page',
  title = '知识库问答',
  subtitle,
  hasMessages,
  isLoading,
  useContext,
  onUseContextChange,
  searchMethod,
  onSearchMethodChange,
  model,
  onModelChange,
  ollamaModels = [],
  isLoadingOllamaModels = false,
  provider,
  onProviderChange,
  onClear,
  onClose,
  hideUseContext = false,
  hideAiLink = false,
  hideSearchMethod = false,
  hideModel = false,
  hideProvider = false,
  hideTitle = false,
  hideClear = false,
}: KnowledgeChatHeaderProps) {
  const hasOllamaModels = ollamaModels.length > 0
  const modelPlaceholder = isLoadingOllamaModels ? '读取中...' : '未发现模型'

  return (
    <header className="bg-background flex items-center justify-between px-4 py-3">
      {!hideTitle && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary h-5 w-5" />
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!hideProvider && provider && onProviderChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="provider" className="text-sm">
              AI:
            </Label>
            <Select value={provider} onValueChange={onProviderChange} disabled={isLoading}>
              <SelectTrigger id="provider" className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama (本地)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {variant === 'page' && !hideAiLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">普通问答</span>
            </Link>
          </Button>
        )}
        {!hideModel && onModelChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="model" className="text-sm">
              模型:
            </Label>
            <Select
              value={model || undefined}
              onValueChange={onModelChange}
              disabled={isLoading || (!isLoadingOllamaModels && !hasOllamaModels)}
            >
              <SelectTrigger id="model" className="h-8 w-36 text-xs">
                <SelectValue placeholder={modelPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {ollamaModels.map(item => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
                {!isLoadingOllamaModels && !hasOllamaModels && (
                  <div className="text-muted-foreground px-2 py-1 text-xs">
                    当前地址下未发现可用 Ollama 模型
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        {useContext && !hideSearchMethod && (
          <div className="flex items-center gap-2">
            <Label htmlFor="search-method" className="text-sm">
              搜索方法:
            </Label>
            <Select value={searchMethod} onValueChange={onSearchMethodChange} disabled={isLoading}>
              <SelectTrigger id="search-method" className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rag">RAG (向量)</SelectItem>
                <SelectItem value="simple">关键词匹配</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {!hideUseContext && (
          <div className="flex items-center gap-2">
            <Switch
              id="use-context"
              checked={useContext}
              onCheckedChange={onUseContextChange}
              disabled={isLoading}
            />
            <Label htmlFor="use-context" className="cursor-pointer text-sm">
              使用知识库
            </Label>
          </div>
        )}

        {hasMessages && !hideClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isLoading}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清除
          </Button>
        )}

        {variant === 'dialog' && onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
