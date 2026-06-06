'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle } from 'lucide-react'

const IMAGE_UPLOAD_HELP_TEXT =
  '支持JPG、PNG、GIF格式，每张图片不超过20MB，最多上传10 张。点击图片可设为主图。勾选「上传时自动去背景」后，会异步去背景；无需等待完成即可创建物品，去背景完成后会自动替换物品图片，原图会保留。'

interface ImageUploadHeaderProps {
  label?: string
  removeBgEnabled: boolean
  onRemoveBgChange: (enabled: boolean) => void
  removeBgDisabled?: boolean
}

export function ImageUploadHeader({
  label = '物品图片',
  removeBgEnabled,
  onRemoveBgChange,
  removeBgDisabled = false,
}: ImageUploadHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Label className="shrink-0">{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground relative z-10 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-0.5 transition-colors"
              aria-label="查看上传说明"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="max-w-xs text-xs" side="top" align="start">
            {IMAGE_UPLOAD_HELP_TEXT}
          </PopoverContent>
        </Popover>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Switch
          id="thing-remove-bg"
          checked={removeBgEnabled}
          onCheckedChange={onRemoveBgChange}
          disabled={removeBgDisabled}
        />
        <Label htmlFor="thing-remove-bg" className="text-sm font-normal whitespace-nowrap">
          上传时自动去背景
        </Label>
      </div>
    </div>
  )
}
