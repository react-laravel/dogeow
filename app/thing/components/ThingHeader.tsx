import { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDownIcon,
  SlidersHorizontal,
  LayoutList,
  Grid,
  X,
  Check,
  FolderTree,
  TagIcon,
  Search,
  ListTree,
  List,
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  GripIcon,
  RectangleHorizontalIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import ItemFilters from './ItemFilters'
import { Category, Tag, Area, Room, Spot, ViewMode, FilterParams } from '@/app/thing/types'
import { isLightColor } from '@/lib/helpers'
import { CategorySelection } from './CategoryTreeSelect'
import type { SizePreset } from './ImageSizeControl'

interface ThingHeaderProps {
  categories: Category[]
  tags: Tag[]
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  filters: FilterParams
  hasActiveFilters: boolean
  viewMode: ViewMode
  imageSizePreset?: SizePreset
  onApplyFilters: (filters: Record<string, unknown>) => void
  onClearFilters?: () => void
  onViewModeChange: (viewMode: ViewMode) => void
  onImageSizePresetChange?: (preset: SizePreset) => void
  onFiltersOpenChange?: (open: boolean) => void
}

function ThingHeader({
  categories,
  tags,
  areas,
  rooms,
  spots,
  filters,
  hasActiveFilters,
  viewMode,
  imageSizePreset = 'md',
  onApplyFilters,
  onClearFilters,
  onViewModeChange,
  onImageSizePresetChange,
  onFiltersOpenChange,
}: ThingHeaderProps) {
  // 从 filters 派生分类选择状态
  const derivedCategory = useMemo(() => {
    if (filters.category_id && filters.category_id !== 'all') {
      const idNum = Number(filters.category_id)
      const category = categories.find(cat => cat.id === idNum)
      if (category) {
        return { type: category.parent_id ? 'child' : 'parent', id: idNum } as CategorySelection
      }
    }
    return undefined
  }, [filters.category_id, categories])

  // 从 filters 派生标签选择状态
  const derivedTags = useMemo(() => {
    if (filters.tags) {
      return Array.isArray(filters.tags)
        ? filters.tags.map(t => String(t))
        : String(filters.tags)
            .split(',')
            .filter(tag => tag.trim() !== '')
    }
    return [] as string[]
  }, [filters.tags])

  // 分类选择状态 - 使用派生值初始化
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(derivedCategory)
  const [selectedTags, setSelectedTags] = useState<string[]>(derivedTags)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [tagDrawerOpen, setTagDrawerOpen] = useState(false)
  const [showParentCategoriesOnly, setShowParentCategoriesOnly] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  // 当派生值变化时更新状态
  useEffect(() => {
    setSelectedCategory(derivedCategory)
  }, [derivedCategory])

  useEffect(() => {
    setSelectedTags(derivedTags)
  }, [derivedTags])

  useEffect(() => {
    onFiltersOpenChange?.(filtersOpen)
  }, [filtersOpen, onFiltersOpenChange])

  useEffect(() => {
    if (!filtersOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (filterPanelRef.current?.contains(target) || filterButtonRef.current?.contains(target)) {
        return
      }

      setFiltersOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [filtersOpen])

  // 分类筛选变化时，更新 filters 并立即应用
  const handleCategorySelect = useCallback(
    (type: 'parent' | 'child', id: number | null) => {
      if (id === null) {
        // 未分类
        setSelectedCategory(undefined)
        onApplyFilters({
          ...filters,
          category_id: undefined,
          page: 1,
        })
      } else {
        setSelectedCategory({ type, id })
        onApplyFilters({
          ...filters,
          category_id: id,
          page: 1,
        })
      }
    },
    [filters, onApplyFilters]
  )

  // 处理标签点击
  const handleTagClick = useCallback(
    (tagId: string) => {
      const updatedTags = selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId]

      setSelectedTags(updatedTags)
      onApplyFilters({
        ...filters,
        tags: updatedTags.length > 0 ? updatedTags.join(',') : undefined,
        page: 1,
      })
    },
    [selectedTags, filters, onApplyFilters]
  )

  // 获取标签样式
  const getTagStyle = useCallback((color: string = '#3b82f6', isSelected: boolean = false) => {
    return {
      backgroundColor: isSelected ? color : 'transparent',
      color: isSelected ? (isLightColor(color) ? '#000' : '#fff') : color,
      borderColor: color,
    }
  }, [])

  const categoryTree = useMemo(() => {
    const parentCategories = categories.filter(category => !category.parent_id)
    const childCategories = categories.filter(category => category.parent_id)

    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent_id === parent.id),
    }))
  }, [categories])

  const filteredCategoryTree = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase()
    if (!keyword) return categoryTree

    return categoryTree
      .map(parent => {
        const parentMatches = parent.name.toLowerCase().includes(keyword)
        const children = parent.children.filter(child => child.name.toLowerCase().includes(keyword))

        if (showParentCategoriesOnly) {
          return parentMatches ? { ...parent, children: [] } : null
        }

        if (parentMatches) return parent
        if (children.length > 0) return { ...parent, children }
        return null
      })
      .filter((category): category is (typeof categoryTree)[number] => category !== null)
  }, [categorySearch, categoryTree, showParentCategoriesOnly])

  const imageSizePresets = [
    { id: 'xs', label: 'XS', icon: <GripIcon className="h-4 w-4" /> },
    { id: 'sm', label: 'S', icon: <Columns4Icon className="h-4 w-4" /> },
    { id: 'md', label: 'M', icon: <Columns3Icon className="h-4 w-4" /> },
    { id: 'lg', label: 'L', icon: <Columns2Icon className="h-4 w-4" /> },
    { id: 'xl', label: 'XL', icon: <RectangleHorizontalIcon className="h-4 w-4" /> },
  ] as const

  // 渲染分类抽屉
  const renderCategoryDrawer = () => (
    <Sheet open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`border-primary/20 h-10 w-10 rounded-lg bg-white/90 shadow dark:bg-background/80 ${
            selectedCategory ? 'text-primary border-primary/60 bg-primary/10' : ''
          }`}
          aria-label="打开分类筛选"
          title="分类"
        >
          <FolderTree className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[calc(100vw-6rem)] max-w-[12rem] gap-0 p-0 sm:w-[12rem]"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <SheetHeader className="border-border border-b px-4 py-3">
          <SheetTitle>分类</SheetTitle>
          <SheetDescription className="sr-only">选择物品分类筛选条件</SheetDescription>
        </SheetHeader>

        <div className="border-border flex items-center gap-2 border-b px-3 py-2">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={categorySearch}
              onChange={event => setCategorySearch(event.target.value)}
              placeholder="搜索分类"
              className="h-9 pl-8 text-sm"
              aria-label="搜索分类"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`h-9 w-9 shrink-0 ${showParentCategoriesOnly ? 'text-primary border-primary/60 bg-primary/10' : ''}`}
            onClick={() => setShowParentCategoriesOnly(value => !value)}
            aria-label={showParentCategoriesOnly ? '显示完整分类' : '只显示主分类'}
            title={showParentCategoriesOnly ? '显示完整分类' : '只显示主分类'}
          >
            {showParentCategoriesOnly ? (
              <ListTree className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <button
            type="button"
            className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm"
            onClick={() => handleCategorySelect('parent', null)}
          >
            <span>全部分类</span>
            {!selectedCategory ? <Check className="text-primary h-4 w-4" /> : null}
          </button>

          {filteredCategoryTree.length === 0 ? (
            <div className="text-muted-foreground px-3 py-8 text-center text-sm">暂无分类</div>
          ) : (
            <div className="space-y-1">
              {filteredCategoryTree.map(parent => {
                const parentSelected =
                  selectedCategory?.type === 'parent' && selectedCategory.id === parent.id

                return (
                  <div key={parent.id}>
                    <button
                      type="button"
                      className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium"
                      onClick={() => handleCategorySelect('parent', parent.id)}
                    >
                      <span className="min-w-0 truncate">{parent.name}</span>
                      {parentSelected ? <Check className="text-primary h-4 w-4" /> : null}
                    </button>

                    {!showParentCategoriesOnly && parent.children.length > 0 ? (
                      <div className="ml-3 border-l pl-2">
                        {parent.children.map(child => {
                          const childSelected =
                            selectedCategory?.type === 'child' && selectedCategory.id === child.id

                          return (
                            <button
                              key={child.id}
                              type="button"
                              className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                              onClick={() => handleCategorySelect('child', child.id)}
                            >
                              <span className="min-w-0 truncate">{child.name}</span>
                              {childSelected ? <Check className="text-primary h-4 w-4" /> : null}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  // 渲染标签抽屉
  const renderTagDrawer = () => (
    <Sheet open={tagDrawerOpen} onOpenChange={setTagDrawerOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`border-primary/20 h-10 w-10 rounded-lg bg-white/90 shadow dark:bg-background/80 ${
            selectedTags.length > 0 ? 'text-primary border-primary/60 bg-primary/10' : ''
          }`}
          aria-label="打开标签筛选"
          title="标签"
        >
          <TagIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[calc(100vw-6rem)] max-w-[12rem] gap-0 p-0 sm:w-[12rem]"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <SheetHeader className="border-border border-b px-4 py-3">
          <SheetTitle>标签</SheetTitle>
          <SheetDescription className="sr-only">选择物品标签筛选条件</SheetDescription>
        </SheetHeader>

        {selectedTags.length > 0 ? (
          <div className="border-border border-b px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full"
              onClick={() => {
                setSelectedTags([])
                onApplyFilters({ ...filters, tags: undefined, page: 1 })
              }}
            >
              清除所有标签
            </Button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {tags.length === 0 ? (
            <div className="text-muted-foreground px-3 py-8 text-center text-sm">暂无标签</div>
          ) : (
            <div className="space-y-1">
              {tags.map(tag => {
                const tagId = tag.id.toString()
                const isSelected = selectedTags.includes(tagId)

                return (
                  <button
                    key={tagId}
                    type="button"
                    className="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm"
                    onClick={() => handleTagClick(tagId)}
                  >
                    <Badge
                      style={getTagStyle(tag.color, isSelected)}
                      variant={isSelected ? 'default' : 'outline'}
                      className="min-w-0 max-w-full px-2 py-0.5 text-xs"
                    >
                      <span className="truncate">{tag.name}</span>
                    </Badge>
                    {isSelected ? <Check className="text-primary h-4 w-4 shrink-0" /> : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  // 渲染视图切换
  const renderViewControls = () => (
    <div className="flex items-center gap-2">
      <Tabs value={viewMode} onValueChange={value => onViewModeChange(value as ViewMode)}>
        <TabsList className="bg-primary/10 dark:bg-primary/20 flex">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
          >
            <LayoutList className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
          >
            <Grid className="h-4 w-4" />
          </TabsTrigger>
          {viewMode === 'gallery' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-[calc(100%-1px)] w-7 rounded-md px-0"
                  aria-label="选择图片大小"
                  title="选择图片大小"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[7rem]">
                <DropdownMenuRadioGroup
                  value={imageSizePreset}
                  onValueChange={value => onImageSizePresetChange?.(value as SizePreset)}
                >
                  {imageSizePresets.map(preset => (
                    <DropdownMenuRadioItem
                      key={preset.id}
                      value={preset.id}
                      className="justify-between"
                      title={`Set image size to ${preset.label}`}
                    >
                      <span className="flex items-center gap-2">
                        {preset.icon}
                        {preset.label}
                      </span>
                      {imageSizePreset === preset.id ? (
                        <Check className="text-primary h-4 w-4" />
                      ) : null}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </TabsList>
      </Tabs>
    </div>
  )

  const filterPanelTop = 'var(--app-header-height, 50px)'
  const filterPanelHeight = 'calc(100dvh - var(--app-header-height, 50px))'

  const filterDrawerPortal =
    filtersOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              data-slot="sheet-overlay"
              className="fixed inset-x-0 bottom-0 z-[135] bg-black/80"
              style={{ top: filterPanelTop }}
              aria-hidden="true"
              onClick={() => setFiltersOpen(false)}
            />

            <div
              ref={filterPanelRef}
              data-slot="sheet-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="thing-filter-title"
              className="bg-background text-foreground border-border fixed right-0 z-[140] flex w-[min(13.5rem,calc(100vw-5rem))] max-w-[13.5rem] flex-col overflow-hidden border-l p-3 shadow-xl"
              style={{
                top: filterPanelTop,
                height: filterPanelHeight,
                maxHeight: filterPanelHeight,
              }}
            >
              <div className="mb-2 flex shrink-0 items-center justify-between">
                <h2 id="thing-filter-title" className="text-foreground text-sm font-semibold">
                  筛选
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="关闭筛选"
                  onClick={() => setFiltersOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <ItemFilters
                  onApply={onApplyFilters}
                  onReset={onClearFilters}
                  categories={categories}
                  tags={tags}
                  areas={areas}
                  rooms={rooms}
                  spots={spots}
                />
              </div>
            </div>
          </>,
          document.body
        )
      : null

  const renderFilterSidebar = () => (
    <>
      <Button
        ref={filterButtonRef}
        variant="outline"
        size="sm"
        className="mr-1"
        aria-label="打开筛选"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen(true)}
      >
        <SlidersHorizontal className={`mr-2 h-4 w-4 ${hasActiveFilters ? 'text-primary' : ''}`} />
      </Button>
      {filterDrawerPortal}
    </>
  )

  return (
    <div className="mb-4 flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {renderCategoryDrawer()}
        {renderTagDrawer()}
        {renderViewControls()}
      </div>
      {renderFilterSidebar()}
    </div>
  )
}

export default memo(ThingHeader)
