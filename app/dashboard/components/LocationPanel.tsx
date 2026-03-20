import useSWR from 'swr'
import { Globe, Monitor, Smartphone } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { getBrowserInfo, getOSInfo } from '@/lib/utils/userAgent'
import { LoadingState } from '@/components/ui/loading-state'
import type { BasicInfo, LocationInfo } from '../types'

export function LocationPanel() {
  const { data: basicInfo, isLoading: basicLoading } = useSWR<BasicInfo>(
    '/client-basic-info',
    apiRequest
  )

  const {
    data: locationInfo,
    isLoading: locationLoading,
    error: locationError,
  } = useSWR<LocationInfo>('/client-location-info', apiRequest)

  const browserInfo = getBrowserInfo(basicInfo?.user_agent)
  const osInfo = getOSInfo(basicInfo?.user_agent)
  const BrowserIcon = browserInfo.Icon
  const OSIcon = osInfo.Icon

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Monitor className="h-3.5 w-3.5" />
          IP 地址
        </div>
        <div className="text-sm break-all">
          {basicLoading ? '加载中...' : basicInfo?.ip || '未知'}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Globe className="h-3.5 w-3.5" />
          地理位置
        </div>
        <div className="text-sm">
          {locationLoading ? (
            <LoadingState message="正在获取地理位置信息..." size="sm" />
          ) : locationError ? (
            <div className="text-destructive">地理位置信息获取失败，请稍后重试</div>
          ) : locationInfo?.location ? (
            <div className="space-y-1">
              <div>国家/地区：{locationInfo.location.country || '未知'}</div>
              <div>省份：{locationInfo.location.region || '未知'}</div>
              <div>城市：{locationInfo.location.city || '未知'}</div>
              <div>网络服务商：{locationInfo.location.isp || '未知'}</div>
              <div>时区：{locationInfo.location.timezone || '未知'}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">暂无地理位置信息</div>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Smartphone className="h-3.5 w-3.5" />
          浏览器信息
        </div>

        {basicLoading ? (
          <div className="text-sm">加载中...</div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-background text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1">
                <BrowserIcon className="h-3.5 w-3.5" />
                {browserInfo.label}
              </span>
              <span className="bg-background text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1">
                <OSIcon className="h-3.5 w-3.5" />
                {osInfo.label}
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed break-all">
              {basicInfo?.user_agent || '未知 User-Agent'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
