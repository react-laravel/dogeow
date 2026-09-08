'use client'

import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NoteSearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={placeholder ?? label}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-11 w-full rounded-xl bg-background pl-10 pr-11 shadow-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-0.5 size-10 rounded-xl text-muted-foreground"
          aria-label={`清空${label}`}
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
