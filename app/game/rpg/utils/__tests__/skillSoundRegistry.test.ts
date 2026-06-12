import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getAllSkillSoundUrls, getSkillSoundUrl, skillSoundManifest } from '../skillSoundRegistry'

describe('skillSoundRegistry', () => {
  it('returns a specific sound for a known skill name', () => {
    expect(getSkillSoundUrl({ name: '火球术', effect_key: 'fireball' })).toBe(
      '/game/rpg/sfx/fireball-ember.mp3'
    )
  })

  it('falls back to effect_key when the skill name is unknown', () => {
    expect(getSkillSoundUrl({ name: '未知技能', effect_key: 'meteor' })).toBe(
      '/game/rpg/sfx/meteor-impact-fall.mp3'
    )
  })

  it('returns null for an unmapped skill', () => {
    expect(getSkillSoundUrl({ name: '未知技能', effect_key: 'unknown-effect' })).toBeNull()
  })

  it('returns preloaded urls for every manifest entry', () => {
    expect(getAllSkillSoundUrls()).toHaveLength(skillSoundManifest.length)
    expect(getAllSkillSoundUrls()[0]).toMatch(/^\/game\/rpg\/sfx\//)
  })

  it('points every manifest entry at an existing public audio file', () => {
    for (const url of getAllSkillSoundUrls()) {
      expect(existsSync(join(process.cwd(), 'public', url))).toBe(true)
    }
  })
})
