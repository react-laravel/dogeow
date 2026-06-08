'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { UploadedImage } from '../types'
import useSWRMutation from 'swr/mutation'
import { post } from '@/lib/api'
import ThingImage from './ThingImage'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  applyRmbgResult,
  extractUploadUserId,
  getRemoveBgPreference,
  setRemoveBgPreference,
  waitForRmbgStatus,
} from '../utils/rmbg'
import useAuthStore from '@/stores/authStore'
import { THING_IMAGE_CLASS, THING_IMAGE_FRAME_CLASS } from './thingImageStyles'

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void
  existingImages?: UploadedImage[]
  maxImages?: number
  maxSize?: number // 单位：MB
  compactAddButton?: boolean
  removeBgEnabled?: boolean
  onRemoveBgChange?: (enabled: boolean) => void
  showRemoveBgToggle?: boolean
}

type SortableUploadedImage = UploadedImage & {
  sortableId: string
}

const normalizePrimaryImages = (imageList: UploadedImage[]): UploadedImage[] =>
  imageList.map((image, index) => ({
    ...image,
    is_primary: index === 0,
  }))

const getImageKey = (image: UploadedImage, index: number) =>
  String(image.id ?? image.path ?? image.url ?? index)

interface SortableImageTileProps {
  image: SortableUploadedImage
  index: number
  onPreview: (image: UploadedImage) => void
  onRemove: (index: number) => void
}

const isRmbgProcessing = (image: UploadedImage) =>
  image.rmbg_status === 'pending' || image.rmbg_status === 'processing'

