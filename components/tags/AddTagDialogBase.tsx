'use client'

import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { mutate } from 'swr'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { post } from '@/lib/api'
import { generateRandomColor, isLightColor } from '@/lib/helpers/colorUtils'

interface AddTagDialogBaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
  endpoint: string
  mutateKey: string
}

export function AddTagDialogBase({
  open,
  onOpenChange,
  description,
  endpoint,
  mutateKey,
}: AddTagDialogBaseProps) {
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (open) {
      setTagColor(generateRandomColor())
    }
  }, [open])

  const refreshColor = () => {
    setTagColor(generateRandomColor())
  }

  const getTagStyle = (color: string = '#3b82f6') => ({
    backgroundColor: color,
    color: isLightColor(color) ? '#000' : '#fff',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = tagName.trim()
    if (!name) {
      toast.error('标签名称不能为空')
      return
    }

    setLoading(true)
    try {
      await post(endpoint, {
        name,
        color: tagColor,
      })

      toast.success('标签创建成功')
      setTagName('')
      setTagColor('#3b82f6')
      mutate(mutateKey)
      onOpenChange(false)
    } catch {
      // API 的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加新标签</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">标签名称</label>
              <Input
                id="tagName"
                placeholder="输入标签名称"
                value={tagName}
                onChange={e => setTagName(e.target.value)}
                autoFocus={!isMobile}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">标签颜色</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={tagColor}
                  onChange={e => setTagColor(e.target.value)}
                  className="h-10 w-12 p-1"
                />
                <Input
                  value={tagColor}
                  onChange={e => setTagColor(e.target.value)}
                  placeholder="#RRGGBB"
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshColor}
                  className="h-10 w-10"
                  title="生成随机颜色"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Badge style={getTagStyle(tagColor)} className="ml-2 h-6 px-2">
                  {tagName || '预览'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !tagName.trim()}>
              {loading ? '添加中...' : '添加标签'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
