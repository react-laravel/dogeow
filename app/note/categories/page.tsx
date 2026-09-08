'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Pencil, Plus, FolderTree, Check, Trash2 } from 'lucide-react'
import { NoteSectionHeader } from '../components/NoteSectionHeader'
import { NoteSearchField } from '../components/NoteSearchField'
import { Input } from '@/components/ui/input'
import useSWR, { mutate } from 'swr'
import { get, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { EmptyState } from '@/components/ui/empty-state'
import CategorySpeedDial from './components/CategorySpeedDial'

// 分类类型定义
type Category = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export default function NoteCategories() {
  const [loading, setLoading] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [query, setQuery] = useState('')

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 加载分类数据
  const { data: categories, error } = useSWR<Category[]>('/notes/categories', get)

  // 打开删除确认弹窗
  const openDeleteDialog = (id: number) => {
    setCategoryToDelete(id)
    setAlertOpen(true)
  }

  // 删除分类
  const deleteCategory = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      await del(`/notes/categories/${categoryToDelete}`)
      mutate('/notes/categories')
      toast.success('分类删除成功')
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
      setAlertOpen(false)
      setCategoryToDelete(null)
    }
  }

  // 开始编辑分类
  const startEditing = (category: Category) => {
    setEditingCategory(category)
    setEditingName(category.name)
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingCategory(null)
    setEditingName('')
  }

  // 保存编辑
  const saveEditing = async () => {
    if (!editingCategory || !editingName.trim()) {
      toast.error('请输入分类名称')
      return
    }

    setLoading(true)
    try {
      await put(`/notes/categories/${editingCategory.id}`, {
        name: editingName.trim(),
      })
      mutate('/notes/categories')
      toast.success('分类更新成功')
      cancelEditing()
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
    }
  }

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const filteredCategories =
    categories?.filter(category =>
      category.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    ) ?? []
  return (
    <PageContainer className="min-w-0 py-3 sm:py-5">
      <NoteSectionHeader
        className="sticky top-0 z-20 bg-background pb-1"
        title="分类列表"
        description={`共 ${categories?.length ?? 0} 个分类`}
        action={
          <Button className="h-11 rounded-xl shadow-none" onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4" />
            添加分类
          </Button>
        }
      >
        <NoteSearchField value={query} onChange={setQuery} label="搜索分类" />
      </NoteSectionHeader>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          加载分类失败
        </p>
      )}
      {!categories && !error && (
        <p role="status" className="py-12 text-center text-sm text-muted-foreground">
          加载中...
        </p>
      )}
      {categories?.length === 0 && (
        <EmptyState
          icon={<FolderTree className="size-10" />}
          title="暂无分类"
          description="请添加您的第一个笔记分类"
        />
      )}
      {Boolean(categories?.length) && !filteredCategories.length && (
        <p className="py-12 text-center text-sm text-muted-foreground">没有找到相关分类</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map(category => (
          <div
            key={category.id}
            className="min-w-0 rounded-2xl border border-border/70 bg-card p-3"
          >
            {editingCategory?.id === category.id ? (
              <div className="space-y-3">
                <Input
                  aria-label="分类名称"
                  value={editingName}
                  onChange={event => setEditingName(event.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus={!isMobile}
                  className="h-11 min-w-0 rounded-xl"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="h-10 rounded-xl"
                    onClick={cancelEditing}
                    disabled={loading}
                  >
                    <X className="size-4" />
                    取消
                  </Button>
                  <Button
                    className="h-10 rounded-xl shadow-none"
                    onClick={saveEditing}
                    disabled={loading || !editingName.trim()}
                  >
                    <Check className="size-4" />
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FolderTree className="size-4" />
                </span>
                <span className="min-w-0 flex-1 break-words px-1 text-sm font-medium">
                  {category.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-xl"
                  aria-label={`编辑分类 ${category.name}`}
                  onClick={() => startEditing(category)}
                  disabled={loading}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                  aria-label={`删除分类 ${category.name}`}
                  onClick={() => openDeleteDialog(category.id)}
                  disabled={loading}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 自定义删除确认弹窗 */}
      <DeleteConfirmationDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={deleteCategory}
        itemName={
          categoryToDelete ? (categories?.find(c => c.id === categoryToDelete)?.name ?? '') : ''
        }
      />

      <CategorySpeedDial
        onCategoryAdded={() => mutate('/notes/categories')}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        hideFab
      />
    </PageContainer>
  )
}
