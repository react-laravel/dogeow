import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import { DIFFICULTY_LABELS } from '../config'
import type { Difficulty, MinesweeperGameState } from '../types'

interface MinesweeperHeaderProps {
  difficulty: Difficulty
  timer: number
  mineCount: number
  gameState: MinesweeperGameState
  onDifficultyChange: (difficulty: Difficulty) => void
  onReset: () => void
}

const GAME_RULES = [
  '找出所有地雷位置而不踩雷',
  '数字表示周围8个格子的地雷数量',
  '左键点击揭示格子，右键标记地雷',
  '手机端可长按标记或使用标记模式',
  '揭示所有非地雷格子即可获胜',
  '点到地雷就失败了',
]

export function MinesweeperHeader({
  difficulty,
  timer,
  mineCount,
  gameState,
  onDifficultyChange,
  onReset,
}: MinesweeperHeaderProps) {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="flex w-full items-center justify-between">
        <div className="text-muted-foreground text-sm">
          <Link href="/game" className="hover:text-foreground transition-colors">
            游戏中心
          </Link>
          <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground font-medium">扫雷</span>
        </div>
        <GameRulesDialog title="扫雷游戏规则" rules={GAME_RULES} />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(option => (
          <Button
            key={option}
            variant={difficulty === option ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDifficultyChange(option)}
            className="text-xs"
          >
            {DIFFICULTY_LABELS[option]}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-center space-x-8">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">时间</div>
          <div className="text-xl font-bold">{timer}s</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">地雷</div>
          <div className="text-xl font-bold">{mineCount}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">状态</div>
          <div className="text-xl">
            {gameState === 'playing' ? '🙂' : gameState === 'won' ? '😎' : '😵'}
          </div>
        </div>
      </div>

      <Button onClick={onReset} variant="outline" size="sm">
        重新开始
      </Button>
    </div>
  )
}
