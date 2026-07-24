'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui/button'

const QQ_NUMBER = '5968251'
const COPY_RESET_MS = 2000

export default function ContactPage() {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(QQ_NUMBER)
      setCopied(true)
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current)
      }
      resetTimerRef.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS)
    } catch {
      toast.error('复制失败，请手动选择号码')
    }
  }

  return (
    <PageContainer maxWidth="4xl" className="space-y-8">
      <h1 className="text-center text-2xl font-bold tracking-tight">联系我们</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">联系方式</h2>
        <div className="bg-muted/40 flex items-center gap-4 rounded-xl px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">QQ号码</p>
            <p className="font-mono text-xl font-semibold tracking-wider tabular-nums sm:text-2xl">
              {QQ_NUMBER}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5"
            aria-label={copied ? '已复制 QQ 号码' : '复制 QQ 号码'}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? '已复制' : '复制'}</span>
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">回复时间</h2>
        <p className="text-muted-foreground">活跃时间 9:30 - 22:30</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">反馈建议</h2>
        <p className="text-muted-foreground">
          我们非常重视您的反馈和建议，您的意见将帮助我们不断改进网站功能和用户体验。
        </p>
        <p className="text-muted-foreground">
          欢迎向我们反馈：功能建议、问题报告、使用体验、改进意见等。
        </p>
      </section>
    </PageContainer>
  )
}
