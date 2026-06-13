import type { CompendiumItem, ItemQuality, ShopItem } from '../types'

const ITEM_QUALITIES: readonly ItemQuality[] = ['common', 'magic', 'rare', 'legendary', 'mythic']

type PricedCompendiumItem = CompendiumItem & {
  buy_price?: number
  sell_price?: number
}

const normalizeQuality = (quality?: string): ItemQuality =>
  ITEM_QUALITIES.includes(quality as ItemQuality) ? (quality as ItemQuality) : 'common'

const getPotionMatchKey = (item: Pick<ShopItem | CompendiumItem, 'name' | 'sub_type'>): string =>
  `${item.sub_type ?? ''}:${item.name}`

const getPotionFallbackPrice = (item: PricedCompendiumItem): number => {
  const restore =
    item.base_stats.max_hp ?? item.base_stats.max_mana ?? item.base_stats.restore ?? undefined
  return typeof restore === 'number' && restore > 0 ? Math.max(1, Math.ceil(restore / 20)) : 1
}

const toSystemPotionShopItem = (item: PricedCompendiumItem, shopPotion?: ShopItem): ShopItem => {
  const buyPrice = item.buy_price ?? shopPotion?.buy_price ?? getPotionFallbackPrice(item)

  return {
    id: item.id,
    name: item.name,
    type: 'potion',
    sub_type: item.sub_type,
    base_stats: { ...item.base_stats },
    quality: normalizeQuality(item.quality ?? shopPotion?.quality),
    required_level: item.required_level,
    icon: item.icon,
    description: item.description,
    buy_price: buyPrice,
    sell_price: item.sell_price ?? shopPotion?.sell_price ?? Math.max(1, Math.floor(buyPrice / 5)),
  }
}

const dedupeShopPotions = (items: ShopItem[]): ShopItem[] => {
  const seen = new Set<string>()
  const potions: ShopItem[] = []

  for (const item of items) {
    const key = String(item.id ?? getPotionMatchKey(item))
    if (seen.has(key)) continue
    seen.add(key)
    potions.push(item)
  }

  return potions
}

export const normalizeShopItemsWithSystemPotions = (
  shopItems: ShopItem[],
  compendiumItems?: CompendiumItem[]
): ShopItem[] => {
  const equipmentAndGems = shopItems.filter(item => item.type !== 'potion')
  const shopPotions = shopItems.filter(item => item.type === 'potion')
  const systemPotions = (compendiumItems ?? []).filter(item => item.type === 'potion')

  if (systemPotions.length === 0) {
    return [...equipmentAndGems, ...dedupeShopPotions(shopPotions)]
  }

  const shopPotionById = new Map(shopPotions.map(item => [item.id, item]))
  const shopPotionByKey = new Map(shopPotions.map(item => [getPotionMatchKey(item), item]))
  const seen = new Set<number>()
  const fixedPotions: ShopItem[] = []

  for (const potion of systemPotions) {
    if (seen.has(potion.id)) continue
    seen.add(potion.id)
    const matchingShopPotion =
      shopPotionById.get(potion.id) ?? shopPotionByKey.get(getPotionMatchKey(potion))
    fixedPotions.push(toSystemPotionShopItem(potion, matchingShopPotion))
  }

  return [...equipmentAndGems, ...fixedPotions]
}
