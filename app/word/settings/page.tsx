'use client'

import { SettingsForm } from '../components/SettingsForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/layout'

export default function SettingsPage() {
  return (
    <PageContainer maxWidth="2xl" className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/word">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      {/* 学习设置 */}
      <SettingsForm />
    </PageContainer>
  )
}
