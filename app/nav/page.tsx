'use client'

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react'
import { Plus, Settings, Lock, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNavStore } from '@/app/nav/stores/navStore'
import { useThemeStore, getCurrentThemeColor } from '@/stores/themeStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'
import { useTranslation } from '@/hooks/useTranslation'
import { NavCard } from './components/NavCard'
import { NavCategory } from '@/app/nav/types'
import { PageContainer } from '@/components/layout'
import { cn } from '@/lib/helpers'

function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const { searchTerm } = useNavStore()
  const [localSearch, setLocalSearch] = useState(searchTerm)

  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearch(localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearch, searchTerm])

  return (
    <div className="relative flex-1">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="搜索导航..."
        value={localSearch}
        onChange={e => setLocalSearch(e.target.value)}
        className="bg-background h-9 pl-9"
        aria-label="搜索导航"
      />
    </div>
  )
}

function CategorySidebar({
  categories,
  selectedCategory,
  onSelect,
  themeColor,
}: {
  categories: NavCategory[]
  selectedCategory: number | 'all'
  onSelect: (id: number | 'all') => void
  themeColor: { color: string }
}) {
  const renderButton = (label: string, isActive: boolean, onClick: () => void, title?: string) => (
    <button
      type="button"
      title={title}
      className={cn(
        'w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
        isActive
          ? 'font-medium text-white shadow-sm'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
      style={isActive ? { background: themeColor.color } : undefined}
      onClick={onClick}
    >
      <span className="block truncate">{label}</span>
    </button>
  )

  return (
    <aside
      className="bg-muted/30 flex w-[5.75rem] shrink-0 flex-col gap-1 self-start rounded-xl p-1.5 sm:w-28"
      aria-label="导航分类"
    >
      {renderButton('全部', selectedCategory === 'all', () => onSelect('all'))}
      {categories.map(cat =>
        renderButton(cat.name, selectedCategory === cat.id, () => onSelect(cat.id), cat.name)
      )}
    </aside>
  )
}

function NavContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter[name]') ?? ''

  const {
    categories,
    items,
    loading: storeLoading,
    fetchCategories,
    fetchItems,
    applySampleData,
    searchTerm,
    handleSearch,
  } = useNavStore()

  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')

  const { currentTheme, customThemes } = useThemeStore()
  const themeColor = getCurrentThemeColor(currentTheme, customThemes)
  const { requireLogin, isAuthenticated } = useLoginTrigger()
  const { t } = useTranslation()

  const filteredItems = useMemo(() => {
    let result = items

    if (selectedCategory !== 'all') {
      result = result.filter(item => item.nav_category_id === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term)
      )
    }

    return result
  }, [items, selectedCategory, searchTerm])

  const initialLoadRef = useRef(false)
  const initialFilterRef = useRef(initialFilter)

  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    if (initialFilterRef.current) {
      handleSearch(initialFilterRef.current)
    }

    const fetchData = async () => {
      try {
        await fetchCategories(initialFilterRef.current)
        await fetchItems()
        const hasData = categories.length > 0 || items.length > 0
        if (!initialFilterRef.current && !hasData) {
          applySampleData()
        }
      } catch (error) {
        console.error('获取导航数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchCategories, fetchItems, applySampleData, categories.length, items.length, handleSearch])

  const handleCategoryClick = useCallback(
    async (catId: number | 'all') => {
      setSelectedCategory(catId)
      await fetchItems(catId === 'all' ? undefined : catId)
    },
    [fetchItems]
  )

  const onSearch = useCallback(
    (term: string) => {
      handleSearch(term)
      const newUrl = term ? `?filter[name]=${encodeURIComponent(term)}` : '/nav'
      router.push(newUrl, { scroll: false })
    },
    [handleSearch, router]
  )

  const handleAddNav = useCallback(() => {
    requireLogin(() => {
      router.push('/nav/add')
    })
  }, [requireLogin, router])

  const handleManageCategories = useCallback(() => {
    requireLogin(() => {
      router.push('/nav/categories')
    })
  }, [requireLogin, router])

  const isLoading = loading || storeLoading

  return (
    <PageContainer className="space-y-3 py-2">
      <div className="flex items-center gap-2">
        <SearchBar onSearch={onSearch} />
        <Button
          onClick={handleAddNav}
          size="icon"
          variant="default"
          className="relative h-9 w-9 shrink-0"
          disabled={!isAuthenticated}
          style={{
            backgroundColor: themeColor.color,
            color: '#fff',
            opacity: !isAuthenticated ? 0.6 : 1,
          }}
          aria-label={t('nav.add_nav', '添加导航')}
        >
          <Plus className="h-4 w-4" />
          {!isAuthenticated ? (
            <Lock className="absolute -top-1 -right-1 h-3 w-3 text-white" />
          ) : null}
        </Button>
        <Button
          onClick={handleManageCategories}
          size="icon"
          variant="outline"
          className="relative h-9 w-9 shrink-0"
          disabled={!isAuthenticated}
          style={{ opacity: !isAuthenticated ? 0.6 : 1 }}
          aria-label={t('nav.manage_categories', '管理分类')}
        >
          <Settings className="h-4 w-4" />
          {!isAuthenticated ? (
            <Lock className="text-muted-foreground absolute -top-1 -right-1 h-3 w-3" />
          ) : null}
        </Button>
      </div>

      <div className="flex gap-3">
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategoryClick}
          themeColor={themeColor}
        />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-16"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              <span className="text-muted-foreground ml-2 text-sm">加载中...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map(item => (
                <NavCard key={item.id} item={item} highlight={searchTerm} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <p className="text-muted-foreground text-sm font-medium">
                {searchTerm ? '没有找到匹配的导航' : '暂无导航站点'}
              </p>
              {!searchTerm && isAuthenticated ? (
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0"
                  onClick={handleAddNav}
                  style={{ color: themeColor.color }}
                >
                  添加第一个站点
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

export default function NavPage() {
  return (
    <Suspense fallback={null}>
      <NavContent />
    </Suspense>
  )
}
