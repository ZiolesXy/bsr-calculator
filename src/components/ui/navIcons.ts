import {
  LayoutGrid,
  Settings2,
  Sparkles,
  Stamp,
  Sword,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { TabId } from '../../types'

export const navIcons: Record<TabId, LucideIcon> = {
  character: UserRound,
  weapon: Sword,
  skill: Sparkles,
  stamp: Stamp,
  extra: LayoutGrid,
  settings: Settings2,
}
