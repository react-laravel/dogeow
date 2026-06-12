'use client'

import { AddTagDialogBase } from '@/components/tags/AddTagDialogBase'

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddTagDialog({ open, onOpenChange }: AddTagDialogProps) {
  return (
    <AddTagDialogBase
      open={open}
      onOpenChange={onOpenChange}
      description="创建一个新的标签，标签可用于分类和搜索笔记。"
      endpoint="/notes/tags"
      mutateKey="/notes/tags"
    />
  )
}
