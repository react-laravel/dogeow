'use client'

import type { GameItem } from '../../types'
import { getEffectiveSocketCount } from '../../utils/itemUtils'

interface GemSelectorDialogProps {
  isOpen: boolean
  socketItem: GameItem | null
  gems: GameItem[]
  onClose: () => void
  onSelect: (gemItem: GameItem, socketIndex: number) => void
}

const getFirstEmptySocketIndex = (item: GameItem) => {
  const usedIndices = new Set(item.gems?.map(gem => gem.socket_index) ?? [])
  const socketCount = getEffectiveSocketCount(item.sockets)

  for (let i = 0; i < socketCount; i += 1) {
    if (!usedIndices.has(i)) return i
  }

  return -1
}

export function GemSelectorDialog({
  isOpen,
  socketItem,
  gems,
  onClose,
  onSelect,
}: GemSelectorDialogProps) {
  if (!isOpen || !socketItem) return null

  const availableSocketCount =
    getEffectiveSocketCount(socketItem.sockets) - (socketItem.gems?.length ?? 0)

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
        <h4 className="text-foreground mb-3 text-base font-bold sm:mb-4 sm:text-lg">
          选择宝石 (还可镶嵌 {availableSocketCount} 个)
        </h4>
        {gems.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">背包中没有宝石</p>
        ) : (
          <div className="mb-4 grid grid-cols-4 gap-2">
            {gems.map(gem => {
              const emptyIndex = getFirstEmptySocketIndex(socketItem)

              return (
                <button
                  key={gem.id}
                  onClick={() => {
                    if (emptyIndex >= 0) onSelect(gem, emptyIndex)
                  }}
                  disabled={availableSocketCount <= 0}
                  className="bg-muted hover:bg-muted/80 flex aspect-square flex-col items-center justify-center rounded border p-1 disabled:opacity-50"
                  title={gem.definition?.description ?? gem.definition?.name}
                >
                  <span className="text-lg">💎</span>
                  <span className="text-[10px]">{gem.definition?.name}</span>
                </button>
              )
            })}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm sm:px-4"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
