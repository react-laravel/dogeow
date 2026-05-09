'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/helpers'
import { toast } from 'sonner'

interface AddThemeDialogProps {
  onAddTheme: (name: string, color: string) => void
}

export function AddThemeDialog({ onAddTheme }: AddThemeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [themeName, setThemeName] = useState('')
  const [themeColor, setThemeColor] = useState('#3b82f6')

  const handleAddTheme = () => {
    if (!themeName.trim()) {
      toast.error('Please enter theme name')
      return
    }

    onAddTheme(themeName, themeColor)
    setIsOpen(false)
    setThemeName('')
    setThemeColor('#3b82f6')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="添加主题"
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/10 px-3 py-3 text-left transition-colors',
            'hover:bg-primary/20 hover:opacity-90'
          )}
          title="添加主题"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5">
            <Plus className="text-primary/70 h-5 w-5" />
          </span>
          <span className="text-sm font-medium">添加主题</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[80%]">
        <DialogHeader>
          <DialogTitle>添加主题</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="theme-name" className="w-1/4 text-right">
              名称
            </Label>
            <Input
              id="theme-name"
              value={themeName}
              onChange={e => setThemeName(e.target.value)}
              className="w-3/4"
              placeholder="例如：我的主题"
            />
          </div>

          <div className="flex items-center gap-4">
            <Label htmlFor="theme-color" className="w-1/4 text-right">
              颜色
            </Label>
            <div className="w-3/4">
              <Input
                id="theme-color"
                type="color"
                value={themeColor}
                onChange={e => setThemeColor(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAddTheme}>添加</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
