import { describe, expect, it } from 'vitest'
import { getRpgMonsterImageUrl, getRpgSkillImageUrl } from '../assetUrls'

describe('RPG asset URL resolution', () => {
  it('builds local monster and skill asset paths', () => {
    expect(getRpgMonsterImageUrl('wild-wolf.png')).toBe('/game/rpg/monsters/wild-wolf.png')
    expect(getRpgSkillImageUrl('fireball.png')).toBe('/game/rpg/skills/fireball.png')
  })

  it('keeps remote asset urls unchanged', () => {
    expect(getRpgMonsterImageUrl('https://upyun.dogeow.com/game/rpg/monsters/bone-king.png')).toBe(
      'https://upyun.dogeow.com/game/rpg/monsters/bone-king.png'
    )
  })
})
