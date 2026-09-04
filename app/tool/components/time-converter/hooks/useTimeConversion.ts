import { useState, useCallback } from 'react'
import { format, parse } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ERROR_MESSAGES,
  FLEXIBLE_DATE_REGEX,
  STANDARD_DATE_FORMAT,
  DEFAULT_FORMAT,
  MIN_YEAR,
  MILLISECOND_THRESHOLD,
} from '../constants'
import { cleanTimestamp, standardizeDateTime, validateYear } from '../utils/conversionUtils'

function convertTimestampValue(rawTimestamp: string, dateFormat: string): string {
  if (!rawTimestamp.trim()) {
    return ''
  }

  const cleanTs = cleanTimestamp(rawTimestamp)
  const timestampNum = Number(cleanTs)
  if (isNaN(timestampNum)) {
    return ERROR_MESSAGES.INVALID_TIMESTAMP
  }

  const date =
    cleanTs.length >= MILLISECOND_THRESHOLD ? new Date(timestampNum) : new Date(timestampNum * 1000)

  if (isNaN(date.getTime()) || date.getTime() < 0) {
    return ERROR_MESSAGES.INVALID_TIMESTAMP
  }

  const year = date.getFullYear()
  if (!validateYear(year)) {
    return ERROR_MESSAGES.OUT_OF_RANGE(year)
  }

  return format(date, dateFormat, { locale: zhCN })
}

function convertDateTimeValue(rawDateTime: string): string {
  if (!rawDateTime.trim()) {
    return ''
  }

  if (!FLEXIBLE_DATE_REGEX.test(rawDateTime)) {
    return ERROR_MESSAGES.INVALID_DATE_FORMAT
  }

  const standardDateTimeStr = standardizeDateTime(rawDateTime)
  const dateTimeWithTime = standardDateTimeStr.includes(' ')
    ? standardDateTimeStr
    : `${standardDateTimeStr} 00:00:00`
  const date = parse(dateTimeWithTime, STANDARD_DATE_FORMAT, new Date())

  if (isNaN(date.getTime())) {
    return ERROR_MESSAGES.INVALID_DATE
  }

  const year = date.getFullYear()
  if (year < MIN_YEAR) {
    return ERROR_MESSAGES.OUT_OF_RANGE(year)
  }

  return Math.floor(date.getTime() / 1000).toString()
}

export const useTimeConversion = () => {
  const [timestamp, setTimestamp] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [dateFormat, setDateFormat] = useState(DEFAULT_FORMAT)
  const [inputDateTime, setInputDateTime] = useState('')
  const [outputTimestamp, setOutputTimestamp] = useState('')

  // 时间戳转日期时间（基于当前 state，供手动触发）
  const convertTimestampToDateTime = useCallback(() => {
    try {
      if (!timestamp.trim()) {
        setDateTime(ERROR_MESSAGES.EMPTY_TIMESTAMP)
        return
      }
      setDateTime(convertTimestampValue(timestamp, dateFormat))
    } catch (error) {
      console.error('时间戳转换错误:', error)
      setDateTime(ERROR_MESSAGES.CONVERSION_ERROR)
    }
  }, [timestamp, dateFormat])

  // 日期时间转时间戳（基于当前 state，供手动触发）
  const convertDateTimeToTimestamp = useCallback(() => {
    try {
      if (!inputDateTime.trim()) {
        setOutputTimestamp(ERROR_MESSAGES.EMPTY_DATETIME)
        return
      }
      setOutputTimestamp(convertDateTimeValue(inputDateTime))
    } catch (error) {
      console.error('日期转换错误:', error)
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
      console.error('使用当前时间戳出错:', error)
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
      console.error('使用当前日期时间出错:', error)
      toast.error('获取当前日期时间失败')
    }
  }, [])

  // 输入变化时用新值直接转换，避免读取到旧的 state
  const handleTimestampChange = useCallback(
    (value: string) => {
      setTimestamp(value)
      if (!value.trim()) {
        setDateTime('')
        return
      }
      try {
        setDateTime(convertTimestampValue(value, dateFormat))
      } catch (error) {
        console.error('时间戳转换错误:', error)
        setDateTime(ERROR_MESSAGES.CONVERSION_ERROR)
      }
    },
    [dateFormat]
  )

  const handleInputDateTimeChange = useCallback((value: string) => {
    setInputDateTime(value)
    if (!value.trim()) {
      setOutputTimestamp('')
      return
    }
    try {
      setOutputTimestamp(convertDateTimeValue(value))
    } catch (error) {
      console.error('日期转换错误:', error)
      setOutputTimestamp(ERROR_MESSAGES.CONVERSION_ERROR)
    }
  }, [])

  // 日期格式变化时用当前 timestamp 立即重新格式化
  const handleDateFormatChange = useCallback((value: string) => {
    setDateFormat(value)
    setTimestamp(currentTimestamp => {
      if (currentTimestamp.trim()) {
        try {
          setDateTime(convertTimestampValue(currentTimestamp, value))
        } catch (error) {
          console.error('时间戳转换错误:', error)
          setDateTime(ERROR_MESSAGES.CONVERSION_ERROR)
        }
      }
      return currentTimestamp
    })
  }, [])

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
