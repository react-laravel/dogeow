'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import { Globe, Plus, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/helpers'

interface City {
  name: string
  timezone: string
  label: string
}

const POPULAR_CITIES: City[] = [
  { name: 'Beijing', timezone: 'Asia/Shanghai', label: '北京' },
  { name: 'Shanghai', timezone: 'Asia/Shanghai', label: '上海' },
  { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', label: '香港' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', label: '东京' },
  { name: 'Seoul', timezone: 'Asia/Seoul', label: '首尔' },
  { name: 'Singapore', timezone: 'Asia/Singapore', label: '新加坡' },
  { name: 'Bangkok', timezone: 'Asia/Bangkok', label: '曼谷' },
  { name: 'Dubai', timezone: 'Asia/Dubai', label: '迪拜' },
  { name: 'London', timezone: 'Europe/London', label: '伦敦' },
  { name: 'Paris', timezone: 'Europe/Paris', label: '巴黎' },
  { name: 'Berlin', timezone: 'Europe/Berlin', label: '柏林' },
  { name: 'Moscow', timezone: 'Europe/Moscow', label: '莫斯科' },
  { name: 'New York', timezone: 'America/New_York', label: '纽约' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', label: '洛杉矶' },
  { name: 'San Francisco', timezone: 'America/Los_Angeles', label: '旧金山' },
  { name: 'Chicago', timezone: 'America/Chicago', label: '芝加哥' },
  { name: 'Toronto', timezone: 'America/Toronto', label: '多伦多' },
  { name: 'Sydney', timezone: 'Australia/Sydney', label: '悉尼' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', label: '孟买' },
  { name: 'Jakarta', timezone: 'Asia/Jakarta', label: '雅加达' },
  { name: 'Taipei', timezone: 'Asia/Taipei', label: '台北' },
]

const STORAGE_KEY = 'world-clock-cities'

const loadSavedCities = (): City[] => {
  if (typeof window === 'undefined') return POPULAR_CITIES.slice(0, 4)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as City[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return POPULAR_CITIES.slice(0, 4)
}

const saveCities = (cities: City[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
}

interface CityCardProps {
  city: City
  onRemove: (city: City) => void
}

const CityCard = memo<CityCardProps>(({ city, onRemove }) => {
  const [time, setTime] = useState(() => formatTime(new Date(), city.timezone))

  useEffect(() => {
    const tick = () => setTime(formatTime(new Date(), city.timezone))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [city.timezone])

  const { date, timeStr } = time

  return (
    <div className="border-border/60 bg-muted/20 relative rounded-lg border px-4 py-3">
      <button
        type="button"
        onClick={() => onRemove(city)}
        className="text-muted-foreground hover:text-foreground absolute right-2 top-2 rounded-xs p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        aria-label={`移除 ${city.label}`}
      >
        <X className="h-3 w-3" />
      </button>
      <div className="pr-5">
        <div className="text-muted-foreground mb-1 text-xs">{city.label}</div>
        <div className="font-mono text-xl font-bold tracking-tight">{timeStr}</div>
        <div className="text-muted-foreground mt-0.5 text-xs">{date}</div>
      </div>
    </div>
  )
})
CityCard.displayName = 'CityCard'

function formatTime(date: Date, timezone: string): { timeStr: string; date: string } {
  try {
    const timeStr = date.toLocaleTimeString('zh-CN', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const dateStr = date.toLocaleDateString('zh-CN', {
      timeZone: timezone,
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    })
    return { timeStr, date: dateStr }
  } catch {
    return { timeStr: '--:--:--', date: '--/--' }
  }
}

const WorldClockContent: React.FC = () => {
  const [cities, setCities] = useState<City[]>(loadSavedCities)
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    saveCities(cities)
  }, [cities])

  const availableCities = POPULAR_CITIES.filter(
    c => !cities.some(cc => cc.name === c.name && cc.timezone === c.timezone)
  )

  const filteredCities = search
    ? availableCities.filter(
        c =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase())
      )
    : availableCities

  const handleAdd = useCallback((city: City) => {
    setCities(prev => [...prev, city])
    setSearch('')
    setShowPicker(false)
  }, [])

  const handleRemove = useCallback((city: City) => {
    setCities(prev => prev.filter(c => !(c.name === city.name && c.timezone === city.timezone)))
  }, [])

  return (
    <div className="space-y-6">
      {/* 当前时区 */}
      <Card className="border-border/60 bg-muted/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-xs">
              本地时间 · {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </div>
          <div className="mt-1 font-mono text-3xl font-bold tracking-tight">
            {formatTime(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone).timeStr}
          </div>
        </CardContent>
      </Card>

      {/* 世界城市时钟 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">世界时钟</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowPicker(v => !v)}
          >
            <Plus className="h-3 w-3" />
            添加城市
          </Button>
        </div>

        {/* 城市选择器 */}
        {showPicker && (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3">
              <div className="relative mb-2">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                <Input
                  placeholder="搜索城市..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                  autoFocus
                />
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {filteredCities.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-center text-xs">未找到城市</p>
                ) : (
                  filteredCities.map(city => (
                    <button
                      key={`${city.name}-${city.timezone}`}
                      type="button"
                      onClick={() => handleAdd(city)}
                      className="hover:bg-muted w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors"
                    >
                      <span className="font-medium">{city.label}</span>
                      <span className="text-muted-foreground ml-1.5">{city.name}</span>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 城市卡片列表 */}
        <div className="group grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {cities.map(city => (
            <CityCard key={`${city.name}-${city.timezone}`} city={city} onRemove={handleRemove} />
          ))}
        </div>
      </div>
    </div>
  )
}

const WorldClock = memo(WorldClockContent, () => true)
WorldClock.displayName = 'WorldClock'

export default WorldClock
