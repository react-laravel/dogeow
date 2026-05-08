'use client'

import { useEffect, useState } from 'react'

const SERVICE_WORKER_URL = '/sw.js?v=dogeow-v1.0.3'

function isLocalhostHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function shouldDisableServiceWorker() {
  if (typeof window === 'undefined') {
    return false
  }

  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return process.env.NODE_ENV !== 'test' && isLocalhostHost(window.location.hostname)
}

async function clearDogeowCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  const cacheKeys = await caches.keys()
  await Promise.all(
    cacheKeys.filter(key => key.startsWith('dogeow-')).map(key => caches.delete(key))
  )
}

async function unregisterServiceWorkers() {
  if (
    !('serviceWorker' in navigator) ||
    typeof navigator.serviceWorker.getRegistrations !== 'function'
  ) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))
}

export function PWARegister() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // 检查浏览器是否支持 Service Worker
    if ('serviceWorker' in navigator) {
      if (shouldDisableServiceWorker()) {
        console.log('开发环境/本地环境禁用 Service Worker，正在清理现有注册与缓存')
        void unregisterServiceWorkers().catch(error => {
          console.warn('清理 Service Worker 注册失败:', error)
        })
        void clearDogeowCaches().catch(error => {
          console.warn('清理 DogeOW 缓存失败:', error)
        })
        return
      }

      // 注册 Service Worker
      navigator.serviceWorker
        .register(SERVICE_WORKER_URL, {
          scope: '/',
          updateViaCache: 'none',
        })
        .then(registration => {
          console.log('Service Worker 注册成功:', registration)

          void registration.update().catch(error => {
            console.warn('Service Worker 主动检查更新失败:', error)
          })

          // 检查是否有等待中的更新
          if (registration.waiting) {
            console.log('检测到等待中的更新')
            setHasUpdate(true)
          }

          // 监听 Service Worker 更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  // 只有当新worker等待激活且当前有controller时才提示更新
                  if (registration.waiting && navigator.serviceWorker.controller) {
                    console.log('检测到新版本，等待激活')
                    setHasUpdate(true)
                  }
                }
              })
            }
          })

          // 监听controllerchange事件
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker 控制器已更改')
            setHasUpdate(false)
          })
        })
        .catch(error => {
          console.error('Service Worker 注册失败:', error)
        })

      // 监听 Service Worker 消息
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('收到 Service Worker 消息:', event.data)

        // 处理Service Worker激活消息
        if (event.data && event.data.type === 'SW_ACTIVATED') {
          console.log('Service Worker 已激活，清除更新状态')
          setHasUpdate(false)
          setIsChecking(false)
        }
      })

      // 监听 Service Worker 错误
      navigator.serviceWorker.addEventListener('error', error => {
        console.error('Service Worker 错误:', error)
      })
    } else {
      console.log('浏览器不支持 Service Worker')
    }
  }, [])

  // 处理更新
  const handleUpdate = async () => {
    if (isChecking) return // 防止重复点击

    try {
      setIsChecking(true)

      const registration = await navigator.serviceWorker.getRegistration()

      if (!registration) {
        console.log('没有可用的 Service Worker 注册')
        setHasUpdate(false)
        setIsChecking(false)
        return
      }

      if (registration.waiting) {
        console.log('向等待中的 Service Worker 发送跳过等待请求...')
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })

        setHasUpdate(false)

        setTimeout(() => {
          console.log('刷新页面以应用更新')
          window.location.reload()
        }, 200)

        return
      }

      console.log('当前没有等待中的 Service Worker，主动拉取最新脚本')
      await registration.update()

      if (!navigator.serviceWorker.controller) {
        console.log('没有活跃的 Service Worker 控制器')
      }

      setHasUpdate(false)
      setIsChecking(false)
    } catch (error) {
      console.error('更新处理失败:', error)
      // 即使失败也要清除更新状态
      setHasUpdate(false)
      setIsChecking(false)
    }
  }

  return (
    <>
      {hasUpdate && (
        <div className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-50 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span>有新版本可用</span>
            <button
              onClick={handleUpdate}
              disabled={isChecking}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                isChecking
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              {isChecking ? '更新中...' : '立即更新'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
