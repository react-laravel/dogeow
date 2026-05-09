interface PausePlaybackStateParams {
  isEnded: boolean
  isDocumentHidden: boolean
  isDuringBackgroundTransition?: boolean
}

export function shouldUpdatePlayingStateOnPause({
  isEnded,
  isDocumentHidden,
  isDuringBackgroundTransition = false,
}: PausePlaybackStateParams): boolean {
  return !isEnded && !isDocumentHidden && !isDuringBackgroundTransition
}
