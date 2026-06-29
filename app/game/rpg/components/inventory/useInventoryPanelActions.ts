'use client'

import { useCallback, useState } from 'react'
import type { ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { getInventoryCompareActions, handleInventoryCompareAction } from './inventoryEquipmentUtils'
import { canSocketItem, useGemManagement } from './useGemManagement'
import { canUnsocketItem } from './inventoryUtils'

interface UseInventoryPanelActionsParams {
  equipItem: (itemId: number) => Promise<unknown>
  inventory: GameItem[]
  moveItem: (itemId: number, toStorage: boolean) => Promise<unknown>
  sellItem: (itemId: number, quantity?: number) => Promise<unknown>
  socketGem: (itemId: number, gemItemId: number, socketIndex: number) => Promise<unknown>
  unsocketGem: (itemId: number, socketIndex: number) => Promise<unknown>
}

export function useInventoryPanelActions({
  equipItem,
  inventory,
  moveItem,
  sellItem,
  socketGem,
  unsocketGem,
}: UseInventoryPanelActionsParams) {
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [sellQuantity, setSellQuantity] = useState(1)
  const [showSellConfirm, setShowSellConfirm] = useState(false)

  const {
    closeGemSelector,
    gemsInInventory,
    handleSocketGem,
    handleUnsocketGem: handleInventoryUnsocketGem,
    openGemSelector,
    selectedSocketItem,
    showGemSelector,
  } = useGemManagement({
    inventory,
    onSocketComplete: () => setSelectedItem(null),
    onUnsocketComplete: () => setSelectedItem(null),
    socketGem,
    unsocketGem,
  })

  const handleEquip = useCallback(
    async (item: GameItem | null = selectedItem) => {
      if (!item) return

      await equipItem(item.id)
      setSelectedItem(null)
    },
    [equipItem, selectedItem]
  )

  const handleSell = useCallback(
    async (item: GameItem | null = selectedItem) => {
      if (!item) return

      setSelectedItem(item)

      if (item.quantity > 1) {
        setSellQuantity(1)
        setShowSellConfirm(true)
        return
      }

      await sellItem(item.id, 1)
      setSelectedItem(null)
    },
    [sellItem, selectedItem]
  )

  const handleSellConfirm = useCallback(async () => {
    if (!selectedItem) return

    await sellItem(selectedItem.id, sellQuantity)
    setShowSellConfirm(false)
    setSelectedItem(null)
  }, [selectedItem, sellItem, sellQuantity])

  const closeSellConfirm = useCallback(() => {
    setShowSellConfirm(false)
  }, [])

  const handleMove = useCallback(
    async (toStorage: boolean, item: GameItem | null = selectedItem) => {
      if (!item) return

      await moveItem(item.id, toStorage)
      setSelectedItem(null)
    },
    [moveItem, selectedItem]
  )

  const handleUnsocketGem = useCallback(
    async (socketIndex: number, item: GameItem | null = selectedItem) => {
      await handleInventoryUnsocketGem(item, socketIndex)
    },
    [handleInventoryUnsocketGem, selectedItem]
  )

  const canSocket = canSocketItem
  const canUnsocket = canUnsocketItem

  const getCompareActions = useCallback(
    (item: GameItem): ItemActionType[] =>
      getInventoryCompareActions(item, { canSocket, canUnsocket }),
    [canSocket, canUnsocket]
  )

  const handleCompareAction = useCallback(
    (action: ItemActionType, item: GameItem) => {
      handleInventoryCompareAction(action, item, {
        onEquip: handleEquip,
        onMoveToStorage: currentItem => handleMove(true, currentItem),
        onSell: handleSell,
        onSocket: openGemSelector,
        onUnsocket: currentItem => handleUnsocketGem(0, currentItem),
      })
    },
    [handleEquip, handleMove, handleSell, handleUnsocketGem, openGemSelector]
  )

  return {
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
    selectedItemId: selectedItem?.id ?? null,
    selectedSocketItem,
    sellQuantity,
    setSelectedItem,
    setSellQuantity,
    showGemSelector,
    showSellConfirm,
  }
}
