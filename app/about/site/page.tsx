'use client'

import React from 'react'
import { Activity } from 'lucide-react'
import { SystemStatusList } from './components/SystemStatusList'
import { useSystemStatus } from './data/systemStatus'
import { PageContainer } from '@/components/layout'

const SiteStatusPage: React.FC = () => {
  const systemStatus = useSystemStatus()

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
      </section>

      <SystemStatusList statuses={systemStatus} />
    </PageContainer>
  )
}

export default SiteStatusPage
