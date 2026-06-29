// 物品相关的通用工具函数

import type { GameItem, ItemDefinition, ItemType, EquipmentSlot } from '../types'
import { STAT_NAMES } from '../types'

const STAT_DISPLAY_ORDER = Object.keys(STAT_NAMES)
const HIDDEN_ITEM_STAT_KEYS = new Set(['price'])

/** 装备宝石孔位上限 */
export const MAX_ITEM_SOCKETS = 3

export const getEffectiveSocketCount = (sockets?: number): number =>
  Math.min(Math.max(sockets ?? 0, 0), MAX_ITEM_SOCKETS)

/** 适用于 getItemIconFallback 的物品形态：GameItem 或仅含 definition 的对象（如图鉴 CompendiumItem） */
type ItemWithDefinition =
  | GameItem
  | { definition: Pick<ItemDefinition, 'type' | 'sub_type' | 'icon'> }

// 物品类型图标映射
export const ITEM_TYPE_ICONS: Record<string, string> = {
  weapon: '⚔️',
  helmet: '🪖',
  armor: '👕',
  gloves: '🧤',
  boots: '👢',
  belt: '🥋',
  ring: '💍',
  amulet: '📿',
  gem: '💎',
}

// 物品类型中文名
export const ITEM_TYPE_NAMES: Record<string, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '盔甲',
  gloves: '手套',
  boots: '靴子',
  belt: '腰带',
  ring: '戒指',
  amulet: '护身符',
  gem: '宝石',
}

/**
 * 获取物品图标回退：按 type 或 definition.icon，最后 📦
 * 支持 GameItem 或图鉴等仅含 definition 形态的对象
 */
export function getItemIconFallback(item: ItemWithDefinition): string {
  const def = item.definition
  if (!def) return '📦'
  const typeIcon = ITEM_TYPE_ICONS[def.type]
  if (typeIcon) return typeIcon
  if (def.icon && !def.icon.includes('.')) return def.icon
  return '📦'
}

/**
 * 获取物品显示名称：优先 definition.name，否则用品质+类型
 */
export function getItemDisplayName(item: GameItem): string {
  const name = item.definition?.name?.trim()
  if (name) return name
  const typeName = ITEM_TYPE_NAMES[item.definition?.type ?? ''] ?? item.definition?.type ?? '物品'
  return `${item.quality} ${typeName}`
}

/**
 * 检查物品是否属于指定分类
 */
export function itemMatchesCategory(item: GameItem, types: readonly string[] | null): boolean {
  if (!types) return true
  const t = item.definition?.type ?? ''
  return types.includes(t)
}

/**
 * 物品堆叠 - 相同属性的物品可以堆叠
 */
export interface StackedItem extends GameItem {
  quantity: number
}

export function stackItems(items: GameItem[]): StackedItem[] {
  const stacks = new Map<string, StackedItem>()

  items.forEach(item => {
    const defId = item.definition?.id ?? item.definition_id ?? 'unknown'
    const statsKey = item.stats
      ? JSON.stringify(Object.entries(item.stats).sort(([a], [b]) => a.localeCompare(b)))
      : ''
    const affixesKey = item.affixes
      ? JSON.stringify(item.affixes.map(a => JSON.stringify(a)).sort())
      : ''
    const key = `${defId}-${statsKey}-${affixesKey}`

    const existing = stacks.get(key)
    if (existing) {
      existing.quantity++
    } else {
      stacks.set(key, { ...item, quantity: 1 })
    }
  })

  return Array.from(stacks.values())
}

/**
 * 检查物品是否可装备
 */
export function isEquippable(item: GameItem): boolean {
  const type = item.definition?.type
  return type !== undefined && type !== 'gem'
}

/**
 * 获取物品对应的装备槽位
 */
export function getEquipmentSlot(item: GameItem): EquipmentSlot | null {
  const type = item.definition?.type
  if (!type) return null
  const slotMap: Record<string, EquipmentSlot> = {
    weapon: 'weapon',
    helmet: 'helmet',
    armor: 'armor',
    gloves: 'gloves',
    boots: 'boots',
    belt: 'belt',
    ring: 'ring',
    amulet: 'amulet',
  }
  return slotMap[type] ?? null
}

export function getItemSellUnitPrice(item: GameItem): number {
  return item.sell_price ?? Math.floor((item.definition?.buy_price ?? 0) / 2)
}

export function getItemSellTotalValue(item: GameItem): number {
  return getItemSellUnitPrice(item) * (item.quantity ?? 1)
}

/** 对比面板用：合并两侧非零属性，并按 STAT_NAMES 顺序排列 */
export function getCompareStatKeys(
  ...statRecords: Array<Record<string, number> | undefined>
): string[] {
  const keys = new Set<string>()

  for (const stats of statRecords) {
    if (!stats) continue
    for (const [key, value] of Object.entries(stats)) {
      if (HIDDEN_ITEM_STAT_KEYS.has(key)) continue
      if (value != null && value !== 0) keys.add(key)
    }
  }

  const ordered = STAT_DISPLAY_ORDER.filter(key => keys.has(key))
  const extras = [...keys].filter(key => !STAT_DISPLAY_ORDER.includes(key)).sort()
  return [...ordered, ...extras]
}

export function getDisplayableItemStats(
  stats: Record<string, number> | undefined,
  options: { hideRestore?: boolean } = {}
): Record<string, number> {
  if (!stats) return {}

  return Object.fromEntries(
    Object.entries(stats).filter(([key, value]) => {
      if (HIDDEN_ITEM_STAT_KEYS.has(key)) return false
      if (options.hideRestore && key === 'restore') return false
      if (value == null || value === 0) return false
      return true
    })
  )
}

/** 将词缀格式化为展示行；无可展示属性时返回 null */
export function formatAffixLine(affix: Record<string, number>): string | null {
  const parts = Object.entries(affix)
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => {
      const num = Number(value)
      const display = formatItemStatValue(num, key)
      return `+${display} ${STAT_NAMES[key] || key}`
    })

  return parts.length > 0 ? parts.join(', ') : null
}

/**
 * 计算物品的总属性（包括基础属性 + 词缀 + 已镶嵌宝石）
 */
export function getItemTotalStats(item: GameItem): Record<string, number> {
  if (item.definition?.type === 'gem') {
    return { ...(item.definition.gem_stats ?? {}) }
  }

  const total: Record<string, number> = { ...(item.stats || {}) }
  // 词缀累加
  item.affixes?.forEach(affix => {
    Object.entries(affix).forEach(([key, value]) => {
      total[key] = (total[key] || 0) + value
    })
  })

  item.gems?.forEach(gem => {
    Object.entries(gem.gemDefinition?.gem_stats ?? {}).forEach(([key, value]) => {
      total[key] = (total[key] || 0) + value
    })
  })

  return total
}

/** 格式化物品属性数值（暴击率/暴伤等） */
export function formatItemStatValue(val: number, statKey: string): string | number {
  if (statKey === 'crit_damage') return `${Math.round(val * 100)}%`
  if (statKey === 'crit_rate' && Math.abs(val) < 1) return `${Number((val * 100).toFixed(1))}%`
  if (!Number.isInteger(val)) return Number(val.toFixed(2))
  return val
}
