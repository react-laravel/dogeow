'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Edit, Lock, LockOpen, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ItemFormData } from '@/app/thing/types'
import CategoryTreeSelect from '../../CategoryTreeSelect'
import AutoSaveStatus from '../AutoSaveStatus'
import { StatusIndicator } from './StatusIndicator'

interface ItemDetailModalHeaderProps {
  autoSaving: boolean
  canEdit: boolean
  displayCategoryName: string
  displayName: string
  formData: ItemFormData
  isInlineEditMode: boolean
  isPublicItem: boolean
  itemStatus: string
  lastSaved: Date | null
  onCategorySelect: (type: 'parent' | 'child', id: number | null) => void
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  onQuantityClick: () => void
  selectedCategory?: { type: 'parent' | 'child'; id: number }
  setFormData: Dispatch<SetStateAction<ItemFormData>>
}

export function ItemDetailModalHeader({
  autoSaving,
  canEdit,
  displayCategoryName,
  displayName,
  formData,
  isInlineEditMode,
  isPublicItem,
  itemStatus,
  lastSaved,
  onCategorySelect,
  onClose,
  onDelete,
  onEdit,
  onQuantityClick,
  selectedCategory,
  setFormData,
}: ItemDetailModalHeaderProps) {
  return (
    <div className="bg-background sticky top-0 z-10 flex flex-shrink-0 flex-col gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        {isInlineEditMode ? (
          <div className="max-w-full shrink-0">
            <CategoryTreeSelect
              onSelect={onCategorySelect}
              selectedCategory={selectedCategory}
              helperText={null}
              placeholder="选择分类"
              comboboxClassName="!w-auto max-w-[14rem] rounded-full px-3 text-sm"
            />
          </div>
        ) : (
          <Badge variant="outline" className="max-w-[60%] truncate px-3 py-1 text-sm">
            {displayCategoryName}
          </Badge>
        )}
        <div className="flex items-center gap-2">
          {isInlineEditMode ? (
            <AutoSaveStatus autoSaving={autoSaving} lastSaved={lastSaved} />
          ) : canEdit ? (
            <>
              <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <StatusIndicator status={itemStatus} />
          {isInlineEditMode ? (
            <>
              <Input
                value={formData.name}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                placeholder="请输入"
              />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 rounded-full px-3 text-xs font-medium"
                  onClick={onQuantityClick}
                >
                  x{formData.quantity || 1}
                </Button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  aria-label={isPublicItem ? '切换为私有物品' : '切换为公开物品'}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      is_public: !prev.is_public,
                    }))
                  }
                >
                  {isPublicItem ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{displayName}</h2>
              <span
                className="text-muted-foreground shrink-0"
                aria-label={isPublicItem ? '公开物品' : '私有物品'}
              >
                {isPublicItem ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
