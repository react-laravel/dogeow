import React from 'react'
import { Clock } from 'lucide-react'
import { getStatusConfig } from '../utils/statusConfig'
import type { SystemStatus } from '../types'

interface SystemStatusItemProps {
  status: SystemStatus
}

function formatSecondaryRight(status: SystemStatus): string | null {
  if (status.responseTimeMs != null) {
    const responseTime = `响应时间: ${status.responseTimeMs}ms`
    if (status.details && status.status === 'online') {
      return `${responseTime} · ${status.details}`
    }

    return responseTime
  }

  if (status.details) {
    return status.details
  }

  return null
}

export const SystemStatusItem: React.FC<SystemStatusItemProps> = ({ status }) => {
  const config = getStatusConfig(status.status)
  const secondaryRight = formatSecondaryRight(status)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="pt-1.5">{config.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{status.name}</h3>
            <p className="shrink-0 text-right text-sm text-gray-600 dark:text-gray-400">
              {status.label}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{status.lastCheck.toLocaleTimeString()}</span>
            </div>
            {secondaryRight ? <span className="truncate text-right">{secondaryRight}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
