import useSWR from 'swr'
import { apiRequest } from '@/lib/api'
import type {
  MiniMaxSubscriptionResponse,
  MiniMaxSubscriptionDetailResponse,
  MiniMaxBillingResponse,
} from '../types'

// 共享 SWR hooks，两个组件使用相同缓存 key，mutate 自动同步
export function useMiniMaxSubscription(enabled = true) {
  const fetcher = async <T>(url: string): Promise<T> =>
    apiRequest<T>(url, 'GET', undefined, { handleError: false }) as Promise<T>

  const sub = useSWR<MiniMaxSubscriptionResponse>(
    enabled ? '/minimax/subscription' : null,
    fetcher,
    { refreshInterval: 30000 }
  )
  const detail = useSWR<MiniMaxSubscriptionDetailResponse>(
    enabled ? '/minimax/subscription-detail' : null,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30000 }
  )
  const billing = useSWR<MiniMaxBillingResponse>(enabled ? '/minimax/billing' : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  })

  return {
    sub,
    detail,
    billing,
    refresh: () => {
      sub.mutate()
      detail.mutate()
      billing.mutate()
    },
  }
}
