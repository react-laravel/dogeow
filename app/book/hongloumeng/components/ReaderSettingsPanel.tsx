'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PAIR_DISPLAY_LABELS } from '../utils/pairDisplay'
import {
  READER_CONTENT_MODE_LABELS,
  READER_FONT_LABELS,
  READER_THEME_LABELS,
  type PairDisplayMode,
  type ReaderContentMode,
  type ReaderFont,
  type ReaderSettings,
  type ReaderTheme,
} from '../hooks/useReaderSettings'

interface ReaderSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ReaderSettings
  onPatchSettings: (patch: Partial<ReaderSettings>) => void
}

export function ReaderSettingsPanel({
  open,
  onOpenChange,
  settings,
  onPatchSettings,
}: ReaderSettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-1/2 max-w-none flex-col gap-5 px-5 pt-5 pb-6 sm:max-w-none"
      >
        <SheetHeader className="p-0 pr-10">
          <SheetTitle>阅读设置</SheetTitle>
          <SheetDescription>字体、排版与显示方式</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <Label>原文字体</Label>
            <Select
              value={settings.originalFontFamily}
              onValueChange={value => onPatchSettings({ originalFontFamily: value as ReaderFont })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(READER_FONT_LABELS) as ReaderFont[]).map(key => (
                  <SelectItem key={key} value={key}>
                    {READER_FONT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>译文字体</Label>
            <Select
              value={settings.translationFontFamily}
              onValueChange={value =>
                onPatchSettings({ translationFontFamily: value as ReaderFont })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(READER_FONT_LABELS) as ReaderFont[]).map(key => (
                  <SelectItem key={key} value={key}>
                    {READER_FONT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>字号</Label>
              <span className="text-muted-foreground text-xs">{settings.fontSize}px</span>
            </div>
            <Slider
              min={14}
              max={32}
              step={1}
              value={[settings.fontSize]}
              onValueChange={([fontSize]) => onPatchSettings({ fontSize })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>行距</Label>
              <span className="text-muted-foreground text-xs">
                {settings.lineHeight.toFixed(1)}
              </span>
            </div>
            <Slider
              min={1.4}
              max={2.6}
              step={0.1}
              value={[settings.lineHeight]}
              onValueChange={([lineHeight]) => onPatchSettings({ lineHeight })}
            />
          </div>

          <div className="space-y-2">
            <Label>背景模式</Label>
            <Select
              value={settings.theme}
              onValueChange={value => onPatchSettings({ theme: value as ReaderTheme })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(READER_THEME_LABELS) as ReaderTheme[]).map(key => (
                  <SelectItem key={key} value={key}>
                    {READER_THEME_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>原文译文区分</Label>
            <Select
              value={settings.pairDisplayMode}
              onValueChange={value =>
                onPatchSettings({ pairDisplayMode: value as PairDisplayMode })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAIR_DISPLAY_LABELS) as PairDisplayMode[]).map(key => (
                  <SelectItem key={key} value={key}>
                    {PAIR_DISPLAY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>阅读内容</Label>
            <Select
              value={settings.contentMode}
              onValueChange={value => onPatchSettings({ contentMode: value as ReaderContentMode })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(READER_CONTENT_MODE_LABELS) as ReaderContentMode[]).map(key => (
                  <SelectItem key={key} value={key}>
                    {READER_CONTENT_MODE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
