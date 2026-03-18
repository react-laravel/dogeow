// Combined history for images (localStorage) and videos (MiniMax files API)

'use client'

import { useCallback, useState } from 'react'

const IMAGE_STORAGE_KEY = 'minimax_image_history'
const VIDEO_STORAGE_KEY = 'minimax_video_history'
const MAX_ITEMS = 50

export interface ImageHistoryItem {
  id: string
  url: string
  prompt: string
  createdAt: number
}

export interface VideoHistoryItem {
  id: string
  fileId: string
  url: string
  prompt: string
  createdAt: number
}

interface UseMediaHistoryReturn {
  // Images
  imageHistory: ImageHistoryItem[]
  addImage: (url: string, prompt: string) => void
  removeImage: (id: string) => void
  clearImages: () => void
  // Videos
  videoHistory: VideoHistoryItem[]
  addVideo: (fileId: string, url: string, prompt: string) => void
  clearVideos: () => void
}

function loadImages(): ImageHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(IMAGE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ImageHistoryItem[]) : []
  } catch {
    return []
  }
}

function loadVideos(): VideoHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VIDEO_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VideoHistoryItem[]) : []
  } catch {
    return []
  }
}

function saveImages(items: ImageHistoryItem[]) {
  try {
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(items))
  } catch {
    const trimmed = items.slice(1)
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(trimmed))
  }
}

function saveVideos(items: VideoHistoryItem[]) {
  try {
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(items))
  } catch {
    const trimmed = items.slice(1)
    localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(trimmed))
  }
}

export function useImageHistory(): UseMediaHistoryReturn {
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>(() => loadImages())
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>(() => loadVideos())

  const addImage = useCallback((url: string, prompt: string) => {
    const item: ImageHistoryItem = {
      id: crypto.randomUUID(),
      url,
      prompt,
      createdAt: Date.now(),
    }
    setImageHistory(prev => {
      const next = [item, ...prev].slice(0, MAX_ITEMS)
      saveImages(next)
      return next
    })
  }, [])

  const removeImage = useCallback((id: string) => {
    setImageHistory(prev => {
      const next = prev.filter(m => m.id !== id)
      saveImages(next)
      return next
    })
  }, [])

  const clearImages = useCallback(() => {
    setImageHistory([])
    localStorage.removeItem(IMAGE_STORAGE_KEY)
  }, [])

  const addVideo = useCallback((fileId: string, url: string, prompt: string) => {
    const item: VideoHistoryItem = {
      id: crypto.randomUUID(),
      fileId,
      url,
      prompt,
      createdAt: Date.now(),
    }
    setVideoHistory(prev => {
      const next = [item, ...prev].slice(0, MAX_ITEMS)
      saveVideos(next)
      return next
    })
  }, [])

  const clearVideos = useCallback(() => {
    setVideoHistory([])
    localStorage.removeItem(VIDEO_STORAGE_KEY)
  }, [])

  return {
    imageHistory,
    addImage,
    removeImage,
    clearImages,
    videoHistory,
    addVideo,
    clearVideos,
  }
}
