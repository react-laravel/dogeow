'use client'

import { useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { GameItem } from '../../types'
import { useGameStore } from '../../stores/gameStore'
import { GemSelectorDialog } from './GemSelectorDialog'
import { InventoryGrid } from './InventoryGrid'
import { InventoryToolbar } from './InventoryToolbar'
import { SellQuantityDialog } from './SellQuantityDialog'
import {
  getEquippedItemFor,
  getEquippedRingItems,
  hasEquippedItemFor,
} from './inventoryEquipmentUtils'
import { useInventoryPanelActions } from './useInventoryPanelActions'
import { useInventoryPanelView } from './useInventoryPanelView'

export function InventoryPanel() {
  const {
    inventory,
    storage,
    inventorySize,
    storageSize,
    equipment,
    equipItem,
    sellItem,
    sellItemsByQuality,
    updateAutoRecycleSettings,
    character,
    moveItem,
    sortInventory,
    socketGem,
    unsocketGem,
    isLoading,
  } = useGameStore(
    useShallow(s => ({
      inventory: s.inventory,
      storage: s.storage,
      inventorySize: s.inventorySize,
      storageSize: s.storageSize,
      equipment: s.equipment,
      character: s.character,
      equipItem: s.equipItem,
      sellItem: s.sellItem,
      sellItemsByQuality: s.sellItemsByQuality,
      updateAutoRecycleSettings: s.updateAutoRecycleSettings,
      moveItem: s.moveItem,
      sortInventory: s.sortInventory,
      socketGem: s.socketGem,
      unsocketGem: s.unsocketGem,
      isLoading: s.isLoading,
    }))
  )

  const [isSavingAutoRecycle, setIsSavingAutoRecycle] = useState(false)

  const {
    canSocket,
    canUnsocket,
    closeGemSelector,
    closeSellConfirm,
    gemsInInventory,
    getCompareActions,
    handleCompareAction,
    handleEquip,
    handleMove,
    handleSell,
    handleSellConfirm,
    handleSocketGem,
    handleUnsocketGem,
    openGemSelector,
    selectedItem,
    selectedItemId,
    selectedSocketItem,
    sellQuantity,
    setSelectedItem,
    setSellQuantity,
    showGemSelector,
    showSellConfirm,
  } = useInventoryPanelActions({
    equipItem,
    inventory,
    moveItem,
    sellItem,
    socketGem,
    unsocketGem,
  })

  const {
    categoryId,
    displaySlots,
    handleRecycleQuality,
    qualityStats,
    recyclingQuality,
    setCategoryId,
    setShowStorage,
    showStorage,
  } = useInventoryPanelView({
    inventory,
    inventorySize,
    sellItemsByQuality,
    storage,
    storageSize,
  })

  const getEquippedItem = useCallback(
    (item: GameItem) => getEquippedItemFor(equipment, item),
    [equipment]
  )
  const getEquippedRings = useCallback(() => getEquippedRingItems(equipment), [equipment])
  const hasEquippedItem = useCallback(
    (item: GameItem) => hasEquippedItemFor(equipment, item),
    [equipment]
  )
  const onEquip = useCallback(() => void handleEquip(), [handleEquip])
  const onSell = useCallback(() => void handleSell(), [handleSell])
  const onMove = useCallback((toStorage: boolean) => void handleMove(toStorage), [handleMove])
  const onUnsocketGem = useCallback(
    (socketIndex: number) => void handleUnsocketGem(socketIndex),
    [handleUnsocketGem]
  )
  const handleAutoRecycleMaxValueChange = useCallback(
    async (maxValue: number | null) => {
      setIsSavingAutoRecycle(true)
      try {
        await updateAutoRecycleSettings(maxValue)
      } finally {
        setIsSavingAutoRecycle(false)
      }
    },
    [updateAutoRecycleSettings]
  )

  return (
    <>
      <GemSelectorDialog
        isOpen={showGemSelector}
        socketItem={selectedSocketItem}
        gems={gemsInInventory}
        onClose={closeGemSelector}
        onSelect={handleSocketGem}
      />
      <SellQuantityDialog
        isOpen={showSellConfirm}
        item={selectedItem}
        quantity={sellQuantity}
        isLoading={isLoading}
        onQuantityChange={setSellQuantity}
        onClose={closeSellConfirm}
        onConfirm={handleSellConfirm}
      />
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* 背包/仓库 - 装备栏已移至角色面板 */}
        <div className="bg-card border-border flex min-w-0 flex-1 flex-col rounded-lg border p-3 sm:p-4">
          <InventoryToolbar
            autoRecycleMaxValue={character?.auto_recycle_max_value ?? null}
            categoryId={categoryId}
            inventoryCount={inventory.length}
            inventorySize={inventorySize}
            isLoading={isLoading}
            isSavingAutoRecycle={isSavingAutoRecycle}
            onAutoRecycleMaxValueChange={handleAutoRecycleMaxValueChange}
            onCategoryChange={setCategoryId}
            onRecycleQuality={handleRecycleQuality}
            onShowStorageChange={setShowStorage}
            onSort={sortInventory}
            qualityStats={qualityStats}
            recyclingQuality={recyclingQuality}
            showStorage={showStorage}
            storageCount={storage.length}
            storageSize={storageSize}
          />

          <InventoryGrid
            canSocket={canSocket}
            canUnsocket={canUnsocket}
            displaySlots={displaySlots}
            gemsInInventoryCount={gemsInInventory.length}
            getCompareActions={getCompareActions}
            getEquippedItem={getEquippedItem}
            getEquippedRings={getEquippedRings}
            handleCompareAction={handleCompareAction}
            hasEquippedItem={hasEquippedItem}
            isLoading={isLoading}
            onEquip={onEquip}
            onMove={onMove}
            onOpenGemSelector={openGemSelector}
            onSelectedItemChange={setSelectedItem}
            onSell={onSell}
            onUnsocketGem={onUnsocketGem}
            selectedItemId={selectedItemId}
          />
        </div>
      </div>
    </>
  )
}
