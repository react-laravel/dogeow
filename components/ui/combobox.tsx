'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react'

import { cn } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ComboboxOption {
  value: string
  label: string
  displayLabel?: string
  searchKeywords?: string[]
  indentLevel?: number
  id?: number | null
  parentId?: number | null
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onCreateOption?: (input: string) => void
  placeholder?: string
  emptyText?: string
  createText?: string
  searchText?: string
  className?: string
}

export function Combobox({
  options = [],
  value,
  onChange,
  onCreateOption,
  placeholder = '选择选项...',
  emptyText = '没有找到选项',
  createText = '创建',
  searchText = '搜索选项...',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showInput, setShowInput] = React.useState(false)

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options

    const normalizedQuery = searchQuery.toLowerCase()

    const getMatchScore = (option: ComboboxOption): number => {
      const label = option.label.toLowerCase()
      const displayLabel = option.displayLabel?.toLowerCase() ?? ''
      const keywords = (option.searchKeywords ?? []).map(keyword => keyword.toLowerCase())

      if (displayLabel === normalizedQuery || label === normalizedQuery) return 300
      if (displayLabel.startsWith(normalizedQuery) || label.startsWith(normalizedQuery)) return 220
      if (displayLabel.includes(normalizedQuery) || label.includes(normalizedQuery)) return 180
      if (keywords.some(keyword => keyword.startsWith(normalizedQuery))) return 120
      if (keywords.some(keyword => keyword.includes(normalizedQuery))) return 80

      return 0
    }

    return options
      .map((option, index) => ({
        option,
        index,
        score: getMatchScore(option),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // 保持分类等层级数据的父子显示顺序：父级始终在子级上方
        if (a.option.parentId != null && b.option.id != null && a.option.parentId === b.option.id) {
          return 1
        }
        if (b.option.parentId != null && a.option.id != null && b.option.parentId === a.option.id) {
          return -1
        }

        if (b.score !== a.score) return b.score - a.score
        return a.index - b.index
      })
      .map(item => item.option)
  }, [options, searchQuery])

  const handleCreateOption = React.useCallback(() => {
    if (onCreateOption && searchQuery && searchQuery.trim()) {
      console.log('正在创建选项:', searchQuery.trim())
      onCreateOption(searchQuery.trim())
      setSearchQuery('')
      setOpen(false)
    }
  }, [onCreateOption, searchQuery])

  const handleSelect = React.useCallback(
    (selectedOption: ComboboxOption) => {
      console.log('handleSelect called with:', selectedOption)
      onChange(selectedOption.value)
      setSearchQuery('')
      setOpen(false)
    },
    [onChange]
  )

  const handleSearchEnter = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return
      if (filteredOptions.length === 0) return

      event.preventDefault()

      const normalizedQuery = searchQuery.trim().toLowerCase()
      if (!normalizedQuery) {
        handleSelect(filteredOptions[0])
        return
      }

      const preferredOption =
        filteredOptions.find(option => {
          const label = option.label.toLowerCase()
          const displayLabel = option.displayLabel?.toLowerCase() ?? ''
          return label.includes(normalizedQuery) || displayLabel.includes(normalizedQuery)
        }) ?? filteredOptions[0]

      handleSelect(preferredOption)
    },
    [filteredOptions, handleSelect, searchQuery]
  )

  const activeCheckedValue = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return value
    }

    const directMatch = filteredOptions.find(option => {
      const label = option.label.toLowerCase()
      const displayLabel = option.displayLabel?.toLowerCase() ?? ''
      return label.includes(normalizedQuery) || displayLabel.includes(normalizedQuery)
    })

    return directMatch?.value ?? filteredOptions[0]?.value ?? value
  }, [filteredOptions, searchQuery, value])

  // 检查是否显示创建选项
  const showCreateOption =
    onCreateOption && searchQuery && searchQuery.trim().length > 0 && filteredOptions.length === 0

  // 获取当前选中项的显示文本
  const selectedOption = options.find(option => option.value === value)
  const displayText = selectedOption?.label || (value ? value : placeholder)

  // 处理弹出层开关
  const handleOpen = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      // 延迟显示输入框，避免自动聚焦
      setTimeout(() => setShowInput(true), 100)
    } else {
      setShowInput(false)
      setSearchQuery('')
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className={cn(selectedOption ? '' : 'text-muted-foreground')}>{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="fixed z-[9999] w-[280px] min-w-[--radix-popover-trigger-width] p-0"
        side="top"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
        collisionPadding={8}
      >
        <div className="flex flex-col">
          {/* 搜索输入框 */}
          {showInput && (
            <div className="border-b p-2">
              <div className="relative">
                <Input
                  placeholder={searchText}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchEnter}
                  className="h-8 pr-8"
                  autoComplete="off"
                  autoFocus={false} // 不自动focus，避免弹出键盘，用户需要搜索时可以手动点击输入框
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  inputMode="text"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="清空搜索"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* 选项列表 */}
          <ScrollArea>
            <div className="p-1">
              {/* 创建新选项 */}
              {showCreateOption && (
                <div
                  className="hover:bg-accent hover:text-accent-foreground text-primary mb-1 flex cursor-pointer items-center rounded-sm border-b px-2 py-1.5 text-base"
                  onClick={handleCreateOption}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>
                    {createText}: <strong>{searchQuery}</strong>
                  </span>
                </div>
              )}

              {/* 选项列表 */}
              {filteredOptions.length === 0 && !showCreateOption ? (
                <div className="text-muted-foreground px-2 py-2 text-center text-base">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-base',
                      option.indentLevel === 1 && 'pl-8',
                      option.disabled && 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() => {
                      if (!option.disabled) {
                        console.log('点击选项:', option)
                        handleSelect(option)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        activeCheckedValue === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.displayLabel ?? option.label}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
