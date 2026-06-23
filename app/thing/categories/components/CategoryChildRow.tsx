import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { EditableCategoryName } from './EditableCategoryName'
import type { Category } from '../../types'

interface CategoryChildRowProps {
  category: Category
  isEditMode: boolean
  isEditing: boolean
  editingValue: string
  loading: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export const CategoryChildRow = memo<CategoryChildRowProps>(
  ({
    category,
    isEditMode,
    isEditing,
    editingValue,
    loading,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onValueChange,
    onKeyDown,
    inputRef,
  }) => {
    return (
      <TableRow className="hover:bg-accent/20 border-l-border/40 border-l-2 transition-colors">
        <TableCell>
          <div className="ml-8 flex items-center">
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
              indent={false}
              bold={false}
            />
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

CategoryChildRow.displayName = 'CategoryChildRow'
