'use client'

import { useState, useEffect, useCallback, useMemo, useRef, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckIcon,
  ChevronDownIcon,
  Columns2Icon,
  Columns3Icon,
  Columns4Icon,
  GripIcon,
  RectangleHorizontalIcon,
} from 'lucide-react'
import { ensureEven } from '@/lib/helpers/mathUtils'

interface ImageSizeControlProps {
  initialSize: number
  maxSize: number
  currentSizePreset?: SizePreset
  onPresetChange?: (preset: SizePreset) => void
  onSizeChange: (newSize: number) => void
}

export type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PRESET_COLUMNS: Record<SizePreset, number> = {
  xs: 6,
  sm: 4,
  md: 3,
  lg: 2,
  xl: 1,
}

export function ImageSizeControl({
  initialSize,
  maxSize,
  currentSizePreset,
  onPresetChange,
  onSizeChange,
}: ImageSizeControlProps) {
  const [internalSizePreset, setInternalSizePreset] = useState<SizePreset>('md')
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeSizePreset = currentSizePreset ?? internalSizePreset

  const getCalculatedSize = useCallback(
    (preset: SizePreset, width: number): number => {
      const columns = SIZE_PRESET_COLUMNS[preset]
      const gap = 8
      const newSize = ensureEven((width - (columns - 1) * gap) / columns)
      const finalSize = Math.max(60, Math.min(newSize, maxSize))
      return finalSize
    },
    [maxSize]
  )

  const imageSize = useMemo(() => {
    if (containerWidth <= 0) {
      return initialSize
    }
    return getCalculatedSize(activeSizePreset, containerWidth)
  }, [activeSizePreset, containerWidth, getCalculatedSize, initialSize])

  const measureContainer = useCallback(() => {
    const width = containerRef.current?.offsetWidth ?? 0
    setContainerWidth(prev => (prev !== width ? width : prev))
  }, [])

  useEffect(() => {
    queueMicrotask(measureContainer)
    window.addEventListener('resize', measureContainer)
    return () => window.removeEventListener('resize', measureContainer)
  }, [measureContainer])

  useEffect(() => {
    if (containerWidth > 0) {
      onSizeChange(imageSize)
    }
  }, [imageSize, containerWidth, onSizeChange])

  const handlePresetClick = (preset: SizePreset) => {
    setInternalSizePreset(preset)
    onPresetChange?.(preset)
  }

  const sizePresets = [
    { id: 'xs', label: 'XS', icon: <GripIcon className="h-4 w-4" /> },
    { id: 'sm', label: 'S', icon: <Columns4Icon className="h-4 w-4" /> },
    { id: 'md', label: 'M', icon: <Columns3Icon className="h-4 w-4" /> },
    { id: 'lg', label: 'L', icon: <Columns2Icon className="h-4 w-4" /> },
    { id: 'xl', label: 'XL', icon: <RectangleHorizontalIcon className="h-4 w-4" /> },
  ] as const satisfies ReadonlyArray<{ id: SizePreset; label: string; icon: ReactElement }>
  const currentPreset = sizePresets.find(preset => preset.id === activeSizePreset) ?? sizePresets[2]

  return (
    <div
      ref={containerRef}
      className="bg-background/80 sticky top-0 z-10 mb-4 flex items-center justify-between gap-2 rounded-md border p-2 backdrop-blur-sm"
    >
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-r-none border-r-0 px-2.5"
          title={`Current image size ${currentPreset.label}`}
          aria-label={`当前图片大小 ${currentPreset.label}`}
        >
          {currentPreset.icon}
          <span className="ml-1">{currentPreset.label}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              title="选择图片大小"
              aria-label="选择图片大小"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[7rem]">
            <DropdownMenuRadioGroup
              value={activeSizePreset}
              onValueChange={value => handlePresetClick(value as SizePreset)}
            >
              {sizePresets.map(preset => (
                <DropdownMenuRadioItem
                  key={preset.id}
                  value={preset.id}
                  title={`Set image size to ${preset.label}`}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    {preset.icon}
                    {preset.label}
                  </span>
                  {activeSizePreset === preset.id ? (
                    <CheckIcon className="text-primary h-4 w-4" />
                  ) : null}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span className="text-muted-foreground text-sm font-medium">{imageSize}px</span>
    </div>
  )
}
