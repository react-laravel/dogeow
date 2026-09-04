import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Check, FolderTree, List, ListTree, Search } from 'lucide-react'
import { Category } from '@/app/thing/types'
import { CategorySelection } from '../CategoryTreeSelect'

interface ThingHeaderCategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  selectedCategory: CategorySelection
  onCategorySelect: (type: 'parent' | 'child', id: number | null) => void
}

function ThingHeaderCategoryDrawer({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  onCategorySelect,
}: ThingHeaderCategoryDrawerProps) {
  const [showParentCategoriesOnly, setShowParentCategoriesOnly] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-primary/20 h-10 gap-1.5 rounded-lg bg-white/90 px-2.5 shadow dark:bg-background/80 ${
            selectedCategory ? 'text-primary border-primary/60 bg-primary/10' : ''
          }`}
          aria-label="打开分类筛选"
          title="分类"
        >
          <FolderTree className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium">分类</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex max-h-[calc(100dvh-var(--app-header-total-height,56px))] w-[calc(100vw-5rem)] max-w-[16rem] flex-col gap-0 overflow-hidden p-0 sm:w-[16rem]"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <SheetHeader className="border-border shrink-0 border-b px-4 py-3">
          <SheetTitle>分类</SheetTitle>
          <SheetDescription className="sr-only">选择物品分类筛选条件</SheetDescription>
        </SheetHeader>

        <div className="border-border flex shrink-0 items-center gap-2 border-b px-3 py-2">
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          <button
            type="button"
            className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm"
            onClick={() => onCategorySelect('parent', null)}
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
                      onClick={() => onCategorySelect('parent', parent.id)}
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
                              onClick={() => onCategorySelect('child', child.id)}
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
}

export default ThingHeaderCategoryDrawer
