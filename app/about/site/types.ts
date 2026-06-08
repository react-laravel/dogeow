export interface DevLogEntry {
  id: string
  date: Date
  version?: string
  type: 'feature' | 'bugfix' | 'update' | 'release' | 'milestone'
  title: string
  description: string
  author?: string
  tags?: string[]
}

export interface SystemStatus {
  name: string
  label: string
  status: 'online' | 'offline' | 'warning' | 'error'
  icon: React.ReactNode
  responseTimeMs?: number
  details?: string
}
