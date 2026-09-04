'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Search, Music, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMusicStore } from '@/stores/musicStore'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/helpers'
import { canUseAi } from '@/lib/ai/access'
import useAuthStore from '@/stores/authStore'
import '@/components/launcher/music/music-visualizer.css'

type DisplayMode = 'music' | 'apps' | 'settings'

interface AppGridButtonConfig {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isActive?: boolean
  buttonClassName?: string
}

export interface AppGridProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  onOpenAi?: () => void
  onToggleSearch?: () => void
  analyserNode?: AnalyserNode | null
}

function MusicEqualizerIcon({
  analyserNode,
  isPlaying,
}: {
  analyserNode?: AnalyserNode | null
  isPlaying: boolean
}) {
  const [levels, setLevels] = useState([0.42, 0.7, 0.55, 0.82])
  const frameRef = useRef<number | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const idleLevels = [0.42, 0.7, 0.55, 0.82]

  useEffect(() => {
    if (!analyserNode || !isPlaying) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    dataRef.current = new Uint8Array(analyserNode.frequencyBinCount)

    const render = () => {
      const data = dataRef.current
      if (!data) return

      analyserNode.getByteFrequencyData(data as Uint8Array<ArrayBuffer>)

      const segmentSize = Math.max(1, Math.floor(data.length / 4))
      const nextLevels = Array.from({ length: 4 }, (_, index) => {
        const start = index * segmentSize
        const end = index === 3 ? data.length : Math.min(data.length, start + segmentSize)
        let total = 0

        for (let cursor = start; cursor < end; cursor += 1) {
          total += data[cursor]
        }

        const average = total / Math.max(1, end - start)
        return Math.max(0.22, Math.min(1, average / 140))
      })

      setLevels(prev => prev.map((level, index) => level * 0.42 + nextLevels[index] * 0.58))
      frameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [analyserNode, isPlaying])

  const renderedLevels = isPlaying && analyserNode ? levels : idleLevels

  return (
    <div className="music-equalizer-icon" aria-hidden="true">
      {renderedLevels.map((level, index) => (
        <span
          key={index}
          className="music-equalizer-bar"
          style={{ transform: `scaleY(${level.toFixed(3)})` }}
        />
      ))}
    </div>
  )
}

export function AppGrid({
  toggleDisplayMode,
  onOpenAi,
  onToggleSearch,
  analyserNode,
}: AppGridProps) {
  const { t } = useTranslation()
  const { isPlaying } = useMusicStore()
  const user = useAuthStore(state => state.user)

  const musicIcon = isPlaying ? (
    <MusicEqualizerIcon analyserNode={analyserNode} isPlaying={isPlaying} />
  ) : (
    <Music className="h-5 w-5 transition-colors" />
  )

  // 定义按钮配置
  const buttons: AppGridButtonConfig[] = [
    {
      icon: <div className="transition-transform duration-300">{musicIcon}</div>,
      label: t('appgrid.music'),
      onClick: () => toggleDisplayMode('music'),
      isActive: isPlaying,
    },
    ...(canUseAi(user)
      ? [
          {
            icon: <Bot className="h-5 w-5" />,
            label: t('appgrid.ai', 'AI 助理'),
            onClick: () => onOpenAi?.(),
          },
        ]
      : []),
    {
      icon: <Search className="h-5 w-5" />,
      label: t('appgrid.search', '搜索'),
      onClick: () => onToggleSearch?.(),
    },
  ]

  return (
    <div className="flex shrink-0 items-center gap-0 sm:gap-2">
      {buttons.map(button => (
        <div key={button.label}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-10 gap-2 rounded-xl hover:bg-accent/70 lg:w-auto lg:px-3',
              button.isActive && 'bg-primary/12 text-primary hover:bg-primary/18',
              button.buttonClassName
            )}
            onClick={button.onClick}
            title={button.label}
            aria-label={button.isActive ? `${button.label}，正在播放` : button.label}
            data-active={button.isActive || undefined}
          >
            {button.icon}
            <span className="hidden text-sm font-medium lg:inline">{button.label}</span>
          </Button>
        </div>
      ))}
    </div>
  )
}
