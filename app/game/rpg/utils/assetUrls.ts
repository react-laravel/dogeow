import { gameAsset } from '@/lib/helpers/assets'

const LEGACY_SKILL_ICON_FILES = [
  'slash.png',
  'battle-roar.png',
  'iron-wall.png',
  'charge.png',
  'whirlwind.png',
  'rage.png',
  'iron-body.png',
  'execute.png',
  'fireball.png',
  'ice-arrow.png',
  'meteor-storm.png',
  'frost-nova.png',
  'ice-age.png',
  'mana-surge.png',
  'lightning.png',
  'chain-lightning.png',
  'thunder-wrath.png',
  'shield.png',
  'arcane-wisdom.png',
  'meteor.png',
  'pierce.png',
  'multi-shot.png',
  'gale-step.png',
  'eagle-eye.png',
  'poison.png',
  'dodge.png',
  'deadly-aim.png',
  'arrow-rain.png',
  'shadow-step.png',
  'heal.png',
  'strength-boost.png',
  'agility-boost.png',
  'vitality-boost.png',
  'energy-boost.png',
  'life-steal.png',
  'mana-regen.png',
  'hp-boost.png',
  'mp-boost.png',
] as const

const LEGACY_MONSTER_ICON_FILES = [
  'wild-boar.png',
  'wild-wolf.png',
  'forest-goblin.png',
  'giant-alpha-wolf.png',
  'treant-elder.png',
  'wild-boar-king.png',
  'cave-bat.png',
  'cave-spider.png',
  'skeleton-soldier.png',
  'skeleton-mage.png',
  'bone-king.png',
  'giant-spider.png',
  'small-demon-imp.png',
  'fire-elemental.png',
  'hell-knight.png',
  'hell-demon-king.png',
  'fire-demon.png',
  'demon-wizard.png',
  'abyss-worm.png',
  'shadow-ghost.png',
  'void-walker.png',
  'abyss-lord.png',
  'angel-guardian.png',
  'seraph.png',
  'archangel.png',
  'fallen-angel.png',
  'archangel-chief.png',
  'temple-knight.png',
  'divine-servant.png',
  'divine-messenger.png',
  'divine-general.png',
  'divine-priest.png',
  'god-king-avatar.png',
  'judgment-angel.png',
  'eternal-guardian.png',
  'time-space-rift-creature.png',
  'eternal-warrior.png',
  'eternal-mage.png',
  'eternal-king.png',
  'eternal-knight.png',
  'chaos-sprite.png',
  'void-lord.png',
  'chaos-warrior.png',
  'chaos-demon-god.png',
  'chaos-origin.png',
  'chaos-king.png',
] as const

function addOriginSuffix(fileName: string): string {
  return fileName.replace(/\.([^.]+)$/, '_origin.$1')
}

function normalizeLegacyAssetFile(
  fileName: string | null | undefined,
  kind: 'skill' | 'monster'
): string | null | undefined {
  if (!fileName || fileName.startsWith('/')) {
    return fileName
  }

  const matcher = new RegExp(`^${kind}_(\\d+)\\.(png|jpe?g|webp|gif|svg)$`, 'i')
  const replaceLegacyBasename = (input: string): string => {
    const basename = input.split('/').pop() ?? input
    const match = basename.match(matcher)
    if (!match) {
      return input
    }

    const index = Number(match[1]) - 1
    const mappedFile =
      kind === 'skill' ? LEGACY_SKILL_ICON_FILES[index] : LEGACY_MONSTER_ICON_FILES[index]

    if (!mappedFile) {
      return input
    }

    return input.endsWith(basename)
      ? `${input.slice(0, -basename.length)}${mappedFile}`
      : mappedFile
  }

  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return replaceLegacyBasename(fileName)
  }

  const match = fileName.match(matcher)
  if (!match) {
    return fileName
  }

  return replaceLegacyBasename(fileName)
}

function resolveRpgAssetUrl(baseDir: string, fileName?: string | null, useOrigin = false): string {
  if (fileName) {
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      return useOrigin ? addOriginSuffix(fileName) : fileName
    }
    const resolvedName = useOrigin ? addOriginSuffix(fileName) : fileName
    return gameAsset(fileName.startsWith('/') ? resolvedName : `${baseDir}/${resolvedName}`)
  }

  return ''
}

export function getRpgItemImageUrl(
  icon?: string | null,
  definitionId?: number | null,
  useOrigin = false
): string {
  return resolveRpgAssetUrl('/game/rpg/items', icon, useOrigin)
}

export function getRpgMonsterImageUrl(icon?: string | null, useOrigin = false): string {
  return resolveRpgAssetUrl(
    '/game/rpg/monsters',
    normalizeLegacyAssetFile(icon, 'monster'),
    useOrigin
  )
}

export function getRpgSkillImageUrl(icon?: string | null, useOrigin = false): string {
  return resolveRpgAssetUrl('/game/rpg/skills', normalizeLegacyAssetFile(icon, 'skill'), useOrigin)
}
