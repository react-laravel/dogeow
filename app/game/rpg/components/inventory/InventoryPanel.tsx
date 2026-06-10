'use client'

import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { GameItem } from '../../types'
import { useGameStore } from '../../stores/gameStore'
import { GemSelectorDialog } from './GemSelectorDialog'
import { InventoryGrid } from './InventoryGrid'
import { InventoryItemDetailOverlay } from './InventoryItemDetailOverlay'
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
    moveItem,
    sortInventory,
    consumePotion,
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
      equipItem: s.equipItem,
      sellItem: s.sellItem,
      sellItemsByQuality: s.sellItemsByQuality,
      moveItem: s.moveItem,
      sortInventory: s.sortInventory,
      consumePotion: s.consumePotion,
      socketGem: s.socketGem,
      unsocketGem: s.unsocketGem,
      isLoading: s.isLoading,
    }))
  )

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
    handleUsePotion,
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
    consumePotion,
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
  const onUsePotion = useCallback(() => void handleUsePotion(), [handleUsePotion])
  const onMove = useCallback((toStorage: boolean) => void handleMove(toStorage), [handleMove])
  const onUnsocketGem = useCallback(
    (socketIndex: number) => void handleUnsocketGem(socketIndex),
    [handleUnsocketGem]
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
      <InventoryItemDetailOverlay
        canSocket={canSocket}
        canUnsocket={canUnsocket}
        gemsInInventoryCount={gemsInInventory.length}
        getCompareActions={getCompareActions}
        getEquippedItem={getEquippedItem}
        getEquippedRings={getEquippedRings}
        handleCompareAction={handleCompareAction}
        hasEquippedItem={hasEquippedItem}
        isLoading={isLoading}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEquip={onEquip}
        onMove={onMove}
        onOpenGemSelector={openGemSelector}
        onSell={onSell}
        onUnsocketGem={onUnsocketGem}
        onUsePotion={onUsePotion}
        source={showStorage ? 'storage' : 'inventory'}
      />
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* 背包/仓库 - 装备栏已移至角色面板 */}
        <div className="bg-card border-border flex min-w-0 flex-1 flex-col rounded-lg border p-3 sm:p-4">
          <InventoryToolbar
            categoryId={categoryId}
            inventoryCount={inventory.length}
            inventorySize={inventorySize}
            isLoading={isLoading}
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
            displaySlots={displaySlots}
            isLoading={isLoading}
            onSelectedItemChange={setSelectedItem}
            selectedItemId={selectedItemId}
          />
        </div>
      </div>
    </>
  )
}
