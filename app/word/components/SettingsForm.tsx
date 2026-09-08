'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { mutate as mutateCache } from 'swr'
import { useWordSettings, updateWordSettings } from '../hooks/useWord'
import { useWordStore } from '../stores/wordStore'
import type { UserWordSetting } from '../types'

const settingsSchema = z.object({
  daily_new_words: z
    .number({ invalid_type_error: '请输入 1–100 之间的整数' })
    .int('请输入整数')
    .min(1, '每天至少学习 1 个新词')
    .max(100, '每天最多学习 100 个新词'),
  review_multiplier: z.number().int().min(1).max(3),
  is_auto_pronounce: z.boolean(),
})
type SettingsValues = z.infer<typeof settingsSchema>

export function SettingsForm() {
  const { data: settings, isLoading, error, mutate } = useWordSettings()
  if (isLoading)
    return (
      <div className="flex justify-center rounded-2xl border p-10">
        <LoadingSpinner />
      </div>
    )
  if (error || !settings)
    return (
      <div className="bg-card space-y-4 rounded-2xl border p-6 text-center">
        <p className="text-muted-foreground">暂时无法加载学习设置</p>
        <Button variant="outline" onClick={() => void mutate()}>
          重新加载
        </Button>
      </div>
    )
  return (
    <SettingsEditor
      key={settings.id}
      settings={settings}
      onSaved={updated => {
        void mutate(updated, { revalidate: false })
      }}
    />
  )
}

function SettingsEditor({
  settings,
  onSaved,
}: {
  settings: UserWordSetting
  onSaved: (settings: UserWordSetting) => void
}) {
  const [saveError, setSaveError] = useState(false)
  const setSettings = useWordStore(state => state.setSettings)
  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      daily_new_words: settings.daily_new_words,
      review_multiplier: settings.review_multiplier,
      is_auto_pronounce: settings.is_auto_pronounce,
    },
  })
  const values = useWatch({ control })
  const daily = Number.isFinite(values.daily_new_words) ? values.daily_new_words! : 0
  const save = handleSubmit(async data => {
    setSaveError(false)
    try {
      const result = await updateWordSettings(data)
      const planChanged =
        settings.daily_new_words !== result.setting.daily_new_words ||
        settings.review_multiplier !== result.setting.review_multiplier ||
        settings.current_book_id !== result.setting.current_book_id
      if (planChanged) {
        useWordStore.getState().reset()
        void mutateCache('/word/daily', undefined, { revalidate: false })
        void mutateCache('/word/review', undefined, { revalidate: false })
      }
      setSettings(result.setting)
      onSaved(result.setting)
      reset({
        daily_new_words: result.setting.daily_new_words,
        review_multiplier: result.setting.review_multiplier,
        is_auto_pronounce: result.setting.is_auto_pronounce,
      })
      toast.success('学习设置已保存')
    } catch {
      setSaveError(true)
      toast.error('保存失败，请重试')
    }
  })

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <fieldset
        disabled={isSubmitting}
        className="bg-card min-w-0 divide-y overflow-hidden rounded-2xl border"
      >
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">每日计划</h2>
            <p className="text-muted-foreground mt-1 text-sm">从少量开始，让学习更容易坚持。</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="daily_new_words">每日新词</Label>
            <div className="flex items-center gap-2">
              <Input
                id="daily_new_words"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                className="w-20 text-center tabular-nums"
                aria-invalid={!!errors.daily_new_words}
                aria-describedby={errors.daily_new_words ? 'daily-error' : undefined}
                {...register('daily_new_words', { valueAsNumber: true })}
              />
              <span className="text-muted-foreground text-sm">个</span>
            </div>
          </div>
          {errors.daily_new_words && (
            <p id="daily-error" role="alert" className="text-destructive text-sm">
              {errors.daily_new_words.message}
            </p>
          )}
          <div className="grid grid-cols-4 gap-2" aria-label="每日新词快捷选择">
            {[5, 10, 20, 30].map(count => (
              <Button
                key={count}
                type="button"
                variant={daily === count ? 'secondary' : 'outline'}
                aria-pressed={daily === count}
                onClick={() =>
                  setValue('daily_new_words', count, { shouldDirty: true, shouldValidate: true })
                }
              >
                {count} 个
              </Button>
            ))}
          </div>
          <fieldset className="min-w-0 space-y-3">
            <legend className="mb-3 text-sm font-medium">复习强度</legend>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((multiple, index) => (
                <label key={multiple} className="relative cursor-pointer">
                  <input
                    type="radio"
                    className="peer sr-only"
                    value={multiple}
                    checked={values.review_multiplier === multiple}
                    onChange={() => setValue('review_multiplier', multiple, { shouldDirty: true })}
                    name="review_multiplier"
                  />
                  <span className="peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-ring flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm peer-focus-visible:ring-2">
                    <span className="font-medium">{['轻量', '标准', '加强'][index]}</span>
                    <span className="text-xs opacity-75">
                      {multiple} 倍 · {Math.max(0, daily * multiple)} 词
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-muted-foreground bg-muted/50 rounded-xl px-4 py-3 text-sm leading-relaxed">
            每日计划：{Math.max(0, daily)} 个新词 +{' '}
            {Math.max(0, daily * (values.review_multiplier ?? 2))}{' '}
            个复习词。实际数量根据词书和待复习内容安排。
          </p>
        </div>
        <div className="flex items-center gap-3 p-5 sm:p-6">
          <Volume2 className="text-muted-foreground size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <Label htmlFor="is_auto_pronounce">自动发音</Label>
            <p className="text-muted-foreground mt-1 text-sm">学习新卡片时，自动朗读单词。</p>
          </div>
          <Switch
            id="is_auto_pronounce"
            checked={values.is_auto_pronounce}
            onCheckedChange={checked =>
              setValue('is_auto_pronounce', checked, { shouldDirty: true })
            }
          />
        </div>
      </fieldset>
      <div className="bg-background/95 sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 backdrop-blur">
        <p
          role="status"
          className={
            saveError
              ? 'text-destructive flex items-center gap-1.5 text-sm'
              : 'text-muted-foreground flex items-center gap-1.5 text-sm'
          }
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            !isDirty && <Check className="text-primary size-4" />
          )}
          {isSubmitting
            ? '保存中…'
            : saveError
              ? '保存失败，更改已保留'
              : isDirty
                ? '有未保存的更改'
                : '已保存'}
        </p>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          保存设置
        </Button>
      </div>
    </form>
  )
}
