'use client'

import { useId, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/helpers'

interface ReaderChoiceGroupProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; preview?: ReactNode; style?: CSSProperties }[]
  columns?: 2 | 3 | 5
  hideLabel?: boolean
}

export function ReaderChoiceGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  columns = 3,
  hideLabel = false,
}: ReaderChoiceGroupProps<T>) {
  const name = useId()
  return (
    <fieldset className="min-w-0 space-y-2.5">
      <legend className={cn('text-sm font-medium', hideLabel && 'sr-only')}>{label}</legend>
      <div
        className={cn(
          'grid gap-2',
          { 2: 'grid-cols-2', 3: 'grid-cols-3', 5: 'grid-cols-5' }[columns]
        )}
      >
        {options.map(option => (
          <label key={option.value} className="relative min-w-0 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className="flex min-h-11 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-1.5 py-2.5 text-center text-sm text-muted-foreground transition-colors hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-medium peer-checked:text-primary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
              style={option.style}
            >
              {option.preview}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
