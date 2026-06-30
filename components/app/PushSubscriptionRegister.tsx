'use client'

import { useEffect } from 'react'
import useAuthStore from '@/stores/authStore'
import usePushSubscriptionStore from '@/stores/pushSubscriptionStore'

/**
 * 挂载后：在用户已登录且已授权通知时，自动向服务端注册 Web Push 订阅。
 * 不渲染任何 UI，仅执行订阅逻辑（全局唯一入口）。
 */
export function PushSubscriptionRegister() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const refreshState = usePushSubscriptionStore(s => s.refreshState)
  const ensureAutoRegister = usePushSubscriptionStore(s => s.ensureAutoRegister)

  useEffect(() => {
    if (!isAuthenticated) return

    void refreshState().then(() => {
      ensureAutoRegister()
    })
  }, [isAuthenticated, refreshState, ensureAutoRegister])

  return null
}
