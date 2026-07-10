interface GameStatusProps {
  gameWon: boolean
  gameOver: boolean
  score: number
}

export function GameStatus({ gameWon, gameOver, score }: GameStatusProps) {
  return (
    <>
      {gameWon && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-center dark:bg-green-900/20">
          <div className="font-bold text-green-800 dark:text-green-200">
            🎉 恭喜！你达到了2048！
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">继续游戏挑战更高分数</div>
        </div>
      )}
      {gameOver && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-center dark:bg-red-900/20">
          <div className="font-bold text-red-800 dark:text-red-200">游戏结束</div>
          <div className="text-sm text-red-600 dark:text-red-300">最终分数: {score}</div>
        </div>
      )}
    </>
  )
}
