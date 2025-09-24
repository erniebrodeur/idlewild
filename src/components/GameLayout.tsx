import React from 'react'
import GameHeader from './GameHeader'
import ResourcesSidebar from './ResourcesSidebar'
import SurvivalStatus from './SurvivalStatus'
import ForageButtons from './ForageButtons'
import CampfirePanel from './CampfirePanel'
import ExpeditionPanel from './ExpeditionPanel'
import TechnologyPanel from './TechnologyPanel'
import SettingsPanel from './SettingsPanel'
import DebugPanel from './DebugPanel'
import TabsContainer, { TabDefinition } from './TabsContainer'
import { GameState } from '../types/GameTypes'

interface GameLayoutProps {
  state: GameState
  showSettings: boolean
  showDebug: boolean
  onShowSettings: () => void
  onShowDebug: () => void
  onCloseSettings: () => void
  onCloseDebug: () => void
  consumeResource: (resourceId: string, amount: number) => void
  lightCampfire: () => void
  startExploration: (duration: number) => void
  clickGather: (resourceId: string, amount: number) => void
  purchaseUpgrade: (upgId: string) => void
  buyProducer: (pid: string) => void
  reset: () => void
  setState: React.Dispatch<React.SetStateAction<GameState>>
}

export default function GameLayout({
  state,
  showSettings,
  showDebug,
  onShowSettings,
  onShowDebug,
  onCloseSettings,
  onCloseDebug,
  consumeResource,
  lightCampfire,
  startExploration,
  clickGather,
  purchaseUpgrade,
  buyProducer,
  reset,
  setState
}: GameLayoutProps) {
  // Define tab structure similar to Theory of Magic
  const tabs: TabDefinition[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SurvivalStatus
            needs={state.survival.needs}
            resources={state.resources}
            consumeResource={consumeResource}
          />
          <ForageButtons
            clickGather={clickGather}
          />
        </div>
      )
    },
    {
      id: 'survival',
      label: 'Survival',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SurvivalStatus
            needs={state.survival.needs}
            resources={state.resources}
            consumeResource={consumeResource}
          />
          <CampfirePanel
            campfire={state.survival.campfire}
            resources={state.resources}
            lightCampfire={lightCampfire}
          />
        </div>
      )
    },
    {
      id: 'exploration',
      label: 'Exploration',
      content: (
        <ExpeditionPanel
          exploration={state.survival.exploration}
          resources={state.resources}
          needs={state.survival.needs}
          startExploration={startExploration}
          clickGather={clickGather}
        />
      )
    },
    {
      id: 'technology',
      label: 'Technology',
      content: (
        <TechnologyPanel
          upgradesDiscovered={state.upgradesDiscovered}
          upgradesPurchased={state.upgradesPurchased}
          producers={state.producers}
          resources={state.resources}
          purchaseUpgrade={purchaseUpgrade}
          buyProducer={buyProducer}
        />
      )
    }
  ]

  return (
    <div className="game-root" style={{ 
      padding: '1rem', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Header */}
      <GameHeader
        onShowSettings={onShowSettings}
        onShowDebug={onShowDebug}
      />
      
      {/* Main Layout */}
      <div style={{ 
        display: 'flex',
        gap: '2rem',
        flex: 1,
        minHeight: 0 // Important for proper flex behavior
      }}>
        {/* Left Sidebar */}
        <ResourcesSidebar
          resources={state.resources}
        />

        {/* Main Content with Tabs */}
        <div style={{ 
          flex: 1,
          minHeight: 0 // Important for proper flex behavior
        }}>
          <TabsContainer 
            tabs={tabs} 
            defaultTab="overview"
          />
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        onClose={onCloseSettings}
        gameState={state}
        onReset={reset}
      />

      {/* Debug Panel */}
      <DebugPanel
        isVisible={showDebug}
        onClose={onCloseDebug}
        gameState={state}
        onGameStateChange={setState}
      />
    </div>
  )
}