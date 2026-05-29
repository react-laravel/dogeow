/**
 * 日期范围选择器组件
 */
import { Label } from '@/components/ui/label'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/helpers'

interface DateRangePickerProps {
  label: string
  fromDate: Date | null
  toDate: Date | null
  includeNull: boolean
  onFromDateChange: (date: Date | undefined) => void
  onToDateChange: (date: Date | undefined) => void
  onIncludeNullChange: (checked: boolean) => void
}

export function DateRangePicker({
  label,
  fromDate,
  toDate,
  includeNull,
  onFromDateChange,
  onToDateChange,
  onIncludeNullChange,
}: DateRangePickerProps) {
  const formatDateValue = (date: Date | null) => (date ? format(date, 'yyyy-MM-dd') : '')
  const parseDateValue = (value: string) => (value ? new Date(`${value}T00:00:00`) : undefined)

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <label
          className={cn(
            'border-input bg-background flex h-9 w-full items-center gap-2 rounded-md border px-2.5 text-sm',
            !fromDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span className="shrink-0 text-xs">开始日期</span>
          <input
            type="date"
            value={formatDateValue(fromDate)}
            onChange={event => onFromDateChange(parseDateValue(event.target.value))}
            className="text-foreground min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>

        <label
          className={cn(
            'border-input bg-background flex h-9 w-full items-center gap-2 rounded-md border px-2.5 text-sm',
            !toDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span className="shrink-0 text-xs">结束日期</span>
          <input
            type="date"
            value={formatDateValue(toDate)}
            onChange={event => onToDateChange(parseDateValue(event.target.value))}
            className="text-foreground min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>

        <div className="mt-1 flex w-full items-center space-x-2">
          <input
            id={`include-null-${label}`}
            type="checkbox"
            checked={includeNull}
            onChange={event => onIncludeNullChange(event.target.checked)}
            className="border-input text-primary focus:ring-primary h-4 w-4 rounded border accent-current"
          />
          <Label htmlFor={`include-null-${label}`} className="cursor-pointer text-xs">
            包含空日期的物品
          </Label>
        </div>
      </div>
    </div>
  )
}
