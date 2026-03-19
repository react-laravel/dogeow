'use client'

import React, { memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Calendar, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopyFeedback } from './time-converter/hooks/useCopyFeedback'
import { useCurrentTime } from './time-converter/hooks/useCurrentTime'
import { useTimeConversion } from './time-converter/hooks/useTimeConversion'
import { TimestampToDateTab } from './time-converter/components/TimestampToDateTab'
import { DateToTimestampTab } from './time-converter/components/DateToTimestampTab'
import type { CopyType } from './time-converter/constants'

interface TimeConverterProps {}

const TimeConverterContent: React.FC<TimeConverterProps> = () => {
  const { currentTimestamp, currentDateTime } = useCurrentTime()
  const { copyStates, copyToClipboard, cleanup } = useCopyFeedback()
  const {
    timestamp,
    setTimestamp,
    dateTime,
    dateFormat,
    setDateFormat,
    inputDateTime,
    setInputDateTime,
    outputTimestamp,
    useCurrentTimestamp,
    useCurrentDateTime,
    handleTimestampChange,
    handleInputDateTimeChange,
    handleDateFormatChange,
  } = useTimeConversion()

  React.useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return (
    <div className="space-y-4">
      {/* 当前时间 - 紧凑单行 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          当前时间
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">时间戳</span>
            <span className="font-mono text-xs font-semibold">{currentTimestamp}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-6 w-6 hover:bg-muted/60 hover:text-foreground"
              onClick={() => copyToClipboard(currentTimestamp.toString(), 'timestamp' as CopyType)}
            >
              {copyStates.timestamp ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">日期</span>
            <span className="font-mono text-xs font-semibold">{currentDateTime}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-6 w-6 hover:bg-muted/60 hover:text-foreground"
              onClick={() => copyToClipboard(currentDateTime, 'dateTime' as CopyType)}
            >
              {copyStates.dateTime ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="timestamp-to-date" className="space-y-4">
        <TabsList className="bg-muted/40 grid h-9 w-full grid-cols-2 p-1">
          <TabsTrigger value="timestamp-to-date" className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            时间戳转日期
          </TabsTrigger>
          <TabsTrigger value="date-to-timestamp" className="flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            日期转时间戳
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timestamp-to-date" className="space-y-4">
          <TimestampToDateTab
            timestamp={timestamp}
            dateTime={dateTime}
            dateFormat={dateFormat}
            copyStates={copyStates}
            onTimestampChange={handleTimestampChange}
            onDateFormatChange={handleDateFormatChange}
            onUseCurrent={useCurrentTimestamp}
            onCopy={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="date-to-timestamp" className="space-y-4">
          <DateToTimestampTab
            inputDateTime={inputDateTime}
            outputTimestamp={outputTimestamp}
            copyStates={copyStates}
            onInputDateTimeChange={handleInputDateTimeChange}
            onUseCurrent={useCurrentDateTime}
            onCopy={copyToClipboard}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const TimeConverter = memo<TimeConverterProps>(TimeConverterContent, () => true)
TimeConverter.displayName = 'TimeConverter'

export default TimeConverter
