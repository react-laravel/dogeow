'use client'

import Link from 'next/link'
import { memo } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import { PageContainer } from '@/components/layout'

// 常量定义
const GAME_CARD_CLASSES = {
  CONTAINER: 'w-26 sm:w-26 lg:w-30 xl:w-30',
  CARD: 'flex aspect-square flex-col items-center justify-center p-3 text-center transition-all hover:-translate-y-1 hover:shadow-md',
  ICON: 'mb-2 text-2xl sm:text-3xl lg:text-4xl',
  TITLE: 'text-sm font-medium sm:text-base lg:text-base',
} as const

const ESTATE_GAME_RULES = [
  '每名玩家初始资金 8M，经过或回到起点获得 2M。',
  '单骰 1-6 点，玩家按回合行动；电脑玩家会自动掷骰、买地和盖房。',
  '城市价格从罗马 100K 起递增，后续城市依次到 1.4M。',
  '城市可盖房，每栋 500K；单次最多盖 2 栋，单个城市最多 5 栋。',
  '城市过路费为地皮和房屋总价值的 10%；铁路和航空按拥有数量提高收费。',
  '机会和公益福利会随机触发奖励、惩罚、移动、进监狱或出狱卡。',
  '现金不足支付费用时玩家破产，资产释放；只剩一名未破产玩家时获胜。',
  '默认最多 30 轮；到达轮数上限后按总资产结算，总资产为现金 + 地皮 + 房屋价值。',
] as const

// 导入 TranslatableItem 类型
import type { TranslatableItem } from '@/app/configs'

// 游戏类型定义 - 使用 TranslatableItem 但确保 id 存在
interface Game extends Omit<TranslatableItem, 'id'> {
  id: string
}

// 类型守卫函数，确保游戏项有有效的 id
const isValidGame = (item: TranslatableItem): item is Game => {
  return typeof item.id === 'string' && item.id.length > 0
}

// 提取游戏卡片组件
const GameCard = memo(({ game }: { game: Game }) => {
  const cardClassName = `${GAME_CARD_CLASSES.CONTAINER} ${game.hideOnMobile ? 'hidden md:block' : ''}`
  const isEstateGame = game.id === 'monopoly'
  const gameHref = game.id === 'rpg' ? 'https://rpg.dogeow.com/' : `/game/${game.id}`

  if (isEstateGame) {
    return (
      <div className={cardClassName}>
        <Card className={`${GAME_CARD_CLASSES.CARD} relative`}>
          <EstateRulesDialog />
          <Link
            href={`/game/${game.id}`}
            className="flex size-full flex-col items-center justify-center"
          >
            <div
              className={GAME_CARD_CLASSES.ICON}
              role="img"
              aria-label={typeof game.name === 'string' ? game.name : game.id}
            >
              {game.icon}
            </div>
            <h2 className={GAME_CARD_CLASSES.TITLE}>{game.name}</h2>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <Link href={gameHref} key={game.id} className={cardClassName}>
      <Card className={GAME_CARD_CLASSES.CARD}>
        <div
          className={GAME_CARD_CLASSES.ICON}
          role="img"
          aria-label={typeof game.name === 'string' ? game.name : game.id}
        >
          {game.icon}
        </div>
        <h2 className={GAME_CARD_CLASSES.TITLE}>{game.name}</h2>
      </Card>
    </Link>
  )
})

GameCard.displayName = 'GameCard'

function EstateRulesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 size-7 rounded-full bg-background/80 hover:bg-background"
          aria-label="地产棋局说明"
        >
          <HelpCircle className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-amber-500" />
            地产棋局说明
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 overflow-auto pr-1">
          <div className="grid gap-3 text-sm text-stone-700 dark:text-stone-300">
            {ESTATE_GAME_RULES.map(rule => (
              <div key={rule} className="rounded-md bg-stone-50 px-3 py-2 dark:bg-stone-900/80">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GamePage() {
  const { t } = useTranslation()
  const { games: allGames } = getTranslatedConfigs(t)

  // 过滤出有效的游戏（有 id 的游戏）
  const games = allGames.filter(isValidGame)

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl">
        {/* 页面标题 - 改进SEO */}
        <div className="sr-only">
          <h1>游戏中心</h1>
          <p>包含多种休闲小游戏，如拼图、射击、迷宫等</p>
        </div>

        {/* 游戏网格 */}
        <div
          className="flex flex-wrap justify-start gap-3 sm:gap-4"
          role="grid"
          aria-label="游戏列表"
        >
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
