export type DashboardHomeLinkIcon = 'activity' | 'cloud' | 'network' | 'pen-tool' | 'scissors'

export interface DashboardHomeLink {
  id: string
  label: string
  caption: string
  href: string
  icon: DashboardHomeLinkIcon
  gradientClassName: string
}
