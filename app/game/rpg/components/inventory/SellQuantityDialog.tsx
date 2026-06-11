'use client'

import { getItemDisplayName } from '../../utils/itemUtils'
import type { GameItem } from '../../types'

interface SellQuantityDialogProps {
  isLoading?: boolean
  isOpen: boolean
  item: GameItem | null
  quantity: number
  onClose: () => void
  onConfirm: () => void
  onQuantityChange: (quantity: number) => void
}

export function SellQuantityDialog({
  isLoading = false,
  isOpen,
  item,
  quantity,
  onClose,
  onConfirm,
  onQuantityChange,
}: SellQuantityDialogProps) {
  if (!isOpen || !item) return null

  const maxQuantity = Math.max(1, item.quantity)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
        <h4 className="text-foreground mb-2 text-base font-bold sm:text-lg">确认出售数量</h4>
        <p className="text-muted-foreground mb-4 text-sm">
          {getItemDisplayName(item)} 可出售 {maxQuantity} 个
        </p>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">数量: {quantity}</span>
          <div className="flex items-center gap-1">
            {[1, 10, 100].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + amount))}
                disabled={isLoading || quantity >= maxQuantity}
                className="bg-muted text-muted-foreground hover:bg-muted/80 rounded px-3 py-1 text-xs transition-colors disabled:opacity-50"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            确认出售
          </button>
        </div>
      </div>
    </div>
  )
}
