'use client'

import React from 'react'
import {
  Palette,
  Image as ImageIcon,
  Languages,
  Sun,
  LayoutGrid,
  Maximize2,
  Play,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export type SettingsSection =
  | 'color'
  | 'background'
  | 'theme'
  | 'language'
  | 'playback'
  | 'apps'
  | 'fullscreen'

interface SettingsDialogSidebarProps {
  activeSection: SettingsSection
  isMdScreen: boolean
  onSelect: (section: SettingsSection) => void
}

const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  color: '颜色',
  background: '背景',
  theme: '主题',
  language: '语言',
  playback: '播放',
  apps: 'APP列表',
  fullscreen: '全屏',
}

export function getSettingsSectionTitle(section: SettingsSection) {
  return SETTINGS_SECTION_LABELS[section] ?? '设置'
}

export function SettingsDialogSidebar({
  activeSection,
  isMdScreen,
  onSelect,
}: SettingsDialogSidebarProps) {
  const settingsItems: { id: SettingsSection; icon: React.ReactNode; label: string }[] = [
    { id: 'color', icon: <Sun className="h-4 w-4" />, label: '颜色' },
    { id: 'language', icon: <Languages className="h-4 w-4" />, label: '语言' },
    { id: 'theme', icon: <Palette className="h-4 w-4" />, label: '主题' },
    { id: 'background', icon: <ImageIcon className="h-4 w-4" />, label: '背景' },
    { id: 'playback', icon: <Play className="h-4 w-4" />, label: '播放' },
    { id: 'apps', icon: <LayoutGrid className="h-4 w-4" />, label: 'APP列表' },
    ...(isMdScreen
      ? [{ id: 'fullscreen' as const, icon: <Maximize2 className="h-4 w-4" />, label: '全屏' }]
      : []),
  ]

  return (
    <div className="bg-muted/20 w-32 shrink-0 border-r">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-1.5 p-2">
          {settingsItems.map(item => {
            const isSelected = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors md:min-h-10 md:py-2.5 ${
                  isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
