'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Circle, GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/helpers'
import type { TodoTask } from '../types'

interface TodoItemRowProps {
  task: TodoTask
  isCompleted: boolean
  onToggle: () => void
  onTitleBlur: () => void
  isEditing: boolean
  onStartEdit: () => void
  editTitle: string
  onEditTitleChange: (value: string) => void
  onDelete?: () => void
  isDeleting?: boolean
}

export function TodoItemRow({
  task,
  isCompleted,
  onToggle,
  onTitleBlur,
  isEditing,
  onStartEdit,
  editTitle,
  onEditTitleChange,
  onDelete,
  isDeleting = false,
}: TodoItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg py-2.5 pr-2 transition-colors',
        isDragging && 'opacity-60 shadow-lg'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="text-muted-foreground hover:text-foreground focus:ring-primary shrink-0 rounded-full p-0.5 outline-none focus:ring-2"
        aria-label={isCompleted ? '标记未完成' : '标记完成'}
      >
        {isCompleted ? (
          <Check className="text-primary h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" strokeWidth={2} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={event => onEditTitleChange(event.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={event => event.key === 'Enter' && onTitleBlur()}
            className="w-full bg-transparent py-0.5 text-sm focus:ring-0 focus:outline-none"
            autoFocus
            aria-label="编辑任务"
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className={cn(
              'w-full rounded py-0.5 text-left text-sm outline-none focus:ring-0',
              isCompleted && 'text-muted-foreground line-through'
            )}
          >
            {task.title || '未命名'}
          </button>
        )}
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive focus:ring-destructive/40 shrink-0 rounded p-1 outline-none hover:bg-destructive/10 focus:ring-2 disabled:opacity-50"
          aria-label={`删除任务 ${task.title || '未命名'}`}
          title="删除任务"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground -ml-1 cursor-grab touch-none rounded p-1 outline-none active:cursor-grabbing"
        aria-label="拖动排序"
        title="拖动排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  )
}
