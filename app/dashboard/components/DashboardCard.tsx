import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface DashboardCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  className,
  children,
}: DashboardCardProps) {
  return (
    <section className={cn('bg-background rounded-2xl border p-4 shadow-sm sm:p-5', className)}>
      <div className="mb-4 flex items-start gap-3 border-b pb-4">
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
