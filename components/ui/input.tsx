import * as React from 'react'

import { cn } from '@/lib/helpers'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          'border-input bg-background/75 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 flex h-10 w-full rounded-lg border px-3 py-2 text-base shadow-xs transition-[border-color,box-shadow,background-color] outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
