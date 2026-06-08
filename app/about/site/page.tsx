'use client'

import React from 'react'
import { Activity, Clock } from 'lucide-react'
import { SystemStatusList } from './components/SystemStatusList'
import { useSystemStatus } from './data/systemStatus'
import { PageContainer } from '@/components/layout'

function formatLastCheckTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const SiteStatusPage: React.FC = () => {
  const { statuses, lastCheck } = useSystemStatus()

  return (
    <PageContainer maxWidth="4xl" className="space-y-6">
      <section className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h1>网站状态</h1>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          实时监控网站各项服务的运行状态和性能指标
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>最近检测：{formatLastCheckTime(lastCheck)}</span>
        </div>
      </section>

      <SystemStatusList statuses={statuses} />
    </PageContainer>
  )
}

export default SiteStatusPage
