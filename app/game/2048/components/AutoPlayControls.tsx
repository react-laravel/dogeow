import { Button } from '@/components/ui/button'
import { SPEED_OPTIONS } from '../config'

interface AutoPlayControlsProps {
  speed: number
  gameOver: boolean
  randomRunning: boolean
  directionalRunning: boolean
  clockwise: boolean
  onSpeedChange: (speed: number) => void
  onToggleRandom: () => void
  onToggleClockwise: () => void
  onToggleCounterClockwise: () => void
}

export function AutoPlayControls({
  speed,
  gameOver,
  randomRunning,
  directionalRunning,
  clockwise,
  onSpeedChange,
  onToggleRandom,
  onToggleClockwise,
  onToggleCounterClockwise,
}: AutoPlayControlsProps) {
  const speedIndex = Math.max(
    0,
    SPEED_OPTIONS.findIndex(option => option.value === speed)
  )

  return (
    <div className="mb-6 space-y-3">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant={randomRunning ? 'default' : 'outline'}
            size="icon"
            onClick={onToggleRandom}
            disabled={gameOver || directionalRunning}
            className="h-10 w-10 text-lg"
            aria-label={randomRunning ? '停止随机自动运行' : '开始随机自动运行'}
          >
            🎲
          </Button>
          <Button
            variant={directionalRunning && clockwise ? 'default' : 'outline'}
            size="icon"
            onClick={onToggleClockwise}
            disabled={gameOver || randomRunning}
            className="h-10 w-10 text-lg"
            aria-label={directionalRunning && clockwise ? '停止顺时针运行' : '开始顺时针运行'}
          >
            ↻
          </Button>
          <Button
            variant={directionalRunning && !clockwise ? 'default' : 'outline'}
            size="icon"
            onClick={onToggleCounterClockwise}
            disabled={gameOver || randomRunning}
            className="h-10 w-10 text-lg"
            aria-label={directionalRunning && !clockwise ? '停止逆时针运行' : '开始逆时针运行'}
          >
            ↺
          </Button>
        </div>

        <div className="mt-3">
          <div className="mx-auto w-full max-w-xs">
            <input
              type="range"
              min={0}
              max={SPEED_OPTIONS.length - 1}
              step={1}
              value={speedIndex}
              onInput={event => {
                const index = Number(event.currentTarget.value)
                onSpeedChange(SPEED_OPTIONS[index]?.value ?? speed)
              }}
              disabled={gameOver}
              className="w-full"
              aria-label="自动运行速度"
            />
            <div className="mt-2 grid grid-cols-4 text-xs text-gray-500 dark:text-gray-400">
              {SPEED_OPTIONS.map((option, index) => (
                <span
                  key={option.value}
                  className={`text-center ${index === speedIndex ? 'text-foreground font-medium' : ''}`}
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
