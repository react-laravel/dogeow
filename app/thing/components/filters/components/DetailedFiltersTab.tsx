import React, { memo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '../DateRangePicker'
import type { FilterState } from '../types'
import type { Area, Room, Spot } from '@/app/thing/types'

interface DetailedFiltersTabProps {
  filters: FilterState
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  onPurchaseDateFromChange: (date: Date | undefined) => void
  onPurchaseDateToChange: (date: Date | undefined) => void
  onIncludeNullPurchaseDateChange: (checked: boolean) => void
  onExpiryDateFromChange: (date: Date | undefined) => void
  onExpiryDateToChange: (date: Date | undefined) => void
  onIncludeNullExpiryDateChange: (checked: boolean) => void
  onPriceFromChange: (value: string) => void
  onPriceToChange: (value: string) => void
  onAreaIdChange: (value: string) => void
  onRoomIdChange: (value: string) => void
  onSpotIdChange: (value: string) => void
}

export const DetailedFiltersTab = memo<DetailedFiltersTabProps>(
  ({
    filters,
    areas,
    rooms,
    spots,
    onPurchaseDateFromChange,
    onPurchaseDateToChange,
    onIncludeNullPurchaseDateChange,
    onExpiryDateFromChange,
    onExpiryDateToChange,
    onIncludeNullExpiryDateChange,
    onPriceFromChange,
    onPriceToChange,
    onAreaIdChange,
    onRoomIdChange,
    onSpotIdChange,
  }) => {
    const toSelectValue = (value: string | number | null | undefined) =>
      value === null || value === undefined || value === '' ? 'all' : value.toString()
    const selectClassName =
      'bg-background border-input text-foreground h-11 w-full rounded-md border px-3 text-sm disabled:opacity-60'

    return (
      <div className="space-y-6">
        <DateRangePicker
          label="购买日期"
          fromDate={filters.purchase_date_from}
          toDate={filters.purchase_date_to}
          includeNull={filters.include_null_purchase_date}
          onFromDateChange={onPurchaseDateFromChange}
          onToDateChange={onPurchaseDateToChange}
          onIncludeNullChange={onIncludeNullPurchaseDateChange}
        />

        <DateRangePicker
          label="过期日期"
          fromDate={filters.expiry_date_from}
          toDate={filters.expiry_date_to}
          includeNull={filters.include_null_expiry_date}
          onFromDateChange={onExpiryDateFromChange}
          onToDateChange={onExpiryDateToChange}
          onIncludeNullChange={onIncludeNullExpiryDateChange}
        />

        <div className="space-y-3">
          <Label className="text-base font-medium">价格范围</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="最低价"
              value={filters.price_from}
              onChange={e => onPriceFromChange(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高价"
              value={filters.price_to}
              onChange={e => onPriceToChange(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">位置</Label>
          <div className="space-y-3">
            <select
              value={toSelectValue(filters.area_id)}
              onChange={event => onAreaIdChange(event.target.value)}
              className={selectClassName}
              aria-label="区域"
            >
              <option value="all">全部区域</option>
              {areas.map((area: Area) => (
                <option key={area.id} value={area.id.toString()}>
                  {area.name}
                </option>
              ))}
            </select>
            <select
              value={toSelectValue(filters.room_id)}
              onChange={event => onRoomIdChange(event.target.value)}
              disabled={
                filters.area_id === 'all' || filters.area_id === null || filters.area_id === ''
              }
              className={selectClassName}
              aria-label="房间"
            >
              <option value="all">全部房间</option>
              {rooms
                .filter(
                  room =>
                    filters.area_id === 'all' ||
                    room.area_id?.toString() === filters.area_id?.toString()
                )
                .map((room: Room) => (
                  <option key={room.id} value={room.id.toString()}>
                    {room.name}
                  </option>
                ))}
            </select>
            <select
              value={toSelectValue(filters.spot_id)}
              onChange={event => onSpotIdChange(event.target.value)}
              disabled={
                filters.room_id === 'all' || filters.room_id === null || filters.room_id === ''
              }
              className={selectClassName}
              aria-label="位置"
            >
              <option value="all">全部位置</option>
              {spots
                .filter(
                  spot =>
                    filters.room_id === 'all' ||
                    spot.room_id?.toString() === filters.room_id?.toString()
                )
                .map((spot: Spot) => (
                  <option key={spot.id} value={spot.id.toString()}>
                    {spot.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    )
  }
)

DetailedFiltersTab.displayName = 'DetailedFiltersTab'
