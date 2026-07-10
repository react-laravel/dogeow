export interface SpeedOption {
  value: number
  label: string
}

export const DEFAULT_AUTO_PLAY_SPEED = 500

export const SPEED_OPTIONS: SpeedOption[] = [
  { value: 1, label: '不能再快了' },
  { value: 200, label: '快' },
  { value: DEFAULT_AUTO_PLAY_SPEED, label: '正常' },
  { value: 1000, label: '慢' },
]
