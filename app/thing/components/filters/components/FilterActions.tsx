import React, { memo } from 'react'
import { Button } from '@/components/ui/button'

interface FilterActionsProps {
  hasActiveFilters: boolean
  onClearAll: () => void
}

export const FilterActions = memo<FilterActionsProps>(({ hasActiveFilters, onClearAll }) => {
  return (
    <div className="bg-background mt-3 flex shrink-0 justify-end border-t pt-2 pb-1">
      <Button
        variant="outline"
        size="sm"
        onClick={onClearAll}
        disabled={!hasActiveFilters}
        className="h-8 text-xs disabled:bg-background disabled:border-border disabled:text-muted-foreground disabled:opacity-50"
      >
        重置
      </Button>
    </div>
  )
})

FilterActions.displayName = 'FilterActions'
