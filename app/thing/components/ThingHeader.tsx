import { memo, useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
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
  LayoutList,
  Grid,
  Check,
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  GripIcon,
  RectangleHorizontalIcon,
} from 'lucide-react'
import { Category, Tag, Area, Room, Spot, ViewMode, FilterParams } from '@/app/thing/types'
import { CategorySelection } from './CategoryTreeSelect'
import type { SizePreset } from './ImageSizeControl'
import ThingHeaderCategoryDrawer from './header/ThingHeaderCategoryDrawer'
import ThingHeaderTagDrawer from './header/ThingHeaderTagDrawer'
import ThingHeaderFilterDrawer from './header/ThingHeaderFilterDrawer'

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

  const handleClearTags = useCallback(() => {
    setSelectedTags([])
    onApplyFilters({ ...filters, tags: undefined, page: 1 })
  }, [filters, onApplyFilters])

  const imageSizePresets = [
    { id: 'xs', label: '极小', icon: <GripIcon className="h-4 w-4" /> },
    { id: 'sm', label: '小', icon: <Columns4Icon className="h-4 w-4" /> },
    { id: 'md', label: '中', icon: <Columns3Icon className="h-4 w-4" /> },
    { id: 'lg', label: '大', icon: <Columns2Icon className="h-4 w-4" /> },
    { id: 'xl', label: '特大', icon: <RectangleHorizontalIcon className="h-4 w-4" /> },
  ] as const

  return (
    <div className="mb-4 flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <ThingHeaderCategoryDrawer
          open={categoryDrawerOpen}
          onOpenChange={setCategoryDrawerOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
        <ThingHeaderTagDrawer
          open={tagDrawerOpen}
          onOpenChange={setTagDrawerOpen}
          tags={tags}
          selectedTags={selectedTags}
          onTagClick={handleTagClick}
          onClearTags={handleClearTags}
        />
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={value => onViewModeChange(value as ViewMode)}>
            <TabsList className="bg-primary/10 dark:bg-primary/20 flex">
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
              >
                <LayoutList className="h-4 w-4" />
                <span>列表</span>
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
              >
                <Grid className="h-4 w-4" />
                <span>图片</span>
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
                          title={`图片大小：${preset.label}`}
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
      </div>
      <ThingHeaderFilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        hasActiveFilters={hasActiveFilters}
        categories={categories}
        tags={tags}
        areas={areas}
        rooms={rooms}
        spots={spots}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    </div>
  )
}

export default memo(ThingHeader)
