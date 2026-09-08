'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Tag as TagIcon, Trash2 } from 'lucide-react'
import { NoteSectionHeader } from '../components/NoteSectionHeader'
import { NoteSearchField } from '../components/NoteSearchField'
import useSWR, { mutate } from 'swr'
import { get, del } from '@/lib/api'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import AddTagDialog from './components/AddTagDialog'

// 标签类型定义
type Tag = {
  id: number
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export default function NoteTags() {
  const [loading, setLoading] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [query, setQuery] = useState('')

  // 加载标签数据
  const { data: tags, error } = useSWR<Tag[]>('/notes/tags', get)

  // 打开删除确认弹窗
  const openDeleteDialog = (id: number) => {
    setTagToDelete(id)
    setAlertOpen(true)
  }

  // 删除标签
  const deleteTag = async () => {
    if (!tagToDelete) return

    setLoading(true)
    try {
      await del(`/notes/tags/${tagToDelete}`)
      mutate('/notes/tags')
      toast.success('标签删除成功')
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
      setAlertOpen(false)
      setTagToDelete(null)
    }
  }

  const filteredTags =
    tags?.filter(tag => tag.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ??
    []
  return (
    <PageContainer className="min-w-0 py-3 sm:py-5">
      <NoteSectionHeader
        className="sticky top-0 z-20 bg-background pb-1"
        title="标签列表"
        description={`共 ${tags?.length ?? 0} 个标签`}
        action={
          <Button className="h-11 rounded-xl shadow-none" onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4" />
            添加标签
          </Button>
        }
      >
        <NoteSearchField value={query} onChange={setQuery} label="搜索标签" />
      </NoteSectionHeader>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          加载标签失败
        </p>
      )}
      {!tags && !error && (
        <p role="status" className="py-12 text-center text-sm text-muted-foreground">
          加载中...
        </p>
      )}
      {tags?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <TagIcon className="size-10" />
          <p className="font-medium">暂无标签</p>
          <p className="text-sm">请添加您的第一个笔记标签</p>
        </div>
      )}
      {Boolean(tags?.length) && !filteredTags.length && (
        <p className="py-12 text-center text-sm text-muted-foreground">没有找到相关标签</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTags.map(tag => (
          <div
            key={tag.id}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card p-3"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: tag.color || 'var(--primary)' }}
              />
            </span>
            <span className="min-w-0 flex-1 break-words text-sm font-medium">{tag.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={() => openDeleteDialog(tag.id)}
              disabled={loading}
              aria-label={`删除标签 ${tag.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* 自定义删除确认弹窗 */}
      <DeleteConfirmationDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={deleteTag}
        itemName={tagToDelete ? (tags?.find(t => t.id === tagToDelete)?.name ?? '') : ''}
      />

      <AddTagDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </PageContainer>
  )
}
