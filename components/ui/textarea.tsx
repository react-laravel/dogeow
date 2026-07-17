import * as React from 'react'

import { cn } from '@/lib/helpers'

// ✅ 显式导出 Props 类型
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          'border-input bg-background/75 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 flex field-sizing-content min-h-20 w-full rounded-lg border px-3 py-2 text-base shadow-xs transition-[border-color,box-shadow,background-color] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
