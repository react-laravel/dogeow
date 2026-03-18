import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Wand2, Video, Music, Loader2 } from 'lucide-react'

interface GenerationModalProps {
  open: boolean
  type: 'image' | 'video' | 'music' | null
  prompt: string
  onPromptChange: (value: string) => void
  lyrics: string
  onLyricsChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  isLoading: boolean
  error?: string
}

const MODAL_CONFIG = {
  image: {
    title: '生成图片',
    icon: Wand2,
    promptLabel: '图片描述',
    promptPlaceholder: '描述你想生成的图片...',
    showLyrics: false,
  },
  video: {
    title: '生成视频',
    icon: Video,
    promptLabel: '视频描述',
    promptPlaceholder: '描述你想生成的视频场景...',
    showLyrics: false,
  },
  music: {
    title: '生成音乐',
    icon: Music,
    promptLabel: '音乐描述',
    promptPlaceholder: '描述音乐风格、情绪、节奏...',
    showLyrics: true,
    lyricsLabel: '歌词',
    lyricsPlaceholder: '输入歌词（可选）...',
  },
} as const

export const GenerationModal = React.memo<GenerationModalProps>(
  ({
    open,
    type,
    prompt,
    onPromptChange,
    lyrics,
    onLyricsChange,
    onSubmit,
    onClose,
    isLoading,
    error,
  }) => {
    if (!type) return null

    const config = MODAL_CONFIG[type]
    const Icon = config.icon

    const canSubmit = isLoading ? false : prompt.trim().length > 0

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {config.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gen-prompt">{config.promptLabel}</Label>
              <Textarea
                id="gen-prompt"
                value={prompt}
                onChange={e => onPromptChange(e.target.value)}
                placeholder={config.promptPlaceholder}
                disabled={isLoading}
                rows={3}
                className="resize-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
                    onSubmit()
                  }
                }}
              />
            </div>

            {config.showLyrics && (
              <div className="space-y-2">
                <Label htmlFor="gen-lyrics">{config.lyricsLabel}</Label>
                <Textarea
                  id="gen-lyrics"
                  value={lyrics}
                  onChange={e => onLyricsChange(e.target.value)}
                  placeholder={config.lyricsPlaceholder}
                  disabled={isLoading}
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {isLoading && (
              <p className="text-sm text-muted-foreground">
                {type === 'video' ? '视频生成中，请耐心等待（可能需要几分钟）...' : '生成中...'}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              取消
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

GenerationModal.displayName = 'GenerationModal'
