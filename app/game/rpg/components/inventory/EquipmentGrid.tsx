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
}

export function EquipmentGrid({ equipment, onUnequip }: EquipmentGridProps) {
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
