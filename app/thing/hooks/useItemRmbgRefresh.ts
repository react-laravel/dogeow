'use client'

import { useEffect } from 'react'
import useAuthStore from '@/stores/authStore'
import { subscribeRmbgStatusUpdates } from '../utils/rmbg'
import type { Item, RmbgStatus } from '../types'

const ACTIVE_RMBG_STATUSES: RmbgStatus[] = ['pending', 'processing']

export function itemHasPendingRmbg(item: Item | undefined): boolean {
  return (
    item?.images?.some(image => {
      const status = image.rmbg_status
      return status !== undefined && ACTIVE_RMBG_STATUSES.includes(status)
    }) ?? false
  )
}

export function useItemRmbgRefresh(
  item: Item | undefined,
  refreshItem: () => Promise<Item | undefined>
): void {
  const userId = useAuthStore(state => state.user?.id)

  useEffect(() => {
    if (!item || !itemHasPendingRmbg(item) || !userId) {
      return
    }

    return subscribeRmbgStatusUpdates(userId, event => {
      if (event.item_id !== item.id) {
        return
      }

      if (event.status === 'done' || event.status === 'failed') {
        void refreshItem()
      }
    })
  }, [item, refreshItem, userId])
}
