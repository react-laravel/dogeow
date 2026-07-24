'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

const PWA_DISMISSED_KEY = 'pwa-install-prompt-dismissed'

// 以外部 store 方式订阅 standalone 显示模式，避免在 effect 中 setState
function subscribeDisplayMode(callback: () => void) {
  const mql = window.matchMedia('(display-mode: standalone)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getIsStandalone = () => window.matchMedia('(display-mode: standalone)').matches
const getServerIsStandalone = () => false

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(PWA_DISMISSED_KEY) === '1' : true
  )
  const isStandalone = useSyncExternalStore(
    subscribeDisplayMode,
    getIsStandalone,
    getServerIsStandalone
  )

  useEffect(() => {
    if (isStandalone || dismissed) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone, dismissed])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch {
      // ignore prompt errors
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(PWA_DISMISSED_KEY, '1')
    setDismissed(true)
    setShowInstallPrompt(false)
  }

  if (isStandalone || isInstalled || dismissed || !showInstallPrompt) {
    return null
  }

  // Stack above PushNotificationPrompt (same corner)
  return (
    <div className="fixed right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-4 z-50 md:right-4 md:left-auto md:w-80">
      <div className="bg-background border-border space-y-3 rounded-lg border p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Smartphone className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-foreground font-semibold">安装 DogeOW</h3>
              <p className="text-muted-foreground text-sm">将应用安装到主屏幕，获得更好的体验</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="hover:bg-muted rounded-full p-1 transition-colors"
            aria-label="关闭安装提示"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            安装应用
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground px-4 py-2 text-sm transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  )
}
