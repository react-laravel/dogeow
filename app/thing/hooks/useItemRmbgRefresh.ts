'use client'

import { useEffect } from 'react'
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
  useEffect(() => {
    if (!itemHasPendingRmbg(item)) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refreshItem()
    }, 2000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [item, refreshItem])
}
