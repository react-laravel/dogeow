'use client'

import { useCallback } from 'react'
import type { SkillEffectProps } from './types'
import { MeteorStormEffect } from './MeteorStormEffect'
import { FireballEffect } from './FireballEffect'
import { IceArrowEffect } from './IceArrowEffect'
import { BlackholeEffect } from './BlackholeEffect'
import { LightningEffect } from './LightningEffect'
import { MeteorEffect } from './MeteorEffect'
import { ChainLightningEffect } from './ChainLightningEffect'
import { IceAgeEffect } from './IceAgeEffect'

export type { SkillEffectType, SkillEffectProps } from './types'
export { MeteorStormEffect } from './MeteorStormEffect'
export { FireballEffect } from './FireballEffect'
export { IceArrowEffect } from './IceArrowEffect'
export { IceAgeEffect } from './IceAgeEffect'
export { BlackholeEffect } from './BlackholeEffect'
export { LightningEffect } from './LightningEffect'
export { MeteorEffect } from './MeteorEffect'
export { ChainLightningEffect } from './ChainLightningEffect'

/** 技能特效组件 */
export function SkillEffect({
  type,
  active,
  targetPosition,
  targetPositions,
  onComplete,
  onHit,
  className = '',
}: SkillEffectProps) {
  const handleComplete = useCallback(() => {
    if (onComplete) onComplete()
  }, [onComplete])

  const effectProps = {
    active,
    onComplete: handleComplete,
    onHit,
    targetPosition,
    targetPositions,
  }

  return (
    <div className={`${className}`}>
      {type === 'meteor-storm' && <MeteorStormEffect {...effectProps} />}
      {type === 'fireball' && <FireballEffect {...effectProps} />}
      {type === 'ice-arrow' && <IceArrowEffect {...effectProps} />}
      {type === 'ice-age' && <IceAgeEffect {...effectProps} />}
      {type === 'blackhole' && <BlackholeEffect {...effectProps} />}
      {type === 'lightning' && <LightningEffect {...effectProps} />}
      {type === 'meteor' && <MeteorEffect {...effectProps} />}
      {type === 'chain-lightning' && <ChainLightningEffect {...effectProps} />}
    </div>
  )
}
