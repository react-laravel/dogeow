export function isAbortPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function safePlay(audio: HTMLAudioElement): Promise<void> {
  if (!audio.paused) {
    return
  }

  try {
    await audio.play()
  } catch (error) {
    if (!isAbortPlayError(error)) {
      throw error
    }

    if (audio.paused) {
      await audio.play().catch(() => {
        // ignore second-chance abort during background handoff
      })
    }
  }
}
