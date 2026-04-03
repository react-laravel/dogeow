import React from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'

interface UploadProgressProps {
  fileName: string
  percent: number
  isUploading: boolean
  hasError: boolean
  onCancel: () => void
}

/**
 * Visual upload progress indicator
 * Shows file name, progress bar, and status
 */
export function UploadProgress({
  fileName,
  percent,
  isUploading,
  hasError,
  onCancel,
}: UploadProgressProps) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Uploading ${fileName}`}
    >
      {/* Header with file name and action */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Status icon */}
          {isUploading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          {!isUploading && !hasError && percent === 100 && (
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Upload complete" />
          )}
          {hasError && <AlertCircle className="h-4 w-4 text-red-600" aria-label="Upload failed" />}

          {/* File name */}
          <span className="truncate text-sm font-medium text-foreground">{fileName}</span>
        </div>

        {/* Percent */}
        <span className="ml-2 text-xs font-semibold text-muted-foreground">{percent}%</span>

        {/* Cancel button (only show while uploading) */}
        {isUploading && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-1"
            onClick={onCancel}
            aria-label="Cancel upload"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-300',
            hasError ? 'bg-red-600' : 'bg-primary'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Error message */}
      {hasError && (
        <p className="mt-2 text-xs text-red-600">Upload failed. Please try again.</p>
      )}
    </div>
  )
}

/**
 * Container for multiple upload progress indicators
 */
interface UploadProgressListProps {
  items: Array<{
    id: string
    fileName: string
    percent: number
    isUploading: boolean
    hasError: boolean
  }>
  onCancel: (id: string) => void
  className?: string
}

export function UploadProgressList({
  items,
  onCancel,
  className,
}: UploadProgressListProps) {
  if (items.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      {items.map(item => (
        <UploadProgress
          key={item.id}
          fileName={item.fileName}
          percent={item.percent}
          isUploading={item.isUploading}
          hasError={item.hasError}
          onCancel={() => onCancel(item.id)}
        />
      ))}
    </div>
  )
}
