import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoadingSpinner } from './loading-spinner'
import { cn } from '@/lib/helpers'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-border/80 bg-background/80 shadow-xs hover:border-primary/25 hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/75',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3.5',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-xl px-6 has-[>svg]:px-4',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const isDisabled = disabled || loading
  const resolvedTabIndex = isDisabled ? -1 : props.tabIndex

  // 当使用 asChild 时，不能添加额外的元素，直接传递 children
  if (asChild) {
    return (
      <Comp
        {...props}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
          isDisabled && 'pointer-events-none opacity-50'
        )}
        disabled={isDisabled}
        tabIndex={resolvedTabIndex}
      >
        {children}
      </Comp>
    )
  }

  // 正常的 button 元素可以包含多个子元素
  return (
    <Comp
      {...props}
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        isDisabled && 'pointer-events-none opacity-50'
      )}
      disabled={isDisabled}
      tabIndex={resolvedTabIndex}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" aria-label="加载中" />}
      {loading && loadingText ? loadingText : children}
    </Comp>
  )
}

export { Button, buttonVariants }
