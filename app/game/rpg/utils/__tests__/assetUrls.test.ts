import { describe, expect, it } from 'vitest'
import { getRpgMonsterImageUrl, getRpgSkillImageUrl } from '../assetUrls'

describe('RPG asset URL compatibility', () => {
  it('maps legacy skill icon names to the current asset files', () => {
    expect(getRpgSkillImageUrl('skill_24.png')).toBe('/game/rpg/skills/eagle-eye.png')
  })

  it('maps legacy monster icon names to the current asset files', () => {
    expect(getRpgMonsterImageUrl('monster_10.png')).toBe('/game/rpg/monsters/skeleton-mage.png')
  })

  it('maps legacy remote monster urls to the current asset files', () => {
    expect(getRpgMonsterImageUrl('https://upyun.dogeow.com/game/rpg/monsters/monster_11.png')).toBe(
      'https://upyun.dogeow.com/game/rpg/monsters/bone-king.png'
    )
  })

  it('keeps current asset names unchanged', () => {
    expect(getRpgSkillImageUrl('fireball.png')).toBe('/game/rpg/skills/fireball.png')
    expect(getRpgMonsterImageUrl('wild-wolf.png')).toBe('/game/rpg/monsters/wild-wolf.png')
  })
})
