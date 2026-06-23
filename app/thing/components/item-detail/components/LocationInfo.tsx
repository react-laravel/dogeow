import React, { memo } from 'react'
import { InfoCard } from './InfoCard'
import type { Item } from '@/app/thing/types'

interface LocationInfoProps {
  item: Item
}

export const LocationInfo = memo<LocationInfoProps>(({ item }) => {
  const areaName = item.spot?.room?.area?.name
  const roomName = item.spot?.room?.name
  const spotName = item.spot?.name
  const hasDisplayLocation = areaName || roomName || spotName

  if (!hasDisplayLocation) {
    return (
      <div className="bg-muted flex h-20 items-center justify-center rounded-lg">
        <p className="text-muted-foreground text-sm">未指定存放位置</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {areaName && <InfoCard label="区域" value={areaName} />}
        {roomName && <InfoCard label="房间" value={roomName} />}
        {spotName && <InfoCard label="位置" value={spotName} />}
      </div>
    </div>
  )
})

LocationInfo.displayName = 'LocationInfo'
