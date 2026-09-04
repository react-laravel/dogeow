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

  // Compact corner chip above bottom nav — avoid full-bleed banner that covers tool cards
  return (
    <div className="pointer-events-none fixed right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 w-[min(calc(100vw-1.5rem),18rem)] md:right-4 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] md:w-80">
      <div className="pointer-events-auto border-border bg-background/95 space-y-2 rounded-xl border p-3 shadow-lg backdrop-blur">
        <div className="flex items-start gap-2">
          <div className="bg-primary/10 mt-0.5 shrink-0 rounded-full p-1.5">
            <Smartphone className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground text-sm font-semibold">安装 DogeOW</h3>
            <p className="text-muted-foreground text-xs leading-5">添加到主屏幕，获得更好体验</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="hover:bg-muted shrink-0 rounded-full p-1 transition-colors"
            aria-label="关闭安装提示"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            安装
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground px-2 py-1.5 text-xs transition-colors"
          >
            稍后
          </button>
        </div>
      </div>
    </div>
  )
}
