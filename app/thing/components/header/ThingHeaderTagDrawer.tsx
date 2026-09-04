import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Check, TagIcon } from 'lucide-react'
import { Tag } from '@/app/thing/types'
import { isLightColor } from '@/lib/helpers'

interface ThingHeaderTagDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: Tag[]
  selectedTags: string[]
  onTagClick: (tagId: string) => void
  onClearTags: () => void
}

function ThingHeaderTagDrawer({
  open,
  onOpenChange,
  tags,
  selectedTags,
  onTagClick,
  onClearTags,
}: ThingHeaderTagDrawerProps) {
  const getTagStyle = useCallback((color: string = '#3b82f6', isSelected: boolean = false) => {
    return {
      backgroundColor: isSelected ? color : 'transparent',
      color: isSelected ? (isLightColor(color) ? '#000' : '#fff') : color,
      borderColor: color,
    }
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-primary/20 h-10 gap-1.5 rounded-lg bg-white/90 px-2.5 shadow dark:bg-background/80 ${
            selectedTags.length > 0 ? 'text-primary border-primary/60 bg-primary/10' : ''
          }`}
          aria-label="打开标签筛选"
          title="标签"
        >
          <TagIcon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium">标签</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-[calc(100dvh-var(--app-header-total-height,56px))] max-h-[calc(100dvh-var(--app-header-total-height,56px))] w-[calc(100vw-5rem)] max-w-[16rem] flex-col gap-0 overflow-hidden p-0 sm:w-[16rem]"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <SheetHeader className="border-border shrink-0 border-b px-4 py-3">
          <SheetTitle>标签</SheetTitle>
          <SheetDescription className="sr-only">选择物品标签筛选条件</SheetDescription>
        </SheetHeader>

        {selectedTags.length > 0 ? (
          <div className="border-border shrink-0 border-b px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full"
              onClick={onClearTags}
            >
              清除所有标签
            </Button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
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
                    onClick={() => onTagClick(tagId)}
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
}

export default ThingHeaderTagDrawer