function SortableImageTile({ image, index, onPreview, onRemove }: SortableImageTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.sortableId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative h-28 w-28 shrink-0 touch-none sm:h-32 sm:w-32 ${
        isDragging ? 'z-20 opacity-70' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        className={`${THING_IMAGE_FRAME_CLASS} relative h-full w-full cursor-grab rounded-md border active:cursor-grabbing`}
        style={{ backgroundColor: 'transparent' }}
        onClick={() => onPreview(image)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onPreview(image)
          }
        }}
        aria-label={`预览图片 ${index + 1}`}
      >
        <ThingImage
          src={image.url || image.thumbnail_url}
          alt={`上传图片 ${index + 1}`}
          width={128}
          height={128}
          className={`${THING_IMAGE_CLASS} ${image.is_primary ? 'ring-primary ring-2 ring-inset' : ''}`}
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
            backgroundColor: 'transparent',
          }}
          sizes="8rem"
        />
      </div>
      {image.is_primary ? (
        <div className="bg-primary absolute top-2 left-2 rounded-md px-2 py-1 text-xs text-white">
          主图
        </div>
      ) : null}
      {isRmbgProcessing(image) ? (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
          <Loader2 className="h-3 w-3 animate-spin" />
          去背景中
        </div>
      ) : null}
      <button
        onClick={event => {
          event.stopPropagation()
          onRemove(index)
        }}
        className="absolute top-2 right-2 z-10 rounded-full bg-black/70 p-1 text-white opacity-100 transition-colors hover:bg-red-600 hover:text-white"
        type="button"
        aria-label="删除图片"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  existingImages = [],
  maxImages = 10,
  maxSize = 20,
  compactAddButton = false,
  removeBgEnabled: removeBgEnabledProp,
  onRemoveBgChange,
  showRemoveBgToggle = true,
}) => {
  const [uploading, setUploading] = useState(false)
  const [internalRemoveBgEnabled, setInternalRemoveBgEnabled] = useState(() =>
    getRemoveBgPreference()
  )
  const isRemoveBgControlled = onRemoveBgChange !== undefined
  const removeBgEnabled = isRemoveBgControlled
    ? (removeBgEnabledProp ?? false)
    : internalRemoveBgEnabled
  const userId = useAuthStore(state => state.user?.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<UploadedImage[]>(() =>
    normalizePrimaryImages(existingImages)
  )
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null)
  const pollingPathsRef = useRef<Set<string>>(new Set())
  const sortableImages = useMemo<SortableUploadedImage[]>(
    () => images.map((image, index) => ({ ...image, sortableId: getImageKey(image, index) })),
    [images]
  )
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { trigger: uploadImages } = useSWRMutation(
    '/upload/images',
    async (url, { arg }: { arg: FormData }) => {
      return post<UploadedImage[]>(url, arg)
    }
  )

  const updateImages = useCallback(
    (nextImages: UploadedImage[]) => {
      const normalizedImages = normalizePrimaryImages(nextImages)
      setImages(normalizedImages)
      onImagesChange(normalizedImages)
    },
    [onImagesChange]
  )

  const startRmbgListening = useCallback(
    (uploadedImage: UploadedImage) => {
      if (!uploadedImage.path || pollingPathsRef.current.has(uploadedImage.path)) {
        return
      }

      const uploadUserId = extractUploadUserId(uploadedImage.path) ?? userId
      if (!uploadUserId) {
        return
      }

      pollingPathsRef.current.add(uploadedImage.path)

      void waitForRmbgStatus(uploadedImage.path, uploadUserId, result => {
        setImages(currentImages => {
          const nextImages = currentImages.map(image =>
            image.path === uploadedImage.path ? applyRmbgResult(image, result) : image
          )
          onImagesChange(normalizePrimaryImages(nextImages))
          return normalizePrimaryImages(nextImages)
        })
      }).then(outcome => {
        pollingPathsRef.current.delete(uploadedImage.path)

        if (outcome === 'failed') {
          toast.error('去背景失败，已保留原图')
        } else if (outcome === 'timeout') {
          toast.error('去背景超时，已保留原图')
        }
      })
    },
    [onImagesChange, userId]
  )

  const handleRemoveBgToggle = (checked: boolean) => {
    if (isRemoveBgControlled) {
      onRemoveBgChange?.(checked)
    } else {
      setInternalRemoveBgEnabled(checked)
      setRemoveBgPreference(checked)
    }
  }

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 检查文件数量限制
    if (images.length + files.length > maxImages) {
      toast.error(`最多只能上传${maxImages}张图片`)
      return
    }

    // 检查文件大小
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`有${oversizedFiles.length}个文件超过${maxSize}MB限制`)
      return
    }

    setUploading(true)

    // 先同步当前图片到父组件，防止父组件丢失旧图片
    onImagesChange(images)

    // 准备上传表单数据
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images[]', file)
    })
    if (removeBgEnabled) {
      formData.append('remove_bg', '1')
    }

    try {
      // 调用上传API
      const response = await uploadImages(formData)

      const newImages = normalizePrimaryImages([...images, ...response])
      updateImages(newImages)

      if (removeBgEnabled) {
        response
          .filter(image => image.rmbg_status === 'pending' && image.path)
          .forEach(image => startRmbgListening(image))
        toast.success('图片上传成功，正在异步去背景')
      } else {
        toast.success('图片上传成功')
      }
    } catch (error) {
      toast.error('图片上传失败')
      console.error('上传图片失败:', error)
    } finally {
      setUploading(false)
      // 清空文件输入框，以便可以重复选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 移除图片
  const removeImage = (index: number) => {
    const newImages = [...images]
    const removed = newImages.splice(index, 1)[0]
    if (removed?.path) {
      pollingPathsRef.current.delete(removed.path)
    }
    updateImages(newImages)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortableImages.findIndex(image => image.sortableId === active.id)
    const newIndex = sortableImages.findIndex(image => image.sortableId === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    updateImages(arrayMove(images, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      {showRemoveBgToggle ? (
        <div className="flex items-center justify-end gap-2">
          <Switch
            id="thing-remove-bg-inline"
            checked={removeBgEnabled}
            onCheckedChange={handleRemoveBgToggle}
            disabled={uploading}
          />
          <Label htmlFor="thing-remove-bg-inline" className="text-sm font-normal">
            上传时自动去背景
          </Label>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start gap-3">
        {images.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableImages.map(image => image.sortableId)}>
              {sortableImages.map((image, index) => (
                <SortableImageTile
                  key={image.sortableId}
                  image={image}
                  index={index}
                  onPreview={setPreviewImage}
                  onRemove={removeImage}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : null}

        {images.length < maxImages ? (
          compactAddButton ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex h-9 gap-2 border-dashed px-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <svg className="text-muted-foreground h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-xs">上传中...</span>
                </>
              ) : (
                <>
                  <Upload className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs">上传图片</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="flex h-28 w-28 shrink-0 flex-col items-center justify-center border-dashed sm:h-32 sm:w-32"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <svg
                    className="text-muted-foreground mb-2 h-6 w-6 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-xs">上传中...</span>
                </div>
              ) : (
                <>
                  <Upload className="text-muted-foreground mb-2 h-6 w-6" />
                  <span className="text-muted-foreground text-xs">上传图片</span>
                </>
              )}
            </Button>
          )
        ) : null}
      </div>

      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.heic,.heif"
        multiple
      />

      <Dialog open={Boolean(previewImage)} onOpenChange={open => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-4">
          <DialogTitle className="sr-only">图片预览</DialogTitle>
          <DialogDescription className="sr-only">查看上传图片的大图预览</DialogDescription>
          {previewImage ? (
            <div className="relative max-h-[80vh] overflow-hidden rounded-md">
              <ThingImage
                src={previewImage.url}
                alt="图片预览"
                width={1200}
                height={900}
                className={`max-h-[80vh] w-auto max-w-full ${THING_IMAGE_CLASS}`}
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ImageUploader
