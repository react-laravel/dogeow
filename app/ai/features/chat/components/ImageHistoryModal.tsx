import React, { useState } from 'react'
import { Wand2, Image as ImageIcon, Video, ExternalLink, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  useImageHistory,
  type ImageHistoryItem,
  type VideoHistoryItem,
} from '../hooks/useImageHistory'

interface ImageHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const ImageHistoryModal = React.memo<ImageHistoryModalProps>(({ open, onOpenChange }) => {
  const { imageHistory, removeImage, clearImages, videoHistory, clearVideos } = useImageHistory()

  const handleCopyUrl = (url: string) => {
    void navigator.clipboard.writeText(url).then(
      () => toast.success('链接已复制'),
      () => toast.error('复制失败')
    )
  }

  const total = imageHistory.length + videoHistory.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex-none px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            媒体历史记录
            {total > 0 && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">({total})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="images" className="flex-1 min-h-0 flex flex-col px-6 pb-6">
          <TabsList className="shrink-0">
            <TabsTrigger value="images" className="gap-1.5">
              <ImageIcon className="h-4 w-4" />
              图片
              {imageHistory.length > 0 && (
                <span className="ml-1 text-xs">{imageHistory.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-1.5">
              <Video className="h-4 w-4" />
              视频
              {videoHistory.length > 0 && (
                <span className="ml-1 text-xs">{videoHistory.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="flex-1 min-h-0 mt-3 overflow-y-auto">
            <ImageGrid
              items={imageHistory}
              onCopy={handleCopyUrl}
              onRemove={removeImage}
              onClear={clearImages}
              emptyText="暂无图片历史"
            />
          </TabsContent>

          <TabsContent value="videos" className="flex-1 min-h-0 mt-3 overflow-y-auto">
            <VideoGrid
              items={videoHistory}
              onCopy={handleCopyUrl}
              onClear={clearVideos}
              emptyText="暂无视频历史"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
})

ImageHistoryModal.displayName = 'ImageHistoryModal'

const ImageGrid = React.memo<{
  items: ImageHistoryItem[]
  onCopy: (url: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  emptyText: string
}>(({ items, onCopy, onRemove, onClear, emptyText }) => {
  const [confirmClear, setConfirmClear] = useState(false)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ImageIcon className="mb-3 h-12 w-12 opacity-30" />
        <p>{emptyText}</p>
        <p className="mt-1 text-xs">生成媒体后会保存在此处</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {confirmClear ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onClear()
                setConfirmClear(false)
              }}
            >
              确认清空
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)}>
              取消
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            清空
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map(item => (
          <div key={item.id} className="group relative overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.prompt}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <p className="text-white text-xs leading-tight line-clamp-3 mb-1">{item.prompt}</p>
              <p className="text-white/60 text-[10px] mb-2">{formatTime(item.createdAt)}</p>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => onCopy(item.url)}
                  title="复制链接"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 hover:bg-destructive hover:text-white"
                  onClick={() => onRemove(item.id)}
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

ImageGrid.displayName = 'ImageGrid'

const VideoGrid = React.memo<{
  items: VideoHistoryItem[]
  onCopy: (url: string) => void
  onClear: () => void
  emptyText: string
}>(({ items, onCopy, onClear, emptyText }) => {
  const [confirmClear, setConfirmClear] = useState(false)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Video className="mb-3 h-12 w-12 opacity-30" />
        <p>{emptyText}</p>
        <p className="mt-1 text-xs">生成视频后会保存在此处</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {confirmClear ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onClear()
                setConfirmClear(false)
              }}
            >
              确认清空
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)}>
              取消
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            清空
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(item => (
          <div key={item.id} className="group relative overflow-hidden rounded-lg border bg-muted">
            <video
              src={item.url}
              controls
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
            <div className="p-2">
              <p className="text-sm leading-tight line-clamp-2">{item.prompt}</p>
              <p className="text-muted-foreground text-xs mt-1">{formatTime(item.createdAt)}</p>
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 bg-black/50 hover:bg-black/70 border-0"
                onClick={() => onCopy(item.url)}
                title="复制链接"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

VideoGrid.displayName = 'VideoGrid'
