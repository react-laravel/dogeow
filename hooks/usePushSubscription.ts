'use client'

import { useEffect } from 'react'
import useAuthStore from '@/stores/authStore'
import usePushSubscriptionStore, { isPushSupported } from '@/stores/pushSubscriptionStore'

export { isPushSupported }

/**
 * 在用户已登录且已授权通知时，向服务端注册当前设备的推送订阅。
 * 自动注册由 PushSubscriptionRegister 统一触发，避免多处重复订阅。
 */
export function usePushSubscription() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const permission = usePushSubscriptionStore(s => s.permission)
  const hasSubscription = usePushSubscriptionStore(s => s.hasSubscription)
  const status = usePushSubscriptionStore(s => s.status)
  const errorMessage = usePushSubscriptionStore(s => s.errorMessage)
  const refreshState = usePushSubscriptionStore(s => s.refreshState)
  const register = usePushSubscriptionStore(s => s.register)
  const unregister = usePushSubscriptionStore(s => s.unregister)

  useEffect(() => {
    if (!isAuthenticated) {
      usePushSubscriptionStore.setState({
        autoRegisterStarted: false,
        status: 'idle',
        errorMessage: null,
        hasSubscription: false,
      })
    }
  }, [isAuthenticated])

  return {
    register,
    unregister,
    refreshState,
    isSupported: isPushSupported(),
    permission,
    hasSubscription,
    status,
    errorMessage,
  }
}
