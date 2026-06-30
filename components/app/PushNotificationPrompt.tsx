'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/authStore'
import { isPushSupported, usePushSubscription } from '@/hooks/usePushSubscription'

const DISMISSED_KEY = 'push-notification-prompt-dismissed'

export function PushNotificationPrompt() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const authLoading = useAuthStore(s => s.loading)
  const { register, status, errorMessage } = usePushSubscription()
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  )
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(DISMISSED_KEY) === '1' : true
  )

  useEffect(() => {
    if (status === 'error' && errorMessage) {
      toast.error(errorMessage)
    }
  }, [errorMessage, status])

  const handleEnable = async () => {
    if (!isPushSupported()) {
      toast.error('当前环境不支持通知')
      return
    }

    const nextPermission =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()

    setPermission(nextPermission)

    if (nextPermission !== 'granted') {
      toast.error('通知未授权')
      return
    }

    const ok = await register()
    if (ok) {
      setDismissed(true)
      toast.success('通知已开启')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  if (
    authLoading ||
    !isAuthenticated ||
    dismissed ||
    permission !== 'default' ||
    !isPushSupported()
  ) {
    return null
  }

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 max-w-[min(calc(100vw-2rem),22rem)] rounded-lg border bg-background/95 p-3 text-foreground shadow-lg backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
          <Bell className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">开启通知</p>
          <p className="mt-1 text-xs text-muted-foreground">接收聊天和系统提醒。</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleEnable} loading={status === 'loading'}>
              开启
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              稍后
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleDismiss}
          aria-label="关闭通知提示"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
