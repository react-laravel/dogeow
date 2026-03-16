interface PausePlaybackStateParams {
  isEnded: boolean
  isDocumentHidden: boolean
}

export function shouldUpdatePlayingStateOnPause({
  isEnded,
  isDocumentHidden,
}: PausePlaybackStateParams): boolean {
  return !isEnded && !isDocumentHidden
}
