import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { CharacterTab } from './components/character/CharacterTab'
import { ExtraTab } from './components/extra/ExtraTab'
import { SettingsTab } from './components/settings/SettingsTab'
import { SkillTab } from './components/skill/SkillTab'
import { StampPage } from './components/stamp/StampPage'
import { WeaponTab } from './components/weapon/WeaponTab'
import { AppHeader } from './components/ui/AppHeader'
import { BottomNav } from './components/ui/BottomNav'
import { Section } from './components/ui/Section'
import { Sidebar } from './components/ui/Sidebar'
import { AppStateProvider } from './context/AppStateContext'
import { useResponsive } from './hooks/useResponsive'
import { useTheme } from './hooks/useTheme'
import { useTotalPlannerInit } from './hooks/useTotalPlannerInit'
import type { ExtraTabId, TabDefinition, TabId } from './types'
import './App.css'

const RAIL_STORAGE_KEY = 'bsr-rail'

const tabs: Array<TabDefinition<TabId>> = [
  { id: 'character', label: 'Character', eyebrow: 'EXP and ascension' },
  { id: 'weapon', label: 'Weapon', eyebrow: 'Tamahagane and hammers' },
  { id: 'skill', label: 'Skill', eyebrow: 'Arts and skill costs' },
  { id: 'stamp', label: 'Stamp', eyebrow: 'Core, set, and nexus stamp' },
  { id: 'extra', label: 'Extra', eyebrow: 'All planners in one' },
  { id: 'settings', label: 'Settings', eyebrow: 'App preferences' },
]

const extraTabs: Array<TabDefinition<ExtraTabId>> = [
  { id: 'total-planner', label: 'Total Planner', eyebrow: 'All-in-one inputs' },
  { id: 'overview', label: 'Overview', eyebrow: 'Combined summary' },
  { id: 'daily-schedule', label: 'Daily Schedule', eyebrow: 'Farming tracker' },
]

type ActiveTabContentProps = {
  activeExtraTab: ExtraTabId
  activeTab: TabId
  activeTheme: ReturnType<typeof useTheme>['activeTheme']
  isMobile: boolean
  mobileExtraScreen: 'menu' | 'page'
  onExtraTabChange: (tabId: ExtraTabId) => void
  onThemeChange: ReturnType<typeof useTheme>['setThemeId']
  themeCatalog: ReturnType<typeof useTheme>['themeCatalog']
}

function MobileExtraMenu({ onExtraTabChange }: { onExtraTabChange: (tabId: ExtraTabId) => void }) {
  return (
    <Section
      eyebrow="Extra"
      title="Choose a tool"
      description="Open the all-in-one planner, the combined overview, or the daily farming schedule."
    >
      <div className="choice-list">
        {extraTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="choice-row"
            onClick={() => onExtraTabChange(tab.id)}
          >
            <div>
              <small>{tab.eyebrow}</small>
              <strong>{tab.label}</strong>
            </div>
            <ChevronRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </Section>
  )
}

function ActiveTabContent({
  activeExtraTab,
  activeTab,
  activeTheme,
  isMobile,
  mobileExtraScreen,
  onExtraTabChange,
  onThemeChange,
  themeCatalog,
}: ActiveTabContentProps) {
  switch (activeTab) {
    case 'character':
      return <CharacterTab />
    case 'weapon':
      return <WeaponTab />
    case 'skill':
      return <SkillTab />
    case 'stamp':
      return <StampPage />
    case 'extra':
      if (isMobile && mobileExtraScreen === 'menu') {
        return <MobileExtraMenu onExtraTabChange={onExtraTabChange} />
      }

      return (
        <ExtraTab
          activeExtraTab={activeExtraTab}
          onExtraTabChange={onExtraTabChange}
          extraTabs={extraTabs}
          showExtraTabNavigation={!isMobile}
        />
      )
    case 'settings':
      return <SettingsTab themes={themeCatalog} activeTheme={activeTheme} onThemeChange={onThemeChange} />
  }
}

function AppLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('character')
  const [activeExtraTab, setActiveExtraTab] = useState<ExtraTabId>('total-planner')
  const [mobileExtraScreen, setMobileExtraScreen] = useState<'menu' | 'page'>('menu')
  const [railOpen, setRailOpen] = useState(() => localStorage.getItem(RAIL_STORAGE_KEY) === 'open')
  const { themeCatalog, activeTheme, setThemeId } = useTheme()
  const { isMobile } = useResponsive()

  useTotalPlannerInit(activeTab, activeExtraTab)

  useEffect(() => {
    localStorage.setItem(RAIL_STORAGE_KEY, railOpen ? 'open' : 'closed')
  }, [railOpen])

  const openTab = useCallback((tabId: TabId) => {
    startTransition(() => {
      setActiveTab(tabId)
      if (tabId === 'extra') {
        setMobileExtraScreen('menu')
      }
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const currentTab = useMemo(() => tabs.find((tab) => tab.id === activeTab), [activeTab])
  const activeExtraTabDefinition = useMemo(
    () => extraTabs.find((tab) => tab.id === activeExtraTab),
    [activeExtraTab],
  )

  const showExtraBack = isMobile && activeTab === 'extra' && mobileExtraScreen === 'page'

  const handleBack = useCallback(() => {
    if (showExtraBack) {
      setMobileExtraScreen('menu')
    }
  }, [showExtraBack])

  const openExtraTab = useCallback(
    (tabId: ExtraTabId) => {
      startTransition(() => setActiveExtraTab(tabId))
      if (isMobile) {
        setMobileExtraScreen('page')
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [isMobile],
  )

  const openSettings = useCallback(() => openTab('settings'), [openTab])

  const headerTitle = showExtraBack
    ? (activeExtraTabDefinition?.label ?? currentTab?.label ?? '')
    : (currentTab?.label ?? '')
  const headerContext = showExtraBack
    ? (activeExtraTabDefinition?.eyebrow ?? currentTab?.eyebrow)
    : currentTab?.eyebrow

  return (
    <div className="app-shell" data-rail={railOpen ? 'open' : 'closed'}>
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          onChange={openTab}
          onOpenTheme={openSettings}
          onToggle={() => setRailOpen((previous) => !previous)}
          open={railOpen}
          tabs={tabs}
          theme={activeTheme}
        />
      )}

      <div className="app-body">
        <AppHeader
          backLabel={showExtraBack ? 'Back to Extra' : undefined}
          context={headerContext}
          onBack={showExtraBack ? handleBack : undefined}
          onOpenSettings={openSettings}
          settingsActive={activeTab === 'settings'}
          theme={activeTheme}
          title={headerTitle}
        />

        <main className={`workspace ${isMobile ? 'workspace--mobile' : 'workspace--desktop'}`}>
          <div className={`content-grid ${isMobile ? 'content-grid--mobile' : ''}`}>
            <ActiveTabContent
              activeExtraTab={activeExtraTab}
              activeTab={activeTab}
              activeTheme={activeTheme}
              isMobile={isMobile}
              mobileExtraScreen={mobileExtraScreen}
              onExtraTabChange={openExtraTab}
              onThemeChange={setThemeId}
              themeCatalog={themeCatalog}
            />
          </div>
        </main>

        {isMobile && <BottomNav activeTab={activeTab} onChange={openTab} tabs={tabs} />}
      </div>
    </div>
  )
}

function App() {
  return (
    <AppStateProvider>
      <AppLayout />
    </AppStateProvider>
  )
}

export default App
