'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { LazyAppLauncher } from '@/components/launcher/LazyAppLauncher'
import { useAiDialogStore } from '@/stores/aiDialogStore'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

export function RouteAwareAiLauncher() {
  const [localOpen, setLocalOpen] = useState(false)
  const externalOpen = useAiDialogStore(state => state.externalOpen)
  const requestClose = useAiDialogStore(state => state.requestClose)
  const setExternalOpen = useAiDialogStore(state => state.setExternalOpen)

  const isAiOpen = localOpen || externalOpen

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setLocalOpen(open)
      if (!open) {
        requestClose()
      } else {
        setExternalOpen(true)
      }
    },
    [requestClose, setExternalOpen]
  )

  return (
    <>
      <AiDialog open={isAiOpen} onOpenChange={handleOpenChange} />
      <LazyAppLauncher
        onOpenAi={() => handleOpenChange(!isAiOpen)}
        isAiOpen={isAiOpen}
        onCloseAi={() => handleOpenChange(false)}
      />
    </>
  )
}
