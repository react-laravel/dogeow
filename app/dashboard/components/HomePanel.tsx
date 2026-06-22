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
                'relative flex aspect-square w-full max-w-[104px] items-center justify-center overflow-hidden rounded-[24px] shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98]',
                link.gradientClassName
              )}
            >
              <div className="absolute inset-[1px] rounded-[23px] bg-gradient-to-br from-white/28 via-white/10 to-transparent" />
              <div className="absolute inset-x-3 top-2 h-5 rounded-full bg-white/25 blur-xl" />
              <div className="relative z-[1] flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/14 shadow-[inset_0_1px_1px_rgba(255,255,255,0.28)] ring-1 ring-white/20 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-white drop-shadow-[0_2px_8px_rgba(15,23,42,0.2)]" />
              </div>
              <span className="absolute right-2 bottom-2 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white/90 opacity-0 ring-1 ring-white/18 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
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
