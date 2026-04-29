import { CharacterTab } from '../character/CharacterTab'
import { SkillTab } from '../skill/SkillTab'
import { WeaponTab } from '../weapon/WeaponTab'

export function ExtraTotalPlannerContent() {
  return (
    <div className="overview-stack">
      <CharacterTab showOutput={false} />
      <WeaponTab showOutput={false} />
      <SkillTab showOutput={false} />
    </div>
  )
}
