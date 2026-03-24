'use client'

import { useCallback } from 'react'
import type { ChatMessage } from '../types'

interface UseMediaGeneratorsOptions {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setGenerationError: (error: string | undefined) => void
  setIsGeneratingMedia: (value: boolean) => void
}

export function useMediaGenerators({
  setMessages,
  setGenerationError,
  setIsGeneratingMedia,
}: UseMediaGeneratorsOptions) {
  // 生成图片
  const handleGenerateImage = useCallback(
    async (prompt: string, onImageGenerated?: (url: string, prompt: string) => void) => {
      setGenerationError(undefined)
      setIsGeneratingMedia(true)

      const placeholderId = crypto.randomUUID()
      const imageSlotId = `${placeholderId}-image`
      setMessages(prev => [
        ...prev,
        {
          id: placeholderId,
          role: 'assistant',
          content: `图片提示词：${prompt}`,
          images: [{ id: imageSlotId, isPlaceholder: true }],
          generatingImage: true,
        },
      ])

      try {
        const res = await fetch('/api/minimax/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setGenerationError(data.error ?? '图片生成失败')
          setMessages(prev => prev.filter(m => m.id !== placeholderId))
          return
        }
        const imageUrl: string = data.imageUrls?.[0]
        if (!imageUrl) {
          setGenerationError('未返回图片')
          setMessages(prev => prev.filter(m => m.id !== placeholderId))
          return
        }
        setMessages(prev =>
          prev.map(m =>
            m.id === placeholderId
              ? (() => {
                  const { id: _messageId, generatingImage: _generatingImage, ...restMessage } = m
                  return {
                    ...restMessage,
                    images: [{ id: imageSlotId, url: imageUrl }],
                  }
                })()
              : m
          )
        )
        onImageGenerated?.(imageUrl, prompt)
      } catch {
        setGenerationError('图片生成请求失败')
        setMessages(prev => prev.filter(m => m.id !== placeholderId))
      } finally {
        setIsGeneratingMedia(false)
      }
    },
    [setMessages, setGenerationError, setIsGeneratingMedia]
  )

  // 生成视频
  const handleGenerateVideo = useCallback(
    async (
      prompt: string,
      onVideoGenerated?: (fileId: string, url: string, prompt: string) => void
    ) => {
      setGenerationError(undefined)
      setIsGeneratingMedia(true)

      const placeholderId = crypto.randomUUID()
      const videoSlotId = `${placeholderId}-video`
      setMessages(prev => [
        ...prev,
        {
          id: placeholderId,
          role: 'assistant',
          content: `正在为你生成视频：${prompt}`,
          videos: [{ id: videoSlotId, isPlaceholder: true }],
          generatingVideo: true,
        },
      ])

      try {
        const res = await fetch('/api/minimax/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setGenerationError(data.error ?? '视频生成失败')
          setMessages(prev => prev.filter(m => m.id !== placeholderId))
          return
        }
        const videoUrl: string = data.videoUrl
        const taskId: string = data.taskId
        setMessages(prev =>
          prev.map(m =>
            m.id === placeholderId
              ? (() => {
                  const { id: _messageId, generatingVideo: _generatingVideo, ...restMessage } = m
                  return {
                    ...restMessage,
                    content: '已为你生成视频：',
                    videos: [{ id: videoSlotId, url: videoUrl }],
                  }
                })()
              : m
          )
        )
        onVideoGenerated?.(taskId, videoUrl, prompt)
      } catch {
        setGenerationError('视频生成请求失败')
        setMessages(prev => prev.filter(m => m.id !== placeholderId))
      } finally {
        setIsGeneratingMedia(false)
      }
    },
    [setMessages, setGenerationError, setIsGeneratingMedia]
  )

  // 生成音乐
  const handleGenerateMusic = useCallback(
    async (prompt: string, lyrics: string) => {
      setGenerationError(undefined)
      setIsGeneratingMedia(true)

      const placeholderId = crypto.randomUUID()
      const musicSlotId = `${placeholderId}-music`
      setMessages(prev => [
        ...prev,
        {
          id: placeholderId,
          role: 'assistant',
          content: `正在为你生成音乐：${prompt}`,
          musics: [{ id: musicSlotId, isPlaceholder: true }],
          generatingMusic: true,
        },
      ])

      try {
        const res = await fetch('/api/minimax/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, lyrics }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setGenerationError(data.error ?? '音乐生成失败')
          setMessages(prev => prev.filter(m => m.id !== placeholderId))
          return
        }
        const musicUrl: string = data.musicUrl
        setMessages(prev =>
          prev.map(m =>
            m.id === placeholderId
              ? (() => {
                  const { id: _messageId, generatingMusic: _generatingMusic, ...restMessage } = m
                  return {
                    ...restMessage,
                    content: '已为你生成音乐：',
                    musics: [{ id: musicSlotId, url: musicUrl }],
                  }
                })()
              : m
          )
        )
      } catch {
        setGenerationError('音乐生成请求失败')
        setMessages(prev => prev.filter(m => m.id !== placeholderId))
      } finally {
        setIsGeneratingMedia(false)
      }
    },
    [setMessages, setGenerationError, setIsGeneratingMedia]
  )

  return {
    handleGenerateImage,
    handleGenerateVideo,
    handleGenerateMusic,
  }
}