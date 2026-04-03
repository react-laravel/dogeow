import type { LucideIcon } from 'lucide-react'
import { Activity, Cloud, Globe, PenTool } from 'lucide-react'

export interface DashboardHomeLink {
  id: string
  label: string
  caption: string
  href: string
  icon: LucideIcon
  gradientClassName: string
}

export const DASHBOARD_HOME_LINKS: DashboardHomeLink[] = [
  {
    id: 'vnstat',
    label: 'vnStat',
    caption: 'vnstat.dogeow.com',
    href: 'https://vnstat.dogeow.com',
    icon: Activity,
    gradientClassName: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500',
  },
  {
    id: 'canvas',
    label: 'Canvas',
    caption: 'canvas.dogeow.com',
    href: 'https://canvas.dogeow.com/',
    icon: PenTool,
    gradientClassName: 'bg-gradient-to-br from-orange-400 via-amber-500 to-rose-500',
  },
  {
    id: 'upyun-web',
    label: 'UpYun Web',
    caption: 'upyun-web.dogeow.com',
    href: 'https://upyun-web.dogeow.com/',
    icon: Cloud,
    gradientClassName: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
  },
  {
    id: 'ip-checker',
    label: 'IP Checker',
    caption: 'ip.dogeow.com',
    href: 'https://ip.dogeow.com/',
    icon: Globe,
    gradientClassName: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500',
  },
]
