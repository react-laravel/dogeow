import type { LucideIcon } from 'lucide-react'
import { Apple, AppWindow, Chrome, Globe, Laptop, Monitor, Smartphone, Tablet } from 'lucide-react'

export type IconComponent = LucideIcon

export interface BrowserInfo {
  label: string
  Icon: IconComponent
}

export interface OSInfo {
  label: string
  Icon: IconComponent
}

/**
 * 检测浏览器信息
 */
export function getBrowserInfo(userAgent?: string): BrowserInfo {
  if (!userAgent) {
    return { label: '未知浏览器', Icon: Monitor }
  }

  if (/Chrome|CriOS/i.test(userAgent) && !/Edg|OPR|Opera/i.test(userAgent)) {
    return { label: 'Chrome', Icon: Chrome }
  }

  if (/Edg|EdgiOS|EdgA/i.test(userAgent)) {
    return { label: 'Edge', Icon: Globe }
  }

  if (/Firefox|FxiOS/i.test(userAgent)) {
    return { label: 'Firefox', Icon: Globe }
  }

  if (/Safari/i.test(userAgent) && /Version/i.test(userAgent) && !/Chrome|CriOS/i.test(userAgent)) {
    return { label: 'Safari', Icon: Globe }
  }

  return { label: '其他浏览器', Icon: Monitor }
}

/**
 * 检测操作系统信息
 */
export function getOSInfo(userAgent?: string): OSInfo {
  if (!userAgent) {
    return { label: '未知设备', Icon: Monitor }
  }

  if (/Windows NT/i.test(userAgent)) {
    return { label: 'Windows', Icon: AppWindow }
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return { label: 'Apple iOS', Icon: Tablet }
  }

  if (/Mac OS X/i.test(userAgent)) {
    return { label: 'Apple macOS', Icon: Apple }
  }

  if (/BB10|BlackBerry/i.test(userAgent)) {
    return { label: 'BlackBerry', Icon: Smartphone }
  }

  if (/Android/i.test(userAgent)) {
    return { label: 'Android', Icon: Smartphone }
  }

  return { label: '其他设备', Icon: Laptop }
}

/**
 * 检测是否为移动设备
 */
export function isMobileDevice(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  )
}
