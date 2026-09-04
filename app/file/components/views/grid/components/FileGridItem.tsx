import React, { memo } from 'react'
import { MoreVertical, Download, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { FileIcon } from '../utils/fileIcons'
import { formatDate } from '../utils/dateUtils'
import { formatFileSize } from '@/app/file/constants'
import type { CloudFile } from '@/app/file/types'

interface FileGridItemProps {
  file: CloudFile
  isSelected: boolean
  onSelect: (fileId: number, event: React.MouseEvent) => void
  onClick: (file: CloudFile) => void
  onDownload: (file: CloudFile) => void
  onEdit: (file: CloudFile, event: React.MouseEvent) => void
  onDelete: (file: CloudFile, event: React.MouseEvent) => void
  onDragStart?: (file: CloudFile, event: React.DragEvent) => void
}

export const FileGridItem = memo<FileGridItemProps>(
  ({ file, isSelected, onSelect, onClick, onDownload, onEdit, onDelete, onDragStart }) => {
    const handleDragStart = (event: React.DragEvent) => {
      if (onDragStart) {
        onDragStart(file, event)
      } else {
        event.dataTransfer.setData('text/plain', file.id.toString())
        event.dataTransfer.effectAllowed = 'move'
      }
    }

    return (
      <div
        className={cn(
          'relative flex cursor-pointer flex-col items-center rounded-lg border p-4 shadow-sm transition-colors',
          'bg-card hover:bg-accent/50 border-border',
          isSelected && 'ring-primary border-primary ring-2'
        )}
        draggable={!file.is_folder}
        onDragStart={handleDragStart}
      >
        <button
          type="button"
          className="focus-visible:ring-primary absolute inset-0 z-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          onClick={() => onClick(file)}
          aria-label={`${file.is_folder ? '打开文件夹' : '预览文件'}：${file.name}`}
        />
        <div className="pointer-events-none relative z-10">
          <FileIcon file={file} />
          <label
            className="pointer-events-auto absolute -top-3 -left-3 z-20 flex h-11 w-11 cursor-pointer items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="border-primary h-4 w-4 rounded-sm border"
              checked={isSelected}
              readOnly
              onClick={e => onSelect(file.id, e)}
              aria-label={`选择 ${file.name}`}
            />
          </label>
        </div>
        <div className="pointer-events-none relative z-10 mt-2 text-center">
          <p
            className="text-foreground max-w-[8rem] truncate text-sm font-medium"
            title={file.name}
          >
            {file.name}
          </p>
          {!file.is_folder && (
            <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">{formatDate(file.created_at)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 z-20 h-8 w-8"
              aria-label={`${file.name} 的更多操作`}
              title="更多操作"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!file.is_folder && (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onDownload(file)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                下载
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={e => onEdit(file, e)}>
              <Pencil className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={e => {
                e.stopPropagation()
                onDelete(file, e)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
)

FileGridItem.displayName = 'FileGridItem'
