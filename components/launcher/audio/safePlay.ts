export function isAbortPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function safePlay(
  audio: HTMLAudioElement,
  isCurrentRequest: () => boolean = () => true
): Promise<void> {
  if (!audio.paused || !isCurrentRequest()) {
    return
  }

  const source = audio.src

  try {
    await audio.play()
  } catch (error) {
    if (!isCurrentRequest() || audio.src !== source) return
    if (!isAbortPlayError(error)) {
      throw error
    }

    if (audio.paused) {
      await audio.play().catch(error => {
        if (isCurrentRequest() && audio.src === source && !isAbortPlayError(error)) throw error
      })
    }
  }
}
