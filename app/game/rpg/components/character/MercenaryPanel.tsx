'use client'

import { Shield, Swords, WandSparkles, X } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import {
  MERCENARY_DEFINITIONS,
  type Mercenary,
  type MercenaryRole,
  type MercenaryDefinition,
} from '../../types'

const MERCENARY_ROLES: MercenaryRole[] = ['guard', 'marksman', 'mystic']

const roleIcon = {
  guard: Shield,
  marksman: Swords,
  mystic: WandSparkles,
} satisfies Record<MercenaryRole, typeof Shield>

export function MercenaryPanel() {
  const { character, mercenary, hireMercenary, dismissMercenary } = useGameStore()

  if (!character) return null

  return (
    <div className="bg-card border-border mx-[var(--rpg-content-inset)] rounded-lg border p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-foreground text-base font-medium sm:text-lg">雇佣兵</h4>
        {mercenary && (
          <button
            type="button"
            onClick={dismissMercenary}
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded transition-colors"
            aria-label="解雇雇佣兵"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {mercenary ? (
        <HiredMercenaryCard mercenary={mercenary} />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MERCENARY_ROLES.map(role => (
            <MercenaryRecruitButton
              key={role}
              definition={MERCENARY_DEFINITIONS[role]}
              onHire={() => hireMercenary(role)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HiredMercenaryCard({ mercenary }: { mercenary: Mercenary }) {
  const Icon = roleIcon[mercenary.role]

  return (
    <div className="border-border bg-muted/40 rounded-lg border p-3">
      <div className="mb-3 flex items-start gap-3">
        <div className="border-border bg-background flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="text-primary h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h5 className="text-foreground truncate text-sm font-semibold">{mercenary.name}</h5>
            <span className="text-muted-foreground shrink-0 text-xs">Lv.{mercenary.level}</span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{mercenary.skill_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <MercenaryStat label="生命" value={mercenary.max_hp} />
        <MercenaryStat label="攻击" value={mercenary.attack} />
        <MercenaryStat label="防御" value={mercenary.defense} />
        <MercenaryStat label="暴击" value={`${(mercenary.crit_rate * 100).toFixed(0)}%`} />
      </div>
    </div>
  )
}

function MercenaryRecruitButton({
  definition,
  onHire,
}: {
  definition: MercenaryDefinition
  onHire: () => void
}) {
  const Icon = roleIcon[definition.role]

  return (
    <button
      type="button"
      onClick={onHire}
      className="border-border bg-muted/30 hover:border-primary/60 hover:bg-muted flex min-h-[8rem] flex-col rounded-lg border p-3 text-left transition-colors"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className="text-primary h-4 w-4" />
        <span className="text-foreground text-sm font-semibold">{definition.name}</span>
      </div>
      <p className="text-muted-foreground text-xs font-medium">{definition.title}</p>
      <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">{definition.description}</p>
      <span className="text-primary mt-auto pt-3 text-xs font-medium">{definition.skillName}</span>
    </button>
  )
}

function MercenaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-background/80 rounded px-1.5 py-2">
      <div className="text-muted-foreground text-[10px]">{label}</div>
      <div className="text-foreground truncate text-sm font-semibold">{value}</div>
    </div>
  )
}
