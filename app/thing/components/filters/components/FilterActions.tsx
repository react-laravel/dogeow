import React, { memo } from 'react'
import { Button } from '@/components/ui/button'

interface FilterActionsProps {
  hasActiveFilters: boolean
  onClearAll: () => void
}

export const FilterActions = memo<FilterActionsProps>(({ hasActiveFilters, onClearAll }) => {
  return (
    <div className="bg-background sticky bottom-0 z-10 mt-6 flex justify-end border-t py-3">
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
