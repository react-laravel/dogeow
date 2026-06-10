'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useItem } from '../services/api'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { QuantityDialog } from './forms/components/QuantityDialog'
import type { Item } from '@/app/thing/types'
import { useAuth } from '@/hooks/useAuth'
import CreateTagDialog from './item-detail/CreateTagDialog'
import { useItemRmbgRefresh } from '../hooks/useItemRmbgRefresh'
import { useItemDetailEdit } from '../hooks/useItemDetailEdit'
import { useRemoveBgPreference } from '../hooks/useRemoveBgPreference'
import {
  DETAIL_MODAL_CONTENT_CLASS,
  DETAIL_MODAL_ERROR_CONTENT_CLASS,
} from './item-detail/constants'
import { ItemDetailEditContent } from './item-detail/components/ItemDetailEditContent'
import { ItemDetailModalHeader } from './item-detail/components/ItemDetailModalHeader'
import { ItemDetailModalLoading } from './item-detail/components/ItemDetailModalLoading'
import { ItemDetailViewContent } from './item-detail/components/ItemDetailViewContent'

interface ItemDetailModalProps {
  itemId: number | null
  initialItem?: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'view' | 'edit'
  onModeChange?: (mode: 'view' | 'edit') => void
  onItemDeleted?: () => void
}

