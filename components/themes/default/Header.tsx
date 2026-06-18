'use client'

import { RouteAwareAiLauncher } from '@/components/app/RouteAwareAiLauncher'

/**
 * 默认主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function DefaultHeader() {
  return (
    <div className="mx-auto flex h-full w-full max-w-7xl items-center px-2 sm:px-4">
      <RouteAwareAiLauncher />
    </div>
  )
}
