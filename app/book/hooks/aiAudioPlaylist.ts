/** One HTMLAudioElement for a whole chapter so later clips keep the user gesture. */

export function createAiPlaylistAudio(): HTMLAudioElement {
  const audio = new Audio()
  audio.preload = 'auto'
  try {
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
  } catch {
    // jsdom mocks may not implement attributes
  }
  return audio
}

export function attachAiClip(
  audio: HTMLAudioElement,
  handlers: {
    onEnded: () => void
    onError: () => void
    onTimeUpdate: (audio: HTMLAudioElement) => void
  }
): () => void {
  let settled = false

  const settle = (callback: () => void) => {
    if (settled) return
    settled = true
    cleanup()
    callback()
  }

  const onEnded = () => settle(handlers.onEnded)
  const onPause = () => {
    if (audio.ended) settle(handlers.onEnded)
  }
  const onError = () => {
    if (audio.error?.code === 1) return
    settle(handlers.onError)
  }
  const onTimeUpdate = () => handlers.onTimeUpdate(audio)

  const cleanup = () => {
    audio.removeEventListener('ended', onEnded)
    audio.removeEventListener('pause', onPause)
    audio.removeEventListener('error', onError)
    audio.removeEventListener('timeupdate', onTimeUpdate)
  }

  audio.addEventListener('ended', onEnded)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('error', onError)
  audio.addEventListener('timeupdate', onTimeUpdate)

  return () => {
    settled = true
    cleanup()
  }
}

export function loadAiPlaylistUrl(audio: HTMLAudioElement, url: string, rate: number): void {
  audio.playbackRate = rate
  audio.src = url
}

export function resetAiPlaylistSrc(audio: HTMLAudioElement): void {
  audio.pause()
  audio.removeAttribute('src')
}
