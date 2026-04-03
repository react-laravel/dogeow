import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { format, parse } from 'date-fns'
import { logger } from '@/lib/logger'
import { zhCN } from 'date-fns/locale'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
import { logger } from '@/lib/logger'
  ERROR_MESSAGES,
  FLEXIBLE_DATE_REGEX,
  STANDARD_DATE_FORMAT,
  DEFAULT_FORMAT,
  MIN_YEAR,
  MILLISECOND_THRESHOLD,
} from '../constants'
import { cleanTimestamp, standardizeDateTime, validateYear } from '../utils/conversionUtils'
import { logger } from '@/lib/logger'

export const useTimeConversion = () => {
  const [timestamp, setTimestamp] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [dateFormat, setDateFormat] = useState(DEFAULT_FORMAT)
  const [inputDateTime, setInputDateTime] = useState('')
  const [outputTimestamp, setOutputTimestamp] = useState('')

  // 时间戳转日期时间
  const convertTimestampToDateTime = useCallback(() => {
    try {
      if (!timestamp.trim()) {
        setDateTime(ERROR_MESSAGES.EMPTY_TIMESTAMP)
        return
      }
      const cleanTs = cleanTimestamp(timestamp)
      const timestampNum = Number(cleanTs)
      if (isNaN(timestampNum)) {
        setDateTime(ERROR_MESSAGES.INVALID_TIMESTAMP)
        return
      }
      const date =
        cleanTs.length >= MILLISECOND_THRESHOLD
          ? new Date(timestampNum)
          : new Date(timestampNum * 1000)
      if (isNaN(date.getTime()) || date.getTime() < 0) {
        setDateTime(ERROR_MESSAGES.INVALID_TIMESTAMP)
        return
      }
      const year = date.getFullYear()
      if (!validateYear(year)) {
        setDateTime(ERROR_MESSAGES.OUT_OF_RANGE(year))
        return
      }
      const result = format(date, dateFormat, { locale: zhCN })
      setDateTime(result)
    } catch (error) {
      logger.error('时间戳转换错误:', error)
      setDateTime(ERROR_MESSAGES.CONVERSION_ERROR)
    }
  }, [timestamp, dateFormat])

  // 日期时间转时间戳
  const convertDateTimeToTimestamp = useCallback(() => {
    try {
      if (!inputDateTime.trim()) {
        setOutputTimestamp(ERROR_MESSAGES.EMPTY_DATETIME)
        return
      }
      if (!FLEXIBLE_DATE_REGEX.test(inputDateTime)) {
        setOutputTimestamp(ERROR_MESSAGES.INVALID_DATE_FORMAT)
        return
      }
      const standardDateTimeStr = standardizeDateTime(inputDateTime)
      const dateTimeWithTime = standardDateTimeStr.includes(' ')
        ? standardDateTimeStr
        : `${standardDateTimeStr} 00:00:00`
      const date = parse(dateTimeWithTime, STANDARD_DATE_FORMAT, new Date())
      if (isNaN(date.getTime())) {
        setOutputTimestamp(ERROR_MESSAGES.INVALID_DATE)
        return
      }
      const year = date.getFullYear()
      if (year < MIN_YEAR) {
        setOutputTimestamp(ERROR_MESSAGES.OUT_OF_RANGE(year))
        return
      }
      const result = Math.floor(date.getTime() / 1000).toString()
      setOutputTimestamp(result)
    } catch (error) {
      logger.error('日期转换错误:', error)
      setOutputTimestamp(ERROR_MESSAGES.CONVERSION_ERROR)
    }
  }, [inputDateTime])

  // 使用当前时间戳
  const useCurrentTimestamp = useCallback(() => {
    try {
      const now = new Date()
      const current = Math.floor(now.getTime() / 1000)
      const result = format(now, dateFormat, { locale: zhCN })
      setTimestamp(current.toString())
      setDateTime(result)
      toast.success('已使用当前时间', {
        description: `${current} → ${result}`,
      })
    } catch (error) {
      logger.error('使用当前时间戳出错:', error)
      toast.error('获取当前时间戳失败')
    }
  }, [dateFormat])

  // 使用当前日期时间
  const useCurrentDateTime = useCallback(() => {
    try {
      const now = new Date()
      const formattedDate = format(now, DEFAULT_FORMAT, { locale: zhCN })
      const result = Math.floor(now.getTime() / 1000).toString()
      setInputDateTime(formattedDate)
      setOutputTimestamp(result)
      toast.success('已使用当前时间', {
        description: `${formattedDate} → ${result}`,
      })
    } catch (error) {
      logger.error('使用当前日期时间出错:', error)
      toast.error('获取当前日期时间失败')
    }
  }, [])

  // 自动转换的时间戳
  const handleTimestampChange = useCallback(
    (value: string) => {
      setTimestamp(value)
      // 空时清空结果
      if (!value.trim()) {
        setDateTime('')
        return
      }
      convertTimestampToDateTime()
    },

    [convertTimestampToDateTime]
  )

  // 自动转换的日期
  const handleInputDateTimeChange = useCallback(
    (value: string) => {
      setInputDateTime(value)
      if (!value.trim()) {
        setOutputTimestamp('')
        return
      }
      convertDateTimeToTimestamp()
    },

    [convertDateTimeToTimestamp]
  )

  // 日期格式变化时重新格式化已有结果
  const handleDateFormatChange = useCallback(
    (value: string) => {
      setDateFormat(value)
      if (timestamp.trim()) {
        convertTimestampToDateTime()
      }
    },
    [timestamp, convertTimestampToDateTime]
  )

  return {
    timestamp,
    setTimestamp,
    dateTime,
    dateFormat,
    setDateFormat,
    inputDateTime,
    setInputDateTime,
    outputTimestamp,
    convertTimestampToDateTime,
    convertDateTimeToTimestamp,
    useCurrentTimestamp,
    useCurrentDateTime,
    handleTimestampChange,
    handleInputDateTimeChange,
    handleDateFormatChange,
  }
}
