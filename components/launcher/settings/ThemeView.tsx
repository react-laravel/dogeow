'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { AddThemeDialog } from './AddThemeDialog'
import { SettingsDivider } from './SettingsDivider'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import type { CustomTheme } from '@/app/types'
import { Check, Trash2 } from 'lucide-react'

interface ThemeViewProps {
  onBack: () => void
  currentTheme: string
  customThemes: CustomTheme[]
  onSetTheme: (id: string) => void
  onRemoveTheme: (id: string) => void
  onAddTheme: (name: string, color: string) => void
  showBackButton?: boolean
}

export function ThemeView({
  onBack,
  currentTheme,
  customThemes,
  onSetTheme,
  onRemoveTheme,
  onAddTheme,
  showBackButton = true,
}: ThemeViewProps) {
  const { t } = useTranslation()
  const translatedConfigs = getTranslatedConfigs(t)
  const presetThemes = translatedConfigs.themeColors.filter(
    theme => theme.id && theme.name && theme.color
  )

  return (
    <div className="flex flex-col gap-3">
      {showBackButton && (
        <>
          <BackButton onClick={onBack} className="h-6 w-6 shrink-0" />
          <SettingsDivider />
        </>
      )}

      {/* 预设主题色列表 + 添加按钮 */}
      <div className="flex flex-col gap-2">
        {presetThemes.map(theme => (
          <button
            key={theme.id!}
            onClick={() => onSetTheme(theme.id!)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
              currentTheme === theme.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-muted/70'
            }`}
            title={theme.name}
          >
            <span
              className="relative h-10 w-10 shrink-0 rounded-xl border border-black/10"
              style={{ backgroundColor: theme.color }}
            >
              {currentTheme === theme.id && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white drop-shadow-md" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{theme.name}</span>
          </button>
        ))}
        <AddThemeDialog onAddTheme={onAddTheme} />
      </div>

      {/* 自定义主题 */}
      {customThemes.length > 0 && (
        <>
          <SettingsDivider />
          <div className="flex flex-col gap-2">
            {customThemes.map(theme => (
              <div key={theme.id} className="relative">
                <button
                  onClick={() => onSetTheme(theme.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 pr-12 text-left transition-colors ${
                    currentTheme === theme.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/70'
                  }`}
                  title={theme.name}
                >
                  <span
                    className="relative h-10 w-10 shrink-0 rounded-xl border border-black/10"
                    style={{ backgroundColor: theme.color }}
                  >
                    {currentTheme === theme.id && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{theme.name}</span>
                </button>
                <button
                  onClick={() => onRemoveTheme(theme.id)}
                  className="bg-background hover:bg-destructive hover:text-destructive-foreground absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm"
                  title={`删除 ${theme.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