export function ItemDetailModal({
  itemId,
  initialItem,
  open,
  onOpenChange,
  mode: externalMode,
  onModeChange,
  onItemDeleted,
}: ItemDetailModalProps) {
  const [internalMode, setInternalMode] = useState<'view' | 'edit'>('view')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const mode = externalMode ?? internalMode
  const setMode = onModeChange ?? setInternalMode

  const { data: item, error, isLoading: loading, mutate } = useItem(itemId ?? 0)
  useItemRmbgRefresh(item, () => mutate())

  const listItem = useMemo(
    () => (initialItem && initialItem.id === itemId ? initialItem : null),
    [initialItem, itemId]
  )
  const resolvedItem = item ?? listItem

  const { deleteItem } = useItemStore()
  const { user } = useAuth()
  const { removeBgEnabled, setRemoveBgEnabled } = useRemoveBgPreference()

  const edit = useItemDetailEdit({
    itemId,
    item: resolvedItem,
    mode,
    open,
  })

  const canEdit = useMemo(() => {
    return Boolean(user && resolvedItem && resolvedItem.user?.id === user.id)
  }, [user, resolvedItem])

  const trimmedDescription = resolvedItem?.description?.trim()
  const hasDescription =
    Boolean(trimmedDescription) &&
    trimmedDescription !== '无描述' &&
    trimmedDescription !== '暂无描述'

  const selectedCategory = useMemo(() => {
    if (!edit.formData.category_id) {
      return undefined
    }

    const category = edit.categories.find(
      currentCategory => currentCategory.id.toString() === edit.formData.category_id
    )
    if (!category) {
      return undefined
    }

    return {
      type: category.parent_id ? 'child' : 'parent',
      id: category.id,
    } as const
  }, [edit.categories, edit.formData.category_id])

  const getCurrentFormValue = useCallback(
    (field: string) => edit.formData[field as keyof typeof edit.formData],
    [edit.formData]
  )

  useEffect(() => {
    if (!open) {
      setMode('view')
      setActiveImageIndex(0)
      setDeleteDialogOpen(false)
    }
  }, [open, setMode])

  useEffect(() => {
    const length = resolvedItem?.images?.length ?? 0
    if (length === 0) {
      if (activeImageIndex !== 0) setActiveImageIndex(0)
      return
    }
    if (activeImageIndex > length - 1) setActiveImageIndex(0)
    if (activeImageIndex < 0) setActiveImageIndex(0)
  }, [resolvedItem?.images, activeImageIndex])

  const handleEdit = useCallback(() => {
    if (!itemId || !canEdit) return
    setMode('edit')
  }, [itemId, canEdit, setMode])

  const handleDelete = useCallback(async () => {
    try {
      if (!itemId) throw new Error('无效的物品编号')
      await deleteItem(itemId)
      toast.success('物品已成功删除')
      setDeleteDialogOpen(false)
      onOpenChange(false)
      onItemDeleted?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发生错误，请重试')
    }
  }, [deleteItem, itemId, onOpenChange, onItemDeleted])

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  if (!itemId) return null

  if (mode === 'edit' && (edit.editLoading || !resolvedItem || (loading && !listItem))) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="编辑物品"
        contentClassName={DETAIL_MODAL_CONTENT_CLASS}
      >
        <ItemDetailModalLoading />
      </Modal>
    )
  }

  if (loading && !resolvedItem) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="加载物品详情"
        contentClassName={DETAIL_MODAL_CONTENT_CLASS}
      >
        <ItemDetailModalLoading />
      </Modal>
    )
  }

  if ((error && !resolvedItem) || (!loading && !resolvedItem)) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="错误"
        contentClassName={DETAIL_MODAL_ERROR_CONTENT_CLASS}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-red-500">{error?.message ?? '物品不存在'}</p>
          <Button onClick={handleClose} variant="outline">
            关闭
          </Button>
        </div>
      </Modal>
    )
  }

  if (!resolvedItem) return null

  const displayCategoryName =
    mode === 'edit'
      ? (edit.categories.find(category => category.id.toString() === edit.formData.category_id)
          ?.name ?? '未分类')
      : (resolvedItem.category?.name ?? '未分类')
  const displayName = mode === 'edit' ? edit.formData.name || resolvedItem.name : resolvedItem.name
  const isInlineEditMode = mode === 'edit'
  const isPublicItem = isInlineEditMode ? edit.formData.is_public : resolvedItem.is_public

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={`物品详情${resolvedItem.name ? ` - ${resolvedItem.name}` : ''}`}
        contentClassName={DETAIL_MODAL_CONTENT_CLASS}
      >
        <ItemDetailModalHeader
          autoSaving={edit.autoSaving}
          canEdit={canEdit}
          displayCategoryName={displayCategoryName}
          displayName={displayName}
          formData={edit.formData}
          isInlineEditMode={isInlineEditMode}
          isPublicItem={isPublicItem}
          itemStatus={resolvedItem.status}
          lastSaved={edit.lastSaved}
          onCategorySelect={edit.handleCategorySelect}
          onClose={handleClose}
          onDelete={() => setDeleteDialogOpen(true)}
          onEdit={handleEdit}
          onQuantityClick={edit.handleQuantityClick}
          selectedCategory={selectedCategory}
          setFormData={edit.setFormData}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-24 sm:px-6 sm:pb-6">
          {isInlineEditMode ? (
            <ItemDetailEditContent
              getCurrentFormValue={getCurrentFormValue}
              hasDescription={hasDescription}
              item={resolvedItem}
              locationPath={edit.locationPath}
              onCreateTag={() => edit.setCreateTagDialogOpen(true)}
              onImagesChange={edit.setUploadedImages}
              onLocationSelect={edit.handleLocationSelect}
              onRemoveBgChange={setRemoveBgEnabled}
              onTagsChange={edit.setSelectedTags}
              removeBgEnabled={removeBgEnabled}
              selectedLocation={edit.selectedLocation}
              selectedTags={edit.selectedTags}
              tags={edit.tags}
              trimmedDescription={trimmedDescription}
              uploadedImages={edit.uploadedImages}
            />
          ) : (
            <ItemDetailViewContent
              activeImageIndex={activeImageIndex}
              hasDescription={hasDescription}
              item={resolvedItem}
              onImageIndexChange={setActiveImageIndex}
              trimmedDescription={trimmedDescription}
            />
          )}
        </div>
      </Modal>

      <CreateTagDialog
        open={edit.createTagDialogOpen}
        onOpenChange={edit.setCreateTagDialogOpen}
        onTagCreated={edit.handleTagCreated}
      />

      <QuantityDialog
        open={edit.quantityDialogOpen}
        onOpenChange={edit.setQuantityDialogOpen}
        quantity={edit.tempQuantity}
        onQuantityChange={edit.setTempQuantity}
        onConfirm={edit.handleQuantityConfirm}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={resolvedItem.name}
      />
    </>
  )
}
