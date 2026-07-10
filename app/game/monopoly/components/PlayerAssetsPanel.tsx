import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_HOUSES_PER_PROPERTY } from '../constants'
import type { MonopolyPlayer, MonopolyProperty } from '../types'
import { formatMoney } from './MonopolyBoard'

interface PlayerAssetsPanelProps {
  player: MonopolyPlayer | null
  properties: MonopolyProperty[]
  assetValue: number
  netWorth: number
  canBuild: boolean
  maxBuildHouses: number
  onBack: () => void
  onBuild: (property: MonopolyProperty, houses: number) => void
}

export function PlayerAssetsPanel({
  player,
  properties,
  assetValue,
  netWorth,
  canBuild,
  maxBuildHouses,
  onBack,
  onBuild,
}: PlayerAssetsPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-md bg-white/75 p-3 dark:bg-stone-950/45">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onBack}>
          <ArrowLeft /> 返回
        </Button>
        <div className="truncate text-base font-semibold text-stone-950 dark:text-stone-50">
          {player?.name ?? '玩家'}资产
        </div>
      </div>

      <div className="grid min-h-0 max-h-full flex-1 gap-2 overflow-auto pr-1">
        <div className="rounded-md bg-white/75 p-3 text-sm dark:bg-stone-950/45">
          <div className="truncate font-medium text-stone-950 dark:text-stone-50">
            {player?.name ?? '玩家'}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-stone-900">
              <div className="text-[10px] text-stone-500 dark:text-stone-400">现金</div>
              <div className="mt-0.5 font-mono font-semibold">{formatMoney(player?.cash ?? 0)}</div>
            </div>
            <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-stone-900">
              <div className="text-[10px] text-stone-500 dark:text-stone-400">资产</div>
              <div className="mt-0.5 font-mono font-semibold">{formatMoney(assetValue)}</div>
            </div>
            <div className="rounded-md bg-stone-50 px-2 py-2 dark:bg-stone-900">
              <div className="text-[10px] text-stone-500 dark:text-stone-400">总资产</div>
              <div className="mt-0.5 font-mono font-semibold">{formatMoney(netWorth)}</div>
            </div>
          </div>
        </div>
        {properties.length === 0 && (
          <div className="text-sm text-stone-500 dark:text-stone-400">暂无资产</div>
        )}
        {properties.map(property => (
          <div key={property.id} className="rounded-md border p-2 text-sm dark:border-stone-700">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{property.name}</div>
                <div className="text-stone-500 dark:text-stone-400">
                  地皮 {formatMoney(property.price)} · 房屋投入{' '}
                  {formatMoney(property.house_price * property.houses)} · 总价{' '}
                  {formatMoney(property.price + property.house_price * property.houses)}
                </div>
              </div>
              {canBuild &&
                property.type === 'city' &&
                property.houses < MAX_HOUSES_PER_PROPERTY && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => onBuild(property, 1)}>
                      <Home /> 1
                    </Button>
                    {maxBuildHouses >= 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onBuild(property, 2)}
                        disabled={property.houses > MAX_HOUSES_PER_PROPERTY - 2}
                      >
                        <Home /> 2
                      </Button>
                    )}
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
