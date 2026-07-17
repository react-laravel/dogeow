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
  apps: '应用展示',
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
    { id: 'apps', icon: <LayoutGrid className="h-4 w-4" />, label: '应用展示' },
    ...(isMdScreen
      ? [{ id: 'fullscreen' as const, icon: <Maximize2 className="h-4 w-4" />, label: '全屏' }]
      : []),
  ]

  return (
    <div className="scrollbar-none bg-muted/20 w-full shrink-0 touch-pan-x overflow-x-auto overscroll-x-contain border-b sm:h-full sm:w-32 sm:touch-auto sm:overflow-y-auto sm:border-r sm:border-b-0">
      <nav
        aria-label="设置分类"
        className="flex min-w-max gap-1 p-2 sm:min-w-0 sm:flex-col sm:gap-1.5"
      >
        {settingsItems.map(item => {
          const isSelected = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isSelected ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors sm:w-full sm:gap-3 sm:py-2.5 ${
                isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium leading-none">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
