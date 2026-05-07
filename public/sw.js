// Service Worker for DogeOW PWA
const CACHE_NAME = 'dogeow-v1.0.2'
const urlsToCache = ['/offline', '/480.png', '/80.png', '/favicon.ico']

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  console.log('Service Worker installing... Version:', CACHE_NAME)
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME)
        return cache.addAll(urlsToCache)
      })
      .catch(error => {
        console.error('Failed to install Service Worker:', error)
        // 即使安装失败，也要继续激活
        return Promise.resolve()
      })
  )
  // 强制激活新的Service Worker
  self.skipWaiting()
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName).catch(error => {
                console.warn('Failed to delete old cache:', cacheName, error)
                return Promise.resolve()
              })
            }
          })
        )
      })
      .catch(error => {
        console.error('Failed to activate Service Worker:', error)
        return Promise.resolve()
      })
  )
  // 立即控制所有页面
  event.waitUntil(self.clients.claim())

  // 通知所有客户端页面Service Worker已激活
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_ACTIVATED' })
      })
    })
  )
})

// 获取事件 - 网络优先，缓存备用
self.addEventListener('fetch', event => {
  const request = event.request

  // 跳过不支持的请求方案
  if (
    request.url.startsWith('chrome-extension://') ||
    request.url.startsWith('moz-extension://') ||
    request.url.startsWith('chrome-devtools://') ||
    request.url.startsWith('moz-devtools://')
  ) {
    return
  }

  // 跳过非HTTP/HTTPS请求
  if (!request.url.startsWith('http')) {
    return
  }

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  // Next.js 构建产物带 hash，由浏览器/CDN 管理缓存；SW 不接管，避免部署后旧 chunk 残留。
  if (url.pathname.startsWith('/_next/')) {
    return
  }

  // 页面导航必须网络优先且不写入缓存，避免旧 HTML/旧 JS 让站内 router 行为退化成整页加载。
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline').then(response => {
          return response || new Response('Offline', { status: 503 })
        })
      })
    )
    return
  }

  // 对于favicon.ico等静态资源，使用缓存优先策略
  if (
    request.destination === 'image' ||
    request.url.includes('favicon.ico') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.jpeg') ||
    request.url.includes('.gif') ||
    request.url.includes('.svg') ||
    request.url.includes('.ico')
  ) {
    // 对于favicon.ico，直接返回缓存的版本，避免重复请求
    if (request.url.includes('favicon.ico')) {
      event.respondWith(
        caches.match('/favicon.ico').then(response => {
          if (response) {
            return response
          }
          // 如果缓存中没有，返回默认的favicon
          return new Response('', { status: 404 })
        })
      )
      return
    }

    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response
        }
        return fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches
              .open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone).catch(() => {})
              })
              .catch(() => {})
          }
          return response
        })
      })
    )
    return
  }

  // 其他请求交给浏览器默认处理，避免缓存 API 响应、RSC payload 或页面数据。
})

// 监听来自页面的消息
self.addEventListener('message', event => {
  console.log('Service Worker 收到消息:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('收到跳过等待请求，立即激活新版本')
    self.skipWaiting()
  }
})

// 推送通知事件
self.addEventListener('push', function (event) {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    // payload 可能是纯文本（非 JSON），按纯文本展示
    const text = event.data.text()
    event.waitUntil(
      self.registration.showNotification('DogeOW', {
        body: text || 'DogeOW 有新消息',
        icon: '/480.png',
        badge: '/80.png',
        data: { url: '/' },
      })
    )
    return
  }

  // 后端 WebPushNotification 把 url 放在 data 对象里，即 payload.data.url
  const url = data.url ?? data.data?.url ?? '/'
  const options = {
    body: data.body || 'DogeOW 有新消息',
    icon: data.icon || '/480.png',
    badge: '/80.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url,
    },
    actions: [
      { action: 'open', title: '打开', icon: '/80.png' },
      { action: 'close', title: '关闭', icon: '/80.png' },
    ],
  }
  event.waitUntil(self.registration.showNotification(data.title || 'DogeOW', options))
})

// 通知点击事件
self.addEventListener('notificationclick', function (event) {
  console.log('收到通知点击')
  event.notification.close()

  if (event.action === 'open' || event.action === undefined) {
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
  }
})

// 后台同步事件
self.addEventListener('sync', function (event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // 在这里实现后台同步逻辑
  console.log('执行后台同步')
  return Promise.resolve()
}
