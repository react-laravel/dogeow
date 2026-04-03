'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { LazyAppLauncher } from '@/components/launcher/LazyAppLauncher'
import { toast } from 'sonner'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

function RouteAwareAiLauncher() {
  const [isAiOpen, setIsAiOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAiOpen) {
        toast.dismiss()
        setIsAiOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isAiOpen])

  const handleOpenAi = () => {
    toast.dismiss()
    setIsAiOpen(prev => !prev)
  }

  return (
    <>
      <AiDialog open={isAiOpen} onOpenChange={setIsAiOpen} />
      <LazyAppLauncher
        onOpenAi={handleOpenAi}
        isAiOpen={isAiOpen}
        onCloseAi={() => setIsAiOpen(false)}
      />
    </>
  )
}

/**
 * 极简主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function MinimalHeader() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full items-center justify-between bg-transparent px-6">
      <div className="flex items-center gap-2">
        <span className="text-xl font-light">DogeOW</span>
      </div>

      <div className="flex items-center gap-2">
        <RouteAwareAiLauncher key={pathname} />
      </div>
    </div>
  )
}
