export const BACKGROUND_TRANSITION_GRACE_PERIOD_MS = 1500

export function shouldResumeAudioContext(
  audioContext: AudioContext | null
): audioContext is AudioContext {
  return Boolean(
    audioContext && audioContext.state !== 'running' && audioContext.state !== 'closed'
  )
}
