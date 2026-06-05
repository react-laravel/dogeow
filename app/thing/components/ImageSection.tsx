'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadedImage } from '../types'
import ImageUploader from './ImageUploader'
import { ImageUploadHeader } from './ImageUploadHeader'
import { useRemoveBgPreference } from '../hooks/useRemoveBgPreference'

interface ImageSectionProps {
  uploadedImages: UploadedImage[]
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>
}

const ImageSection = ({ uploadedImages, setUploadedImages }: ImageSectionProps) => {
  const { removeBgEnabled, setRemoveBgEnabled } = useRemoveBgPreference()

  return (
    <Card>
      <CardHeader>
        <CardTitle>图片</CardTitle>
        <CardDescription>编辑物品的图片</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ImageUploadHeader
            removeBgEnabled={removeBgEnabled}
            onRemoveBgChange={setRemoveBgEnabled}
          />
          <ImageUploader
            onImagesChange={setUploadedImages}
            existingImages={uploadedImages}
            maxImages={10}
            removeBgEnabled={removeBgEnabled}
            onRemoveBgChange={setRemoveBgEnabled}
            showRemoveBgToggle={false}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ImageSection
