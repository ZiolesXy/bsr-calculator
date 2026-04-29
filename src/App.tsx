import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { CharacterTab } from './components/character/CharacterTab'
import { MobileBackbar } from './components/common/MobileBackbar'
import { MobileMenu } from './components/common/MobileMenu'
import { TabNavigation } from './components/common/TabNavigation'
import { ExtraTab } from './components/extra/ExtraTab'
import { SettingsTab } from './components/settings/SettingsTab'
import { SkillTab } from './components/skill/SkillTab'
import { WeaponTab } from './components/weapon/WeaponTab'
import { AppStateProvider } from './context/AppStateContext'
import { useResponsive } from './hooks/useResponsive'
import { useTheme } from './hooks/useTheme'
import { useTotalPlannerInit } from './hooks/useTotalPlannerInit'
import type {
  ExtraTabId,
  TabDefinition,
  TabId,
} from './types'
import './App.css'

const tabs: Array<TabDefinition<TabId>> = [
  { id: 'character', label: 'Character', eyebrow: 'EXP and ascension' },
  { id: 'weapon', label: 'Weapon', eyebrow: 'Tamahagane and hammers' },
  { id: 'skill', label: 'Skill', eyebrow: 'Arts and skill costs' },
  { id: 'extra', label: 'Extra', eyebrow: 'All planners in one' },
  { id: 'settings', label: 'Settings', eyebrow: 'App preferences' },
]

const extraTabs: Array<TabDefinition<ExtraTabId>> = [
  { id: 'total-planner', label: 'Total Planner', eyebrow: 'All-in-one inputs' },
  { id: 'overview', label: 'Overview', eyebrow: 'Combined summary' },
]

function AppLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('character')
  const [activeExtraTab, setActiveExtraTab] = useState<ExtraTabId>('total-planner')
  const [isExtraLoading, setIsExtraLoading] = useState(false)
  const { themeCatalog, activeTheme, setThemeId } = useTheme()
  const { isMobile, mobileScreen, setMobileScreen, showMobilePage } = useResponsive()

  useTotalPlannerInit(activeTab, activeExtraTab)

  useEffect(() => {
    if (activeTab !== 'extra' || activeExtraTab !== 'total-planner') {
      setIsExtraLoading(false)
      return
    }

    setIsExtraLoading(true)
    const timer = window.setTimeout(() => setIsExtraLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [activeExtraTab, activeTab])

  const openTab = useCallback((tabId: TabId) => {
    startTransition(() => {
      setActiveTab(tabId)
    })
    if (isMobile) {
      setMobileScreen('page')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isMobile, setMobileScreen])

  const currentLabel = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label ?? '', [activeTab])
  const handleBackToMenu = useCallback(() => setMobileScreen('menu'), [setMobileScreen])
  const activeTabContent = useMemo(() => {
    if (activeTab === 'extra' && activeExtraTab === 'total-planner' && isExtraLoading) {
      return (
        <>
          <section className="panel panel--wide extra-loading">
            <div className="extra-loading__spinner" aria-hidden="true" />
            <p className="section-tag">Extra</p>
            <h2>Preparing total planner</h2>
            <p>Loading character, weapon, and skill inputs...</p>
          </section>
          <section className="panel stats-panel extra-loading">
            <p className="section-tag">Extra Output</p>
            <div className="stat-card"><span>Status</span><strong>Loading planner...</strong></div>
            <div className="stat-card"><span>Please wait</span><strong>Preparing total output</strong></div>
          </section>
        </>
      )
    }

    if (activeTab === 'character') return <CharacterTab />
    if (activeTab === 'weapon') return <WeaponTab />
    if (activeTab === 'skill') return <SkillTab />
    if (activeTab === 'extra') {
      return (
        <ExtraTab
          activeExtraTab={activeExtraTab}
          onExtraTabChange={(tabId) => startTransition(() => setActiveExtraTab(tabId))}
          extraTabs={extraTabs}
        />
      )
    }

    return <SettingsTab themes={themeCatalog} activeTheme={activeTheme} onThemeChange={setThemeId} />
  }, [activeExtraTab, activeTab, activeTheme, isExtraLoading, setThemeId, themeCatalog])

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">BSR Resource Planner</p>
          <h1>Build modern progress calculators from your saved data.</h1>
        </div>
      </header>

      {!isMobile && <TabNavigation tabs={tabs} activeTab={activeTab} onChange={openTab} />}

      {isMobile && mobileScreen === 'menu' && <MobileMenu tabs={tabs} onSelect={openTab} />}

      {showMobilePage && (
        <main className={`content-grid ${isMobile ? 'content-grid--mobile' : ''}`}>
          {isMobile && <MobileBackbar currentLabel={currentLabel} onBack={handleBackToMenu} />}
          {activeTabContent}
        </main>
      )}
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
