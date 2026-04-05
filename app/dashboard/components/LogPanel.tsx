import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingState } from '@/components/ui/loading-state'
import { apiRequest } from '@/lib/api'
import type { LogFile } from '../types'

export function LogPanel() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { data: logFiles, isLoading: logsLoading } = useSWR<LogFile[]>('/logs', apiRequest, {
    revalidateOnFocus: false,
  })

  const logKey = selectedDate ? `/logs/show?date=${selectedDate}&lines=500` : null

  const {
    data: logData,
    isLoading: logContentLoading,
    mutate: mutateLog,
  } = useSWR<{ content: string }>(logKey, apiRequest, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (!hasInitialized && logFiles && logFiles.length > 0 && !selectedDate) {
      const latestFile = [...logFiles].sort((a, b) => b.date.localeCompare(a.date))[0]
      setSelectedDate(latestFile.date)
      setHasInitialized(true)
    }
  }, [logFiles, hasInitialized, selectedDate])

  useEffect(() => {
    if (!selectedDate) return

    let echo: {
      channel: (name: string) => { listen: (event: string, cb: () => void) => void }
      leave: (name: string) => void
    } | null = null

    const setupEcho = async () => {
      try {
        const { getEchoInstance } = await import('@/lib/websocket/echo')
        const instance = getEchoInstance()

        if (instance && typeof instance.channel === 'function') {
          echo = instance as typeof echo
          if (!echo) return
          const channel = echo.channel('log-updates')

          channel.listen('.log.updated', () => {
            mutateLog()
          })
        }
      } catch (error) {
        console.warn('WebSocket 连接失败:', error)
      }
    }

    setupEcho()

    return () => {
      if (echo) {
        echo.leave('log-updates')
      }
    }
  }, [selectedDate, mutateLog])

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="rounded-xl border bg-muted/30 p-3">
        {logsLoading ? (
          <LoadingState message="加载日志列表..." size="sm" />
        ) : logFiles && logFiles.length > 0 ? (
          <Select
            value={selectedDate || ''}
            onValueChange={value => {
              if (value) {
                setSelectedDate(value)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择日志日期" />
            </SelectTrigger>
            <SelectContent>
              {logFiles.map(file => (
                <SelectItem key={file.date} value={file.date}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{file.date}</span>
                    <span className="text-muted-foreground text-xs">({formatSize(file.size)})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-muted-foreground text-sm">暂无可用日志文件</div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
        {selectedDate ? (
          <ScrollArea className="h-[420px] sm:h-[500px]">
            <div className="p-3 sm:p-4">
              {logContentLoading ? (
                <LoadingState message="加载日志内容..." size="sm" />
              ) : logData?.content ? (
                <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                  {logData.content}
                </pre>
              ) : (
                <div className="text-muted-foreground text-sm">暂无日志内容</div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-muted-foreground flex h-[420px] items-center justify-center text-sm">
            请选择日志日期
          </div>
        )}
      </div>
    </div>
  )
}
