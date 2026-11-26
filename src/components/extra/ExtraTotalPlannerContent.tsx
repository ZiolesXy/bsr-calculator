import { CharacterTab } from '../character/CharacterTab'
import { SkillTab } from '../skill/SkillTab'
import { StampTab } from '../stamp/StampTab'
import { WeaponTab } from '../weapon/WeaponTab'

export function ExtraTotalPlannerContent() {
  return (
    <div className="overview-stack">
      <CharacterTab showOutput={false} />
      <WeaponTab showOutput={false} />
      <SkillTab showOutput={false} />
      <StampTab kind="core" showOutput={false} />
      <StampTab kind="set" showOutput={false} />
    </div>
  )
}
