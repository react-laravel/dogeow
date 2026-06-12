'use client'

import type { ReactNode } from 'react'
import {
  CircleDollarSign,
  Gem,
  type LucideIcon,
  Package,
  PackageOpen,
  Trash2,
  Undo2,
  Wand2,
} from 'lucide-react'

export type ItemActionType =
  | 'equip'
  | 'use'
  | 'unequip'
  | 'store'
  | 'retrieve'
  | 'sell'
  | 'buy'
  | 'socket'
  | 'unsocket'

interface ItemActionsProps {
  actions: ItemActionType[]
  onAction: (action: ItemActionType) => void
  disabled?: boolean
  compact?: boolean
  leadingAction?: ReactNode
}

const ACTION_LABELS: Record<
  ItemActionType,
  { label: string; color: string; icon: LucideIcon; compactText?: boolean }
> = {
  equip: {
    label: '装备',
    color: 'bg-green-600 hover:bg-green-700',
    icon: Wand2,
    compactText: true,
  },
  use: { label: '使用', color: 'bg-violet-600 hover:bg-violet-700', icon: Wand2 },
  unequip: { label: '卸下', color: 'bg-red-600 hover:bg-red-700', icon: Undo2 },
  store: { label: '存入', color: 'bg-blue-600 hover:bg-blue-700', icon: Package },
  retrieve: { label: '取回', color: 'bg-blue-600 hover:bg-blue-700', icon: PackageOpen },
  sell: { label: '出售', color: 'bg-red-600 hover:bg-red-700', icon: Trash2 },
  buy: { label: '确认购买', color: 'bg-green-600 hover:bg-green-700', icon: CircleDollarSign },
  socket: { label: '镶嵌', color: 'bg-cyan-600 hover:bg-cyan-700', icon: Gem },
  unsocket: { label: '取下', color: 'bg-orange-600 hover:bg-orange-700', icon: Gem },
}

export function ItemActions({
  actions,
  onAction,
  disabled = false,
  compact = false,
  leadingAction,
}: ItemActionsProps) {
  if (actions.length === 0 && !leadingAction) return null

  return (
    <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
      {leadingAction}
      {actions.map(action => {
        const { label, color, icon: Icon, compactText } = ACTION_LABELS[action]
        return (
          <button
            key={action}
            onClick={() => onAction(action)}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`inline-flex items-center justify-center rounded text-xs text-white transition-colors disabled:opacity-50 ${color} ${
              compact ? (compactText ? 'min-w-12 px-2.5 py-1.5' : 'h-7 w-7') : 'px-3 py-1.5'
            }`}
          >
            {compact && !compactText ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : label}
          </button>
        )
      })}
    </div>
  )
}
