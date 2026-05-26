'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/helpers'
import { initialFilters, type FilterState } from './filters/types'
import { applyFilters, hasActiveFilters, getInitialFilterState } from './filters/utils/filterUtils'
import { BasicFiltersTabContent } from './filters/components/BasicFiltersTabContent'
import { DetailedFiltersTab } from './filters/components/DetailedFiltersTab'
import { FilterActions } from './filters/components/FilterActions'
import type { CategorySelection } from './CategoryTreeSelect'
import type { Area, Room, Spot } from '@/app/thing/types'
import { Tag } from '@/components/ui/tag-selector'

interface ItemFiltersProps {
  onApply: (filters: FilterState) => void
  onReset?: () => void
  categories: unknown[] // As per current useSWR<any[]>
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  tags: Tag[]
}

export default function ItemFilters({
  onApply,
  onReset,
  areas = [],
  rooms = [],
  spots = [],
  tags = [],
}: ItemFiltersProps) {
  const { categories } = useItemStore()
  const { savedFilters } = useFilterPersistenceStore()
  const [activeTab, setActiveTab] = useState<'basic' | 'detailed'>('basic')

  // 从保存的筛选条件初始化
  const getInitialState = useCallback(() => {
    return getInitialFilterState(savedFilters)
  }, [savedFilters])

  const [filters, setFilters] = useState<FilterState>(getInitialState())
  const onApplyRef = useRef(onApply)

  useEffect(() => {
    onApplyRef.current = onApply
  }, [onApply])

  // 使用防抖后的筛选条件
  const debouncedFilters = useDebounce(filters, 500)

  // 添加一个标志位，用于跟踪是否是首次渲染
  const isInitialRenderRef = useRef(true)
  const skipNextDebouncedApplyRef = useRef(false)

  // 提取应用筛选逻辑为单独函数
  const handleApplyFilters = useCallback((currentFilters: FilterState) => {
    applyFilters(currentFilters, onApplyRef.current)
  }, [])

  // 在筛选条件防抖后触发应用，但跳过初始渲染和已即时应用的变更
  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false
      return
    }

    if (skipNextDebouncedApplyRef.current) {
      skipNextDebouncedApplyRef.current = false
      return
    }

    handleApplyFilters(debouncedFilters)
  }, [debouncedFilters, handleApplyFilters])

  // 处理字段变更的函数
  const handleChange = useCallback((field: keyof FilterState, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // 处理标签选择 - 标签选择保持即时应用
  const handleTagsChange = useCallback(
    (selectedTags: string[]) => {
      const updated = {
        ...filters,
        tags: selectedTags.join(','),
      }

      skipNextDebouncedApplyRef.current = true
      setFilters(updated)
      handleApplyFilters(updated)
    },
    [filters, handleApplyFilters]
  )

  // 分类选择状态
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(undefined)

  // 分类筛选变化时，更新 filters 并立即应用
  const handleCategorySelect = useCallback(
    (type: 'parent' | 'child', id: number | null) => {
      setSelectedCategory(id === null ? undefined : { type, id })
      const updated = {
        ...filters,
        category_id: id === null ? 'all' : id.toString(),
      }

      skipNextDebouncedApplyRef.current = true
      setFilters(updated)
      handleApplyFilters(updated)
    },
    [filters, handleApplyFilters]
  )

  // 初始化分类选择状态
  useEffect(() => {
    startTransition(() => {
      if (filters.category_id && filters.category_id !== 'all') {
        const idNum = Number(filters.category_id)
        const category = categories.find(cat => cat.id === idNum)
        if (category) {
          setSelectedCategory({ type: category.parent_id ? 'child' : 'parent', id: idNum })
        }
      } else {
        setSelectedCategory(undefined)
      }
    })
  }, [filters.category_id, categories])

  // 快速清除所有筛选条件
  const handleClearAll = useCallback(() => {
    skipNextDebouncedApplyRef.current = true
    setSelectedCategory(undefined)
    setActiveTab('basic')
    setFilters({ ...initialFilters })

    if (onReset) {
      onReset()
      return
    }

    handleApplyFilters(initialFilters)
  }, [handleApplyFilters, onReset])

  return (
    <div className="text-foreground flex h-full min-h-0 flex-col px-1">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4 pb-6">
          <div className="w-full">
            <div
              role="tablist"
              aria-label="筛选类型"
              className="bg-muted border-border mb-4 grid w-full grid-cols-2 rounded-lg border p-[3px]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'basic'}
                className={cn(
                  'text-foreground inline-flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
                  activeTab === 'basic' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
                onClick={() => setActiveTab('basic')}
              >
                基础
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'detailed'}
                className={cn(
                  'text-foreground inline-flex h-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
                  activeTab === 'detailed'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                onClick={() => setActiveTab('detailed')}
              >
                详细
              </button>
            </div>

            {activeTab === 'basic' ? (
              <div role="tabpanel" className="space-y-6">
                <BasicFiltersTabContent
                  filters={filters}
                  selectedCategory={selectedCategory}
                  categories={categories}
                  tags={tags}
                  onNameChange={value => handleChange('name', value)}
                  onDescriptionChange={value => handleChange('description', value)}
                  onStatusChange={value => handleChange('status', value)}
                  onIsPublicChange={value => handleChange('is_public', value)}
                  onTagsChange={handleTagsChange}
                  onCategorySelect={handleCategorySelect}
                />
              </div>
            ) : (
              <div role="tabpanel" className="space-y-6">
                <DetailedFiltersTab
                  filters={filters}
                  areas={areas}
                  rooms={rooms}
                  spots={spots}
                  onPurchaseDateFromChange={date =>
                    handleChange('purchase_date_from', date || null)
                  }
                  onPurchaseDateToChange={date => handleChange('purchase_date_to', date || null)}
                  onIncludeNullPurchaseDateChange={checked =>
                    handleChange('include_null_purchase_date', checked)
                  }
                  onExpiryDateFromChange={date => handleChange('expiry_date_from', date || null)}
                  onExpiryDateToChange={date => handleChange('expiry_date_to', date || null)}
                  onIncludeNullExpiryDateChange={checked =>
                    handleChange('include_null_expiry_date', checked)
                  }
                  onPriceFromChange={value => handleChange('price_from', value)}
                  onPriceToChange={value => handleChange('price_to', value)}
                  onAreaIdChange={value => handleChange('area_id', value)}
                  onRoomIdChange={value => handleChange('room_id', value)}
                  onSpotIdChange={value => handleChange('spot_id', value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <FilterActions hasActiveFilters={hasActiveFilters(filters)} onClearAll={handleClearAll} />
    </div>
  )
}
