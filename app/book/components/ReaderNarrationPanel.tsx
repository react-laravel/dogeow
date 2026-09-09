'use client'

import { useState } from 'react'
import { Headphones, Pause, Play, SkipBack, SkipForward, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ReaderPanel } from './ReaderPanel'
import { ReaderChoiceGroup } from './ReaderChoiceGroup'
import type { BookTheme } from '@/app/book/types/reader'
import type {
  BookNarrationEngine,
  BookNarrationMode,
  BookNarrationStatus,
} from '@/app/book/types/narration'

export interface ReaderNarrationControls {
  narrationStatus: BookNarrationStatus
  narrationMode: BookNarrationMode
  onNarrationModeChange: (mode: BookNarrationMode) => void
  onStartNarration: () => void
  onPauseNarration: () => void
  onResumeNarration: () => void
  onStopNarration: () => void
  narrationOriginalOnly?: boolean
  narrationPairIndex?: number | null
  narrationPairCount?: number
  narrationPreview?: string
  narrationRate?: number
  onNarrationRateChange?: (rate: number) => void
  onNarrationSeek?: (pairIndex: number) => void
  narrationUnavailableReason?: string
  narrationEngine?: BookNarrationEngine
  onNarrationEngineChange?: (engine: BookNarrationEngine) => void
}

export function ReaderNarrationPanel({
  open,
  onOpenChange,
  theme,
  chapterTitle,
  ...controls
}: ReaderNarrationControls & {
  open: boolean
  onOpenChange: (open: boolean) => void
  theme: BookTheme
  chapterTitle: string
}) {
  const {
    narrationStatus: status,
    narrationMode: mode,
    narrationPairIndex: index = null,
    narrationPairCount: count = 0,
    narrationPreview,
    narrationRate = 1,
    narrationOriginalOnly,
    onNarrationRateChange,
    onNarrationSeek,
    narrationUnavailableReason,
    onStartNarration,
    onPauseNarration,
    onResumeNarration,
    onStopNarration,
    onNarrationModeChange,
    narrationEngine = 'tts',
    onNarrationEngineChange,
  } = controls
  const active = status !== 'idle'
  const [pendingParagraph, setPendingParagraph] = useState<number | null>(null)
  const playing = status === 'playing'
  const playLabel = status === 'idle' ? '从当前位置开始听书' : playing ? '暂停听书' : '继续听书'
  const play = status === 'idle' ? onStartNarration : playing ? onPauseNarration : onResumeNarration
  return (
    <ReaderPanel
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) setPendingParagraph(null)
        onOpenChange(nextOpen)
      }}
      title="听书"
      description={chapterTitle || '从当前阅读位置开始朗读'}
      theme={theme}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Headphones className="size-4" />
            <span role="status">{playing ? '正在朗读' : active ? '已暂停' : '准备听书'}</span>
          </div>
          <p className="line-clamp-4 min-h-12 text-sm leading-7">
            {active && narrationPreview ? narrationPreview : '放松双眼，从眼前这一段开始听。'}
          </p>
        </div>
        {active && count > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>朗读进度</span>
              <span className="tabular-nums">
                第 {pendingParagraph ?? (index ?? 0) + 1} / {count} 段
              </span>
            </div>
            <Slider
              aria-label="朗读段落"
              className="py-3"
              min={1}
              max={Math.max(2, count)}
              step={1}
              value={[pendingParagraph ?? (index ?? 0) + 1]}
              disabled={!onNarrationSeek || count <= 1}
              onValueChange={([value]) => setPendingParagraph(value)}
              onValueCommit={([value]) => {
                onNarrationSeek?.(value - 1)
                setPendingParagraph(null)
              }}
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="size-12 rounded-full"
            aria-label="朗读上一段"
            disabled={!active || !onNarrationSeek || (index ?? 0) <= 0}
            onClick={() => onNarrationSeek?.((index ?? 0) - 1)}
          >
            <SkipBack className="size-5" />
          </Button>
          <Button
            size="icon"
            className="size-16 rounded-full shadow-none"
            aria-label={playLabel}
            onClick={play}
            disabled={Boolean(narrationUnavailableReason)}
          >
            {playing ? <Pause className="size-6" /> : <Play className="ml-0.5 size-6" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-12 rounded-full"
            aria-label="朗读下一段"
            disabled={!active || !onNarrationSeek || (index ?? 0) >= count - 1}
            onClick={() => onNarrationSeek?.((index ?? 0) + 1)}
          >
            <SkipForward className="size-5" />
          </Button>
        </div>
        <div className="text-center">
          {active ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-xl text-muted-foreground"
              onClick={onStopNarration}
            >
              <Square className="size-3.5" />
              结束听书
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {narrationUnavailableReason || '从当前位置开始，朗读时自动跟随正文'}
            </p>
          )}
        </div>
        <div className="space-y-5 border-t border-border pt-5">
          {onNarrationEngineChange && (
            <ReaderChoiceGroup
              label="朗读方式"
              columns={2}
              value={narrationEngine}
              onChange={onNarrationEngineChange}
              options={[
                { value: 'tts', label: '系统 TTS' },
                { value: 'ai', label: 'AI 朗读' },
              ]}
            />
          )}
          {!narrationOriginalOnly && (
            <ReaderChoiceGroup
              label="朗读内容"
              value={mode}
              onChange={onNarrationModeChange}
              options={[
                { value: 'original', label: '原文' },
                { value: 'translation', label: '译文' },
                { value: 'both', label: '原文＋译文' },
              ]}
            />
          )}
          {onNarrationRateChange && (
            <ReaderChoiceGroup
              label="朗读速度"
              columns={5}
              value={String(narrationRate)}
              onChange={value => onNarrationRateChange(Number(value))}
              options={[0.75, 1, 1.25, 1.5, 2].map(value => ({
                value: String(value),
                label: `${value}×`,
              }))}
            />
          )}
          {active && !narrationOriginalOnly && (
            <p className="text-xs leading-5 text-muted-foreground">
              朗读内容的调整从下一段起生效。
            </p>
          )}
        </div>
      </div>
    </ReaderPanel>
  )
}
