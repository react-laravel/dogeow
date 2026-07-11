export interface Location {
  country: string
  region: string
  city: string
  isp: string
  timezone: string
}

export interface BasicInfo {
  ip: string
  user_agent: string
}

export interface LocationInfo {
  location: Location
  error?: string
}

export interface LogFile {
  name: string
  date: string
  size: number
  modified: number
}

export const DASHBOARD_SECTIONS = ['home', 'location', 'logs', 'cache', 'ollama'] as const

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number]

export function isDashboardSection(value: string | null): value is DashboardSection {
  return value != null && DASHBOARD_SECTIONS.includes(value as DashboardSection)
}

export interface DashboardCacheItem {
  id: string
  name: string
  description: string
  cache_key: string
  ttl_seconds: number
  ttl_human: string
  has_value: boolean
}

export interface DashboardCacheClearResponse {
  id: string
  cache_key: string
  message: string
  had_value: boolean
  forgotten: boolean
}
