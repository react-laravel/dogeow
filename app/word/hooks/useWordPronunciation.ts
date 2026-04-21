import { useCallback, useEffect, useRef } from 'react'

export type WordPronunciationAccent = 'uk' | 'us'

interface PlayWordPronunciationOptions {
  suppressErrors?: boolean
}

const YOUDAO_PRONUNCIATION_BASE_URL = 'https://dict.youdao.com/dictvoice'

const YOUDAO_PRONUNCIATION_TYPE: Record<WordPronunciationAccent, '1' | '2'> = {
  uk: '1',
  us: '2',
}

export function getYoudaoPronunciationUrl(
  word: string,
  accent: WordPronunciationAccent = 'us'
): string {
  const normalizedWord = word.trim()

  if (!normalizedWord) {
    return ''
  }

  return `${YOUDAO_PRONUNCIATION_BASE_URL}?audio=${encodeURIComponent(normalizedWord)}&type=${YOUDAO_PRONUNCIATION_TYPE[accent]}`
}

export function useWordPronunciation() {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const cancel = useCallback(() => {
    const currentAudio = currentAudioRef.current

    if (!currentAudio) {
      return
    }

    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudioRef.current = null
  }, [])

  const playWordPronunciation = useCallback(
    async (
      word: string,
      accent: WordPronunciationAccent = 'us',
      options: PlayWordPronunciationOptions = {}
    ) => {
      const pronunciationUrl = getYoudaoPronunciationUrl(word, accent)

      if (typeof Audio === 'undefined' || !pronunciationUrl) {
        return
      }

      let audio: HTMLAudioElement | null = null

      try {
        cancel()

        audio = new Audio(pronunciationUrl)
        currentAudioRef.current = audio

        const clearCurrentAudio = () => {
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null
          }
        }

        audio.onended = clearCurrentAudio
        audio.onerror = clearCurrentAudio

        await audio.play()
      } catch (error) {
        if (!audio) {
          return
        }

        const isCurrentAudio = currentAudioRef.current === audio

        if (isCurrentAudio) {
          currentAudioRef.current = null
        }

        if (isCurrentAudio && !options.suppressErrors) {
          console.error('单词发音失败:', error)
        }
      }
    },
    [cancel]
  )

  const playBritishPronunciation = useCallback(
    (word: string, options?: PlayWordPronunciationOptions) =>
      playWordPronunciation(word, 'uk', options),
    [playWordPronunciation]
  )

  const playAmericanPronunciation = useCallback(
    (word: string, options?: PlayWordPronunciationOptions) =>
      playWordPronunciation(word, 'us', options),
    [playWordPronunciation]
  )

  useEffect(() => cancel, [cancel])

  return {
    cancel,
    playWordPronunciation,
    playBritishPronunciation,
    playAmericanPronunciation,
  }
}
