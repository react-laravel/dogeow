import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { Folder, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { EditableCategoryName } from './EditableCategoryName'
import type { Category } from '../../types'

interface CategoryParentRowProps {
  category: Category & { children?: Category[] }
  isExpanded: boolean
  isEditMode: boolean
  isEditing: boolean
  editingValue: string
  loading: boolean
  onToggle: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onCreateChild: () => void
  onValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export const CategoryParentRow = memo<CategoryParentRowProps>(
  ({
    category,
    isExpanded,
    isEditMode,
    isEditing,
    editingValue,
    loading,
    onToggle,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onCreateChild,
    onValueChange,
    onKeyDown,
    inputRef,
  }) => {
    return (
      <TableRow className="bg-muted/60 hover:bg-muted/80 dark:bg-muted/25 dark:hover:bg-muted/40 transition-colors">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 cursor-pointer items-center justify-center"
                onClick={onToggle}
                role="button"
                tabIndex={0}
                aria-label={isExpanded ? '折叠分类' : '展开分类'}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggle()
                  }
                }}
              >
                {isExpanded ? (
                  <FolderOpen className="text-muted-foreground h-5 w-5" />
                ) : (
                  <Folder className="text-muted-foreground h-5 w-5" />
                )}
              </div>
              <EditableCategoryName
                name={category.name}
                isEditing={isEditing}
                editingValue={editingValue}
                loading={loading}
                onValueChange={onValueChange}
                onSave={onSave}
                onCancel={onCancel}
                onEdit={onEdit}
                onKeyDown={onKeyDown}
                inputRef={inputRef}
                bold={true}
                truncate={true}
              />
              {!isEditing && isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary hover:border-primary/20 h-7 shrink-0 border border-transparent transition-all duration-200"
                  onClick={onCreateChild}
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-xs">子分类</span>
                </Button>
              )}
            </div>
          </div>
        </TableCell>
        {isEditMode ? (
          <TableCell className="w-20 text-center">
            <div className="flex h-8 items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={loading}
                className="h-8 w-8"
                aria-label="删除"
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        ) : (
          <TableCell className="w-20 text-center">
            <div className="flex h-8 items-center justify-center">{category.items_count ?? 0}</div>
          </TableCell>
        )}
      </TableRow>
    )
  }
)

CategoryParentRow.displayName = 'CategoryParentRow'
