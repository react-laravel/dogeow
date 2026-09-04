'use client'

import useSWR from 'swr'
import { Activity, Cloud, ExternalLink, Network, PenTool, Scissors } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { apiRequest } from '@/lib/api'
import type { DashboardHomeLink, DashboardHomeLinkIcon } from '../homeLinks'

const iconMap: Record<DashboardHomeLinkIcon, typeof Activity> = {
  activity: Activity,
  cloud: Cloud,
  network: Network,
  'pen-tool': PenTool,
  scissors: Scissors,
}

export function HomePanel() {
  const { data: links = [], isLoading } = useSWR<DashboardHomeLink[]>(
    '/dashboard/home-links',
    apiRequest,
    { revalidateOnFocus: false }
  )

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">正在加载仪表盘链接...</div>
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5">
      {links.map(link => {
        const Icon = iconMap[link.icon] ?? ExternalLink

        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="group flex min-w-0 flex-col items-center gap-2 text-center outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`打开 ${link.label}`}
          >
            <div
              className={cn(
                'relative flex aspect-square w-full max-w-[104px] items-center justify-center overflow-hidden rounded-[24px] shadow-[0_16px_32px_rgba(15,23,42,0.22)] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98]',
                link.gradientClassName
              )}
            >
              {/* Darken pastel API gradients so white icons stay ≥ 4.5:1 */}
              <div className="absolute inset-0 bg-slate-950/45" />
              <div className="absolute inset-[1px] rounded-[23px] bg-gradient-to-br from-white/8 via-transparent to-black/30" />
              <div className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_8px_18px_rgba(15,23,42,0.45)] ring-1 ring-white/45">
                <Icon className="h-6 w-6 text-white" strokeWidth={2.4} aria-hidden />
              </div>
              <span className="absolute right-2 bottom-2 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 ring-1 ring-white/30 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="line-clamp-2 text-xs font-medium leading-5 text-foreground sm:text-sm">
                {link.label}
              </div>
              <div className="text-muted-foreground line-clamp-1 text-[11px] sm:text-xs">
                {link.caption}
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
