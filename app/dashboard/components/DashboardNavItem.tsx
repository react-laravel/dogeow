import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface DashboardNavItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onSelect: () => void
}

export function DashboardNavItem({ icon: Icon, label, active, onSelect }: DashboardNavItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}
