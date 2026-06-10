'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Item, ItemFormData, LocationSelection, Tag, UploadedImage } from '@/app/thing/types'
import ImageUploader from '../../ImageUploader'
import { ImageUploadHeader } from '../../ImageUploadHeader'
import { TagsSection } from '../../forms/components/TagsSection'
import { LocationSection } from '../../forms/components/LocationSection'
import { formatDate } from '../utils/dateUtils'
import { InfoCard } from './InfoCard'
import { TimeInfo } from './TimeInfo'

interface ItemDetailEditContentProps {
  getCurrentFormValue: (field: string) => ItemFormData[keyof ItemFormData]
  hasDescription: boolean
  item: Item
  locationPath: string
  onCreateTag: () => void
  onImagesChange: Dispatch<SetStateAction<UploadedImage[]>>
  onLocationSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void
  onRemoveBgChange: (enabled: boolean) => void
  onTagsChange: Dispatch<SetStateAction<string[]>>
  removeBgEnabled: boolean
  selectedLocation: LocationSelection
  selectedTags: string[]
  tags: Tag[]
  trimmedDescription?: string
  uploadedImages: UploadedImage[]
}

export function ItemDetailEditContent({
  getCurrentFormValue,
  hasDescription,
  item,
  locationPath,
  onCreateTag,
  onImagesChange,
  onLocationSelect,
  onRemoveBgChange,
  onTagsChange,
  removeBgEnabled,
  selectedLocation,
  selectedTags,
  tags,
  trimmedDescription,
  uploadedImages,
}: ItemDetailEditContentProps) {
  return (
    <Card className="mt-6 overflow-hidden">
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3">
          <ImageUploadHeader
            removeBgEnabled={removeBgEnabled}
            onRemoveBgChange={onRemoveBgChange}
          />
          <ImageUploader
            onImagesChange={onImagesChange}
            existingImages={uploadedImages}
            maxImages={10}
            removeBgEnabled={removeBgEnabled}
            onRemoveBgChange={onRemoveBgChange}
            showRemoveBgToggle={false}
          />
        </div>

        <TagsSection
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={tagId =>
            onTagsChange(prev =>
              prev.includes(tagId)
                ? prev.filter(currentTagId => currentTagId !== tagId)
                : [...prev, tagId]
            )
          }
          onCreateTag={onCreateTag}
        />

        {hasDescription ? (
          <div className="bg-muted/30 rounded-lg p-3">
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">描述</h3>
            <p className="text-xs">{trimmedDescription}</p>
          </div>
        ) : null}

        {(item.purchase_price || item.purchase_date) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <LocationSection
              locationPath={locationPath}
              selectedLocation={selectedLocation}
              onLocationSelect={onLocationSelect}
              getCurrentValue={getCurrentFormValue}
              isCreateMode={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
