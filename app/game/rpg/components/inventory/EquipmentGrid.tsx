'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../stores/gameStore'
import { EquipmentSlot, GameItem } from '../../types'
import { EquipmentDetailOverlay } from './EquipmentDetailOverlay'
import { GemSelectorDialog } from './GemSelectorDialog'
import { EquipmentSlotButton } from './EquipmentSlotButton'
import { CHARACTER_PORTRAITS, PAPER_DOLL_SLOTS } from './equipmentLayout'
import { useGemManagement } from './useGemManagement'

interface EquipmentGridProps {
  equipment: Record<string, GameItem | null>
  onUnequip: (slot: EquipmentSlot) => void
  characterSummary?: {
    name: string
    level: number
    classLabel: string
    experience: number
    expToNext: number
  }
}

export function EquipmentGrid({ equipment, onUnequip, characterSummary }: EquipmentGridProps) {
  const { socketGem, unsocketGem, inventory, isLoading, characterClass } = useGameStore(
    useShallow(s => ({
      socketGem: s.socketGem,
      unsocketGem: s.unsocketGem,
      inventory: s.inventory,
      isLoading: s.isLoading,
      characterClass: s.character?.class,
    }))
  )
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null)

  const selectedItem = selectedSlot ? equipment[selectedSlot] : null

  const {
    closeGemSelector,
    gemsInInventory,
    handleSocketGem,
    handleUnsocketGem,
    openGemSelector,
    selectedSocketItem,
    showGemSelector,
  } = useGemManagement({
    inventory,
    onSocketComplete: () => setSelectedSlot(null),
    onUnsocketComplete: () => setSelectedSlot(null),
    socketGem,
    unsocketGem,
  })

  const handleUnequip = () => {
    if (!selectedSlot) return
    onUnequip(selectedSlot)
    setSelectedSlot(null)
  }

  const portrait = CHARACTER_PORTRAITS[characterClass ?? 'warrior'] ?? CHARACTER_PORTRAITS.warrior

  return (
    <>
      <div className="border-border relative aspect-[3/4] w-full overflow-hidden border-y bg-black">
        <Image src={portrait} alt="" fill sizes="100vw" className="object-cover" priority={false} />
        {characterSummary && (
          <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 via-black/45 to-transparent px-3 pt-2.5 pb-10 sm:px-4 sm:pt-3 sm:pb-12">
            <h3 className="truncate text-center text-lg font-bold text-white drop-shadow sm:text-xl">
              {characterSummary.name}
            </h3>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/90 sm:text-xs">
              <span className="shrink-0 drop-shadow">
                Lv.{characterSummary.level} {characterSummary.classLabel}
              </span>
              <span className="min-w-0 truncate text-right drop-shadow">
                经验 {characterSummary.experience.toLocaleString()} /{' '}
                {characterSummary.expToNext.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        {PAPER_DOLL_SLOTS.map(cell => {
          const item = equipment[cell.slot]

          return (
            <div key={cell.slot} className={`absolute ${cell.className}`}>
              <EquipmentSlotButton
                slot={cell.slot}
                item={item}
                label={cell.label}
                onClick={() => item && setSelectedSlot(cell.slot)}
              />
            </div>
          )
        })}
      </div>

      <EquipmentDetailOverlay
        gemsInInventoryCount={gemsInInventory.length}
        isLoading={isLoading}
        item={selectedItem}
        onClose={() => setSelectedSlot(null)}
        onOpenGemSelector={openGemSelector}
        onUnequip={handleUnequip}
        onUnsocketGem={handleUnsocketGem}
      />
      <GemSelectorDialog
        isOpen={showGemSelector}
        socketItem={selectedSocketItem}
        gems={gemsInInventory}
        onClose={closeGemSelector}
        onSelect={handleSocketGem}
      />
    </>
  )
}
