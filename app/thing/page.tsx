'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import useSWR from 'swr'
import { apiRequest } from '@/lib/api'

// Components
import ThingHeader from './components/ThingHeader'
import ThingContent from './components/ThingContent'
import { ItemDetailModal } from './components/ItemDetailModal'

// Hooks and stores
import { useItems, useCategories } from '@/app/thing/services/api'
import { useThingFilters } from '@/app/thing/hooks/useThingFilters'
import { useThingSearch } from '@/app/thing/hooks/useThingSearch'
import { useFormModal } from '@/hooks/useFormModal'
import { PageContainer } from '@/components/layout'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { preloadThingItemImages } from './utils/imagePreload'
import type { SizePreset } from './components/ImageSizeControl'
import type { ItemFilters } from '@/app/thing/contracts'

// Types
import { Tag, LocationTreeResponse, ViewMode } from '@/app/thing/types'

export default function Thing() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [imageSizePreset, setImageSizePreset] = useState<SizePreset>('md')
  const [, setFilterDrawerOpen] = useState(false)

  const {
    open: modalOpen,
    setOpen: setModalOpen,
    selectedId: selectedItemId,
    mode: modalMode,
    setMode: setModalMode,
    openModal,
  } = useFormModal<number>('view')

  const { filters, updateFilters, clearFilters, hasActiveFilters, currentPage, setCurrentPage } =
    useThingFilters()

  const { searchTerm, setSearchTerm, handleSearch, isSearching } = useThingSearch()

  const itemParams = useMemo<ItemFilters>(
    () => ({
      ...filters,
      page: currentPage,
      ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
    }),
    [filters, currentPage, searchTerm]
  )

  const {
    data: itemsData,
    error: itemsError,
    isLoading: itemsLoading,
    isValidating: itemsValidating,
    mutate: mutateItems,
  } = useItems(itemParams)

  const { data: categories = [] } = useCategories()

  const items = itemsData?.data ?? []
  const meta = itemsData?.meta ?? null
  const loading = itemsLoading || (itemsValidating && items.length === 0)
  const error = itemsError
    ? itemsError instanceof Error
      ? itemsError.message
      : '加载物品失败'
    : null

  const { data: tags } = useSWR<Tag[]>('/things/tags', apiRequest)
  const { data: locationData } = useSWR<LocationTreeResponse>('/locations/tree', apiRequest)

  // URL search bootstrap (once)
  useEffect(() => {
    const searchFromURL = new URLSearchParams(window.location.search).get('search')
    if (searchFromURL) {
      setSearchTerm(searchFromURL)
    }
  }, [setSearchTerm])

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
    },
    [setCurrentPage]
  )

  const handleApplyFilters = useCallback(
    (newFilters: Record<string, unknown>) => {
      if (isSearching) return
      setCurrentPage(1)
      updateFilters(newFilters)
    },
    [isSearching, setCurrentPage, updateFilters]
  )

  const handleReload = useCallback(() => {
    void mutateItems()
  }, [mutateItems])

  const handlePullToRefresh = useCallback(async () => {
    await mutateItems()
  }, [mutateItems])

  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    handleSearch('')
    clearFilters()
  }, [setSearchTerm, handleSearch, clearFilters])

  const handleItemEdit = useCallback(
    (id: number) => {
      openModal(id, 'edit')
    },
    [openModal]
  )

  const handleItemView = useCallback(
    (id: number) => {
      preloadThingItemImages(items.find(item => item.id === id))
      openModal(id, 'view')
    },
    [items, openModal]
  )

  const handleItemDeleted = useCallback(() => {
    void mutateItems()
  }, [mutateItems])

  return (
    <PageContainer>
      <PullToRefresh onRefresh={handlePullToRefresh}>
        <div className="flex flex-col space-y-4">
          <ThingHeader
            categories={categories}
            tags={tags ?? []}
            areas={locationData?.areas ?? []}
            rooms={locationData?.rooms ?? []}
            spots={locationData?.spots ?? []}
            filters={filters}
            hasActiveFilters={hasActiveFilters()}
            viewMode={viewMode}
            imageSizePreset={imageSizePreset}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            onViewModeChange={setViewMode}
            onImageSizePresetChange={setImageSizePreset}
            onFiltersOpenChange={setFilterDrawerOpen}
          />

          <ThingContent
            items={items}
            loading={loading}
            error={error}
            meta={meta}
            currentPage={currentPage}
            searchTerm={searchTerm}
            hasActiveFilters={hasActiveFilters()}
            viewMode={viewMode}
            imageSizePreset={imageSizePreset}
            onPageChange={handlePageChange}
            onItemEdit={handleItemEdit}
            onItemView={handleItemView}
            onReload={handleReload}
            onClearFilters={handleClearFilters}
          />
        </div>
      </PullToRefresh>

      <ItemDetailModal
        itemId={selectedItemId}
        initialItem={items.find(item => item.id === selectedItemId) ?? null}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode as 'view' | 'edit' | undefined}
        onModeChange={setModalMode}
        onItemDeleted={handleItemDeleted}
      />
    </PageContainer>
  )
}
