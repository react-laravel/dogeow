'use client'

import type { Item } from '@/app/thing/types'
import { formatDate } from '../utils/dateUtils'
import { ImageGallery } from './ImageGallery'
import { InfoCard } from './InfoCard'
import { LocationInfo } from './LocationInfo'
import { TagsDisplay } from './TagsDisplay'
import { TimeInfo } from './TimeInfo'

interface ItemDetailViewContentProps {
  activeImageIndex: number
  hasDescription: boolean
  item: Item
  onImageIndexChange: (index: number) => void
  trimmedDescription?: string
}

export function ItemDetailViewContent({
  activeImageIndex,
  hasDescription,
  item,
  onImageIndexChange,
  trimmedDescription,
}: ItemDetailViewContentProps) {
  return (
    <div className="mt-6 space-y-6">
      {item.images && item.images.length > 0 ? (
        <ImageGallery
          images={item.images}
          itemName={item.name}
          activeIndex={activeImageIndex}
          onIndexChange={onImageIndexChange}
        />
      ) : null}

      {item.tags && item.tags.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">标签</h3>
          <TagsDisplay tags={item.tags} />
        </div>
      ) : null}

      {hasDescription ? (
        <div className="bg-muted/30 rounded-lg p-3">
          <h3 className="text-muted-foreground mb-1 text-sm font-medium">描述</h3>
          <p className="text-xs">{trimmedDescription}</p>
        </div>
      ) : null}

      {(item.quantity > 1 || item.purchase_price || item.purchase_date) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {item.quantity > 1 && <InfoCard label="数量" value={item.quantity} />}
          {item.purchase_price && <InfoCard label="价格" value={`¥${item.purchase_price}`} />}
          {item.purchase_date && (
            <InfoCard label="购买日期" value={formatDate(item.purchase_date)} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-base font-semibold">时间信息</h3>
          <TimeInfo item={item} />
        </div>
        <div className="space-y-3">
          <h3 className="text-base font-semibold">存放位置</h3>
          <LocationInfo item={item} />
        </div>
      </div>
    </div>
  )
}
