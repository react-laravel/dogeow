import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, X } from 'lucide-react'
import ItemFilters from '../ItemFilters'
import { Category, Tag, Area, Room, Spot } from '@/app/thing/types'

interface ThingHeaderFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasActiveFilters: boolean
  categories: Category[]
  tags: Tag[]
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  onApplyFilters: (filters: Record<string, unknown>) => void
  onClearFilters?: () => void
}

function ThingHeaderFilterDrawer({
  open,
  onOpenChange,
  hasActiveFilters,
  categories,
  tags,
  areas,
  rooms,
  spots,
  onApplyFilters,
  onClearFilters,
}: ThingHeaderFilterDrawerProps) {
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (filterPanelRef.current?.contains(target) || filterButtonRef.current?.contains(target)) {
        return
      }

      onOpenChange(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open, onOpenChange])

  const filterPanelTop = 'var(--app-header-height, 50px)'
  const filterPanelHeight = 'calc(100dvh - var(--app-header-height, 50px))'

  const filterDrawerPortal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              data-slot="sheet-overlay"
              className="fixed inset-x-0 bottom-0 z-[135] bg-black/20"
              style={{ top: filterPanelTop }}
              aria-hidden="true"
              onClick={() => onOpenChange(false)}
            />

            <div
              ref={filterPanelRef}
              data-slot="sheet-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="thing-filter-title"
              className="bg-background text-foreground border-border fixed right-0 z-[140] flex w-[min(13.5rem,calc(100vw-5rem))] max-w-[13.5rem] flex-col overflow-hidden border-l p-3 shadow-xl max-md:[&_input]:text-base max-md:[&_select]:text-base max-md:[&_textarea]:text-base"
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
                  onClick={() => onOpenChange(false)}
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

  return (
    <>
      <Button
        ref={filterButtonRef}
        variant="outline"
        size="sm"
        className="mr-1"
        aria-label="打开筛选"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
      >
        <SlidersHorizontal className={`mr-2 h-4 w-4 ${hasActiveFilters ? 'text-primary' : ''}`} />
      </Button>
      {filterDrawerPortal}
    </>
  )
}

export default ThingHeaderFilterDrawer
