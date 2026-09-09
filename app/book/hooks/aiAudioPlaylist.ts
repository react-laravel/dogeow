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

export function bindAiPlaylistAudio(
  audio: HTMLAudioElement,
  handlers: {
    shouldIgnore: () => boolean
    onEnded: () => void
    onError: () => void
    onTimeUpdate: (audio: HTMLAudioElement) => void
  }
): { arm: () => void; unbind: () => void } {
  let advancing = false

  const advance = (fromError = false) => {
    if (handlers.shouldIgnore() || advancing) return
    advancing = true
    if (fromError) handlers.onError()
    else handlers.onEnded()
  }

  const onEnded = () => advance()
  const onPause = () => {
    if (audio.ended) advance()
  }
  const onError = () => advance(true)
  const onTimeUpdate = () => {
    if (handlers.shouldIgnore()) return
    handlers.onTimeUpdate(audio)
    const duration = audio.duration
    if (
      Number.isFinite(duration) &&
      duration > 0 &&
      !audio.paused &&
      audio.currentTime >= Math.max(duration - 0.08, 0)
    ) {
      advance()
    }
  }

  audio.addEventListener('ended', onEnded)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('error', onError)
  audio.addEventListener('timeupdate', onTimeUpdate)

  return {
    arm: () => {
      advancing = false
    },
    unbind: () => {
      advancing = true
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('timeupdate', onTimeUpdate)
    },
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
