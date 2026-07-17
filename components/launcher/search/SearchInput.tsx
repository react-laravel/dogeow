import React, { memo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

const SEARCH_SCOPE_LABELS: Record<string, string> = {
  book: '电子书',
  file: '文件',
  files: '文件',
  game: '游戏',
  nav: '导航',
  note: '笔记',
  thing: '物品',
  tool: '工具',
  word: '单词',
}

export function getSearchScopeLabel(currentApp?: string): string {
  const normalizedApp = currentApp?.trim().toLowerCase()

  if (!normalizedApp) return '内容'
  return SEARCH_SCOPE_LABELS[normalizedApp] ?? '当前页面'
}

interface SearchInputProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onClear: (e?: React.MouseEvent) => void
  onSubmit: (e: React.FormEvent) => void
  currentApp?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export const SearchInput = memo<SearchInputProps>(
  ({ searchTerm, onSearchChange, onClear, onSubmit, currentApp, inputRef }) => {
    const scopeLabel = getSearchScopeLabel(currentApp)

    return (
      <form onSubmit={onSubmit} className="flex w-full items-center">
        <Search className="text-primary absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={`搜索${scopeLabel}…`}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="搜索内容"
          className="border-primary/20 animate-in fade-in h-9 w-full pr-8 pl-8 duration-150"
        />

        {searchTerm && (
          <button
            type="button"
            className="hover:border-border hover:bg-muted absolute top-1/2 right-2 -translate-y-1/2 transform rounded-full border border-transparent p-1"
            data-clear-button="true"
            aria-label="清空搜索"
            title="清空搜索"
            onClick={onClear}
          >
            <X className="text-muted-foreground h-3 w-3" />
          </button>
        )}
      </form>
    )
  }
)

SearchInput.displayName = 'SearchInput'
