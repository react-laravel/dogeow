import type { CharacterClass, EquipmentSlot } from '../../types'

/** 各职业的全身立绘（仿传奇世界 F10 装备界面） */
export const CHARACTER_PORTRAITS: Record<CharacterClass, string> = {
  warrior: '/game/rpg/characters/warrior.jpg',
  mage: '/game/rpg/characters/mage.jpg',
  ranger: '/game/rpg/characters/ranger.jpg',
}

/**
 * 纸娃娃槽位布局：人物居中，装备槽贴对应身体部位排布。
 * 左列：武器（持械手）、手套、腰带；右列：护符（颈部）、衣服（躯干）、戒指；
 * 顶部居中：头盔；底部居中：靴子。
 */
export const PAPER_DOLL_SLOTS: Array<{
  slot: EquipmentSlot
  label?: string
  className: string
}> = [
  { slot: 'helmet', className: 'left-1/2 top-2 -translate-x-1/2' },
  { slot: 'weapon', className: 'left-2 top-[16%]' },
  { slot: 'gloves', className: 'left-2 top-[42%]' },
  { slot: 'belt', className: 'left-2 top-[68%]' },
  { slot: 'amulet', label: '护符', className: 'right-2 top-[16%]' },
  { slot: 'armor', className: 'right-2 top-[42%]' },
  { slot: 'ring', label: '戒指', className: 'right-2 top-[68%]' },
  { slot: 'boots', className: 'bottom-2 left-1/2 -translate-x-1/2' },
]
