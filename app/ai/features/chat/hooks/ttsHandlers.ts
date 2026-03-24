'use client'

import type { ChatMessage } from '../types'

/**
 * Play TTS audio for the given text content
 */
export async function playTtsAudio(text: string): Promise<void> {
  const res = await fetch('/api/minimax/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (res.ok) {
    const data = await res.json()
    if (data.success && data.audioUrl) {
      const audio = new Audio(data.audioUrl)
      await audio.play()
    }
  }
}

/**
 * Generate TTS audio and update the message with the audio URL
 */
export async function generateTtsForMessage(
  accumulatedContent: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
): Promise<void> {
  try {
    const ttsRes = await fetch('/api/minimax/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: accumulatedContent }),
    })
    if (ttsRes.ok) {
      const ttsData = await ttsRes.json()
      if (ttsData.success && ttsData.audioUrl) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            audioUrl: ttsData.audioUrl,
          }
          return updated
        })
        // Auto-play the TTS audio
        const audio = new Audio(ttsData.audioUrl)
        await audio.play()
      }
    }
  } catch {
    // TTS errors are non-fatal
  }
}