import { format } from 'date-fns'
import { logger } from '@/lib/logger'

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), 'yyyy-MM-dd')
  } catch (e) {
    logger.error('Invalid date string:', dateString, e)
    return '无效日期'
  }
}
