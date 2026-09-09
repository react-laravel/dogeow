'use client'

import { Minus, Plus, RotateCcw, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ReaderPanel } from './ReaderPanel'
import { ReaderChoiceGroup } from './ReaderChoiceGroup'
import { SentencePairBlock } from './SentencePairBlock'
import { getBookFontFamily } from '@/app/book/utils/theme'
import { VOLUME_BOOK_DEFAULTS } from '@/app/book/utils/registry'
import {
  PAIR_DISPLAY_LABELS,
  READER_CONTENT_MODE_LABELS,
  READER_FONT_LABELS,
  type BaseReaderSettings,
  type PairDisplayMode,
  type ReaderContentMode,
  type ReaderFont,
} from '@/app/book/types/reader'

interface ReaderSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: BaseReaderSettings
  onPatchSettings: (patch: Partial<BaseReaderSettings>) => void
  hasPairDisplayMode?: boolean
  hasContentMode?: boolean
  hasDualFonts?: boolean
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  const adjust = (amount: number) =>
    onChange(Number(Math.max(min, Math.min(max, value + amount)).toFixed(1)))
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <output className="text-muted-foreground tabular-nums">{format(value)}</output>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-xl shadow-none"
          aria-label={`减小${label}`}
          disabled={value <= min}
          onClick={() => adjust(-step)}
        >
          <Minus className="size-4" />
        </Button>
        <Slider
          aria-label={label}
          className="flex-1 py-3"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([next]) => onChange(next)}
        />
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-xl shadow-none"
          aria-label={`增大${label}`}
          disabled={value >= max}
          onClick={() => adjust(step)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function ReaderSettingsPanel({
  open,
  onOpenChange,
  settings,
  onPatchSettings,
  hasPairDisplayMode = true,
  hasContentMode = true,
  hasDualFonts = false,
}: ReaderSettingsPanelProps) {
  const fontOptions = (Object.keys(READER_FONT_LABELS) as ReaderFont[]).map(value => ({
    value,
    label: READER_FONT_LABELS[value],
    style: { fontFamily: getBookFontFamily(value) },
  }))
  return (
    <ReaderPanel
      open={open}
      onOpenChange={onOpenChange}
      title="阅读设置"
      description="调成适合自己的阅读方式，修改即时保存"
      theme={settings.theme}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">所有书共用样式，进度仍按书保存</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 shrink-0 rounded-xl"
            onClick={() => onPatchSettings({ ...VOLUME_BOOK_DEFAULTS })}
          >
            <RotateCcw className="size-3.5" />
            恢复默认
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section
          aria-label="阅读效果预览"
          className="overflow-hidden rounded-2xl border border-border bg-muted/30 p-4"
        >
          <p className="mb-2 text-[11px] font-medium tracking-widest text-muted-foreground">
            效果预览
          </p>
          <div
            className="max-h-44 overflow-y-auto whitespace-pre-line"
            style={{
              fontSize: settings.fontSize,
              lineHeight: settings.lineHeight,
              fontFamily: getBookFontFamily(settings.originalFontFamily),
            }}
          >
            <SentencePairBlock
              pair={{
                o: '静下心来，读一段好文字。\n让阅读慢慢成为一种日常。\n行距拉开，读起来才更从容。',
                t:
                  hasContentMode || hasPairDisplayMode
                    ? 'Settle in, and read a little.\nLet reading become an everyday habit.'
                    : '',
              }}
              pairIndex={0}
              displayMode={hasPairDisplayMode ? settings.pairDisplayMode : 'muted'}
              contentMode={hasContentMode ? settings.contentMode : 'original'}
              theme={settings.theme}
              originalFontFamily={settings.originalFontFamily}
              translationFontFamily={settings.translationFontFamily}
            />
          </div>
        </section>
        <section className="space-y-5" aria-label="字号与行距">
          <SettingSlider
            label="字号"
            value={settings.fontSize}
            min={16}
            max={64}
            step={2}
            format={value => `${value}px`}
            onChange={fontSize => onPatchSettings({ fontSize })}
          />
          <SettingSlider
            label="行距"
            value={settings.lineHeight}
            min={1.4}
            max={2.6}
            step={0.1}
            format={value => value.toFixed(1)}
            onChange={lineHeight => onPatchSettings({ lineHeight })}
          />
        </section>
        <ReaderChoiceGroup
          label="背景模式"
          value={settings.theme}
          onChange={theme => onPatchSettings({ theme })}
          columns={5}
          options={[
            { value: 'auto', label: '系统', preview: <Monitor className="size-6" /> },
            {
              value: 'light',
              label: '浅色',
              preview: <span className="size-6 rounded-full border border-black/15 bg-white" />,
            },
            {
              value: 'dark',
              label: '深色',
              preview: <span className="size-6 rounded-full border border-white/20 bg-[#141414]" />,
            },
            {
              value: 'sepia',
              label: '暖色',
              preview: <span className="size-6 rounded-full border border-black/15 bg-[#f4ecd8]" />,
            },
            {
              value: 'green',
              label: '豆绿',
              preview: <span className="size-6 rounded-full border border-black/15 bg-[#c7edcc]" />,
            },
          ]}
        />
        <section className="space-y-5 border-t border-border pt-5" aria-label="字体选择">
          <ReaderChoiceGroup
            label={hasDualFonts ? '原文字体' : '字体'}
            value={settings.originalFontFamily}
            onChange={originalFontFamily => onPatchSettings({ originalFontFamily })}
            options={fontOptions}
          />
          {hasDualFonts && (
            <ReaderChoiceGroup
              label="译文字体"
              value={settings.translationFontFamily}
              onChange={translationFontFamily => onPatchSettings({ translationFontFamily })}
              options={fontOptions}
            />
          )}
        </section>
        {(hasContentMode || hasPairDisplayMode) && (
          <section className="space-y-5 border-t border-border pt-5" aria-label="阅读内容与对照">
            {hasContentMode && settings.contentMode && (
              <ReaderChoiceGroup
                label="阅读内容"
                value={settings.contentMode}
                onChange={contentMode => onPatchSettings({ contentMode })}
                options={(Object.keys(READER_CONTENT_MODE_LABELS) as ReaderContentMode[]).map(
                  value => ({ value, label: READER_CONTENT_MODE_LABELS[value] })
                )}
              />
            )}
            {hasPairDisplayMode && settings.pairDisplayMode && (
              <ReaderChoiceGroup
                label="原文译文区分"
                columns={2}
                value={settings.pairDisplayMode}
                onChange={pairDisplayMode => onPatchSettings({ pairDisplayMode })}
                options={(Object.keys(PAIR_DISPLAY_LABELS) as PairDisplayMode[]).map(value => ({
                  value,
                  label: PAIR_DISPLAY_LABELS[value],
                }))}
              />
            )}
          </section>
        )}
      </div>
    </ReaderPanel>
  )
}
