import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport
  window.addEventListener('resize', onChange)
  viewport?.addEventListener('resize', onChange)
  viewport?.addEventListener('scroll', onChange)
  return () => {
    window.removeEventListener('resize', onChange)
    viewport?.removeEventListener('resize', onChange)
    viewport?.removeEventListener('scroll', onChange)
  }
}

function snapshot() {
  const viewport = window.visualViewport
  return `${viewport?.offsetTop ?? 0}:${viewport?.height ?? window.innerHeight}`
}

/** Keep the composer inside the visible viewport when a mobile keyboard opens. */
export function useChatViewport() {
  const value = useSyncExternalStore(subscribe, snapshot, () => '')
  if (!value) return { top: 0, height: '100dvh' }
  const [top, height] = value.split(':').map(Number)
  return { top, height }
}
