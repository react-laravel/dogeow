import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X } from 'lucide-react'

interface EditableCategoryNameProps {
  name: string
  isEditing: boolean
  editingValue: string
  loading: boolean
  onValueChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  onEdit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  indent?: boolean
  bold?: boolean
  truncate?: boolean
}

export const EditableCategoryName = memo<EditableCategoryNameProps>(
  ({
    name,
    isEditing,
    editingValue,
    loading,
    onValueChange,
    onSave,
    onCancel,
    onEdit,
    onKeyDown,
    inputRef,
    indent = false,
    bold = true,
    truncate = false,
  }) => {
    const nameClassName = [
      'flex-1 transition-colors',
      bold ? 'font-semibold' : 'font-medium',
      isEditing
        ? 'text-foreground'
        : 'text-foreground hover:text-primary cursor-pointer hover:underline',
      indent ? 'ml-8' : '',
      truncate ? 'truncate' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <>
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              ref={inputRef}
              value={editingValue}
              onChange={e => onValueChange(e.target.value)}
              className="border-primary/50 focus:border-primary h-8"
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              disabled={loading}
              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={loading}
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className={nameClassName} onClick={isEditing ? undefined : onEdit}>
            {name}
          </div>
        )}
      </>
    )
  }
)

EditableCategoryName.displayName = 'EditableCategoryName'
