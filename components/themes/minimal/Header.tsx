'use client'

import { RouteAwareAiLauncher } from '@/components/app/RouteAwareAiLauncher'

/**
 * 极简主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function MinimalHeader() {
  return (
    <div className="flex h-full w-full items-center justify-between bg-transparent px-6">
      <div className="flex items-center gap-2">
        <span className="text-xl font-light">DogeOW</span>
      </div>

      <div className="flex items-center gap-2">
        <RouteAwareAiLauncher />
      </div>
    </div>
  )
}
