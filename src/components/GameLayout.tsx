import React from 'react'
import ResourcesSidebar from './ResourcesSidebar'
import SurvivalStatus from './SurvivalStatus'
import CampfirePanel from './CampfirePanel'
import ExplorationPanel from './ExplorationPanel'
import TechnologyPanel from './TechnologyPanel'
import SettingsPanel from './SettingsPanel'
import DebugPanel from './DebugPanel'
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
  return (
    <div className="game-root" style={{ 
      padding: '1rem', 
      minHeight: '100vh',
      display: 'flex',
      gap: '2rem'
    }}>
      {/* Left Sidebar */}
      <ResourcesSidebar
        daysSurvived={state.daysSurvived}
        needs={state.survival.needs}
        resources={state.resources}
        onShowSettings={onShowSettings}
        onShowDebug={onShowDebug}
      />

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        gap: '2rem'
      }}>
        {/* Left Column */}
        <div style={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem' 
        }}>
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

        {/* Right Column */}
        <div style={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem' 
        }}>
          <ExplorationPanel
            exploration={state.survival.exploration}
            resources={state.resources}
            needs={state.survival.needs}
            startExploration={startExploration}
            clickGather={clickGather}
          />

          <TechnologyPanel
            upgradesDiscovered={state.upgradesDiscovered}
            upgradesPurchased={state.upgradesPurchased}
            producers={state.producers}
            resources={state.resources}
            purchaseUpgrade={purchaseUpgrade}
            buyProducer={buyProducer}
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