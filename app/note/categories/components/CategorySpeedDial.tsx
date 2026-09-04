'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddCategoryDialog from './AddCategoryDialog'

interface CategorySpeedDialProps {
  onCategoryAdded: () => void
  /** Controlled dialog open state (optional). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hide the floating + button when the page provides its own CTA. */
  hideFab?: boolean
}

export default function CategorySpeedDial({
  onCategoryAdded,
  open: controlledOpen,
  onOpenChange,
  hideFab = false,
}: CategorySpeedDialProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const dialogOpen = isControlled ? controlledOpen : uncontrolledOpen
  const setDialogOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next)
    }
    onOpenChange?.(next)
  }

  return (
    <>
      {!hideFab && (
        <div className="fixed right-6 bottom-24 z-50">
          <Button
            size="icon"
            className="bg-primary hover:bg-primary/90 h-14 w-14 rounded-full text-white shadow-lg"
            onClick={() => setDialogOpen(true)}
            aria-label="添加分类"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      <AddCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCategoryAdded={onCategoryAdded}
      />
    </>
  )
}
