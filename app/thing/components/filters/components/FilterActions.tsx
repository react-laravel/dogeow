import React, { memo } from 'react'
import { Button } from '@/components/ui/button'

interface FilterActionsProps {
  hasActiveFilters: boolean
  onClearAll: () => void
}

export const FilterActions = memo<FilterActionsProps>(({ hasActiveFilters, onClearAll }) => {
  return (
    <div className="bg-background mt-4 flex shrink-0 justify-end border-t pt-3 pb-[calc(env(safe-area-inset-bottom,0)+0.25rem)]">
      <Button
        variant="outline"
        onClick={onClearAll}
        disabled={!hasActiveFilters}
        className="disabled:bg-background disabled:border-border disabled:text-muted-foreground disabled:opacity-50"
      >
        重置
      </Button>
    </div>
  )
})

FilterActions.displayName = 'FilterActions'
