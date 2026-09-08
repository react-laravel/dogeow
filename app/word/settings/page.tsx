'use client'

import { SettingsForm } from '../components/SettingsForm'
import { WordPageHeader } from '../components/WordPageHeader'
import { PageContainer } from '@/components/layout'

export default function SettingsPage() {
  return (
    <PageContainer maxWidth="3xl" className="space-y-6">
      <WordPageHeader title="设置" description="按自己的节奏，安排每天的学习量。" />
      <SettingsForm />
    </PageContainer>
  )
}
