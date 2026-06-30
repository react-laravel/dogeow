import type { CharacterClass, EquipmentSlot } from '../../types'

/** 各职业的全身立绘（仿传奇世界 F10 装备界面） */
export const CHARACTER_PORTRAITS: Record<CharacterClass, string> = {
  warrior: '/game/rpg/characters/warrior.jpg',
  mage: '/game/rpg/characters/mage.jpg',
  ranger: '/game/rpg/characters/ranger.jpg',
}

/**
 * 纸娃娃槽位布局：人物居中，装备槽分列左右四行。
 * 左列：头盔、武器、手套、靴子；右列：护符、衣服、戒指、腰带。
 */
export const PAPER_DOLL_SLOTS: Array<{
  slot: EquipmentSlot
  label?: string
  className: string
}> = [
  { slot: 'helmet', className: 'left-2 top-[13%]' },
  { slot: 'weapon', className: 'left-2 top-[34%]' },
  { slot: 'gloves', className: 'left-2 top-[56%]' },
  { slot: 'boots', className: 'left-2 top-[76%]' },
  { slot: 'amulet', label: '护符', className: 'right-2 top-[13%]' },
  { slot: 'armor', className: 'right-2 top-[34%]' },
  { slot: 'ring', label: '戒指', className: 'right-2 top-[56%]' },
  { slot: 'belt', className: 'right-2 top-[76%]' },
]
