import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { CharacterTab } from './components/character/CharacterTab'
import { MobileBackbar } from './components/common/MobileBackbar'
import { MobileMenu } from './components/common/MobileMenu'
import { ExtraTab } from './components/extra/ExtraTab'
import { SettingsTab } from './components/settings/SettingsTab'
import { SkillTab } from './components/skill/SkillTab'
import { WeaponTab } from './components/weapon/WeaponTab'
import { AppStateProvider } from './context/AppStateContext'
import { useResponsive } from './hooks/useResponsive'
import { useTheme } from './hooks/useTheme'
import { useTotalPlannerInit } from './hooks/useTotalPlannerInit'
import { MobileNav } from './components/ui/MobileNav'
import { Section } from './components/ui/Section'
import type {
  ExtraTabId,
  TabDefinition,
  TabId,
} from './types'
import { Card } from './components/ui/Card'
import { Sidebar } from './components/ui/Sidebar'
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
  { id: 'daily-schedule', label: 'Daily Schedule', eyebrow: 'Farming tracker' },
]

type ActiveTabContentProps = {
  activeExtraTab: ExtraTabId
  activeTab: TabId
  activeTheme: ReturnType<typeof useTheme>['activeTheme']
  isExtraLoading: boolean
  isMobile: boolean
  mobileExtraScreen: 'menu' | 'page'
  onExtraTabChange: (tabId: ExtraTabId) => void
  onThemeChange: ReturnType<typeof useTheme>['setThemeId']
  themeCatalog: ReturnType<typeof useTheme>['themeCatalog']
}

function ExtraLoadingContent() {
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

function MobileExtraMenu({ onExtraTabChange }: { onExtraTabChange: (tabId: ExtraTabId) => void }) {
  return (
    <Section
      eyebrow="Extra"
      title="Pilih tools extra"
      description="Menu ini memisahkan planner utama, overview, dan daily schedule."
      className="mobile-menu"
    >
      <MobileNav onChange={onExtraTabChange} tabs={extraTabs} />
    </Section>
  )
}

function ActiveTabContent({
  activeExtraTab,
  activeTab,
  activeTheme,
  isExtraLoading,
  isMobile,
  mobileExtraScreen,
  onExtraTabChange,
  onThemeChange,
  themeCatalog,
}: ActiveTabContentProps) {
  const shouldShowExtraLoading =
    activeTab === 'extra' &&
    activeExtraTab === 'total-planner' &&
    isExtraLoading &&
    (!isMobile || mobileExtraScreen === 'page')

  if (shouldShowExtraLoading) return <ExtraLoadingContent />

  switch (activeTab) {
    case 'character':
      return <CharacterTab />
    case 'weapon':
      return <WeaponTab />
    case 'skill':
      return <SkillTab />
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
  const [isExtraLoading, setIsExtraLoading] = useState(false)
  const { themeCatalog, activeTheme, setThemeId } = useTheme()
  const { isMobile, mobileScreen, setMobileScreen, showMobilePage } = useResponsive()

  useTotalPlannerInit(activeTab, activeExtraTab)

  useEffect(() => {
    if (activeTab !== 'extra' || activeExtraTab !== 'total-planner' || (isMobile && mobileExtraScreen !== 'page')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the loading flag when the planner is not visible
      setIsExtraLoading(false)
      return
    }

    setIsExtraLoading(true)
    const timer = window.setTimeout(() => setIsExtraLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [activeExtraTab, activeTab, isMobile, mobileExtraScreen])

  const openTab = useCallback((tabId: TabId) => {
    startTransition(() => {
      setActiveTab(tabId)
      if (tabId === 'extra') {
        setMobileExtraScreen('menu')
      }
    })
    if (isMobile) {
      setMobileScreen('page')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isMobile, setMobileScreen])

  const currentLabel = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label ?? '', [activeTab])
  const activeExtraLabel = useMemo(
    () => extraTabs.find((tab) => tab.id === activeExtraTab)?.label ?? '',
    [activeExtraTab],
  )
  const activeEyebrow = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.eyebrow ?? '', [activeTab])
  const handleBackToMenu = useCallback(() => {
    if (isMobile && activeTab === 'extra' && mobileExtraScreen === 'page') {
      setMobileExtraScreen('menu')
      return
    }

    setMobileScreen('menu')
  }, [activeTab, isMobile, mobileExtraScreen, setMobileScreen])
  const openExtraTab = useCallback((tabId: ExtraTabId) => {
    startTransition(() => setActiveExtraTab(tabId))
    if (isMobile) {
      setMobileExtraScreen('page')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isMobile])
  return (
    <div className="app-shell">
      {!isMobile && (
        <Sidebar
          activeTab={activeTab}
          description="This is a material calculator app for character builds in the game Bleach: Soul Resonance."
          footer={
            <div className="sidebar-meta">
              <div>
                <p className="ui-eyebrow">Active Theme</p>
                <strong>{activeTheme.label}</strong>
              </div>
              <p>{activeTheme.description}</p>
            </div>
          }
          onChange={openTab}
          tabs={tabs}
          title="BSR Calculator"
        />
      )}

      {isMobile && mobileScreen === 'menu' && <MobileMenu tabs={tabs} onSelect={openTab} />}

      {showMobilePage && (
        <main className={`workspace ${isMobile ? 'workspace--mobile' : 'workspace--desktop'}`}>
          <Card className="workspace-hero">
            <div className="workspace-hero__copy">
              <p className="ui-eyebrow">BSR Resource Planner</p>
              <h1>{currentLabel}</h1>
              <p className="workspace-hero__description">
                {activeEyebrow || 'Modern resource calculator dashboard'}{isMobile ? ' - mobile view.' : ' - organized as a desktop workspace.'}
              </p>
            </div>
            <div className="workspace-hero__meta">
              <div className="workspace-pill">
                <span>Theme</span>
                <strong>{activeTheme.label}</strong>
              </div>
              <div className="workspace-pill">
                <span>Mode</span>
                <strong>{isMobile ? 'Mobile' : 'Desktop'}</strong>
              </div>
            </div>
          </Card>

          {isMobile && (
            <MobileBackbar
              backLabel={activeTab === 'extra' && mobileExtraScreen === 'page' ? 'Back to Extra' : 'Back to main menu'}
              currentLabel={activeTab === 'extra' && mobileExtraScreen === 'page' ? activeExtraLabel : currentLabel}
              onBack={handleBackToMenu}
            />
          )}

          <div className={`content-grid ${isMobile ? 'content-grid--mobile' : ''}`}>
            <ActiveTabContent
              activeExtraTab={activeExtraTab}
              activeTab={activeTab}
              activeTheme={activeTheme}
              isExtraLoading={isExtraLoading}
              isMobile={isMobile}
              mobileExtraScreen={mobileExtraScreen}
              onExtraTabChange={openExtraTab}
              onThemeChange={setThemeId}
              themeCatalog={themeCatalog}
            />
          </div>
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
