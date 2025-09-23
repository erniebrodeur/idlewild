import React, { useState } from 'react'
import './index.css'
import ProducerList from './components/ProducerList'
import ResourceList from './components/ResourceList'
import UpgradeList from './components/UpgradeList'
import SettingsPanel from './components/SettingsPanel'
import DebugPanel from './components/DebugPanel'
import GameHeader from './components/GameHeader'
import SurvivalStatus from './components/SurvivalStatus'
import CampfirePanel from './components/CampfirePanel'
import ExplorationPanel from './components/ExplorationPanel'
import { useIncrementalGame } from './hooks/useIncrementalGame'

/*
  Simple incremental core inspired by Theory of Magic / The Kitten Game:
  - Multiple resources
  - Multiple producer types
  - Idle tick, offline progress, autosave
  - Buying producers and level upgrades
  This is intentionally small and extensible.
*/

export default function App() {
  const { state, setState, buyProducer, clickGather, reset, purchaseUpgrade, lightCampfire, startExploration, consumeResource } = useIncrementalGame()
  const [showSettings, setShowSettings] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  
  // Get critical survival status
  const criticalNeeds = state.survival.needs.filter(n => n.current <= n.criticalThreshold)
  const survivalStatus = criticalNeeds.length > 0 ? 'critical' : 'stable'
  
  return (
    <div className="game-root" style={{ 
      padding: '1rem 2rem', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <GameHeader
        daysSurvived={state.daysSurvived}
        needs={state.survival.needs}
        onShowSettings={() => setShowSettings(true)}
        onShowDebug={() => setShowDebug(true)}
      />

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Resources */}
          <div className="panel">
            <h2 style={{ marginBottom: '1rem' }}>📦 Resources</h2>
            <ResourceList resources={state.resources} />
          </div>

          {/* Survival Status */}
          <SurvivalStatus
            needs={state.survival.needs}
            resources={state.resources}
            consumeResource={consumeResource}
          />

          {/* Campfire Section */}
          <CampfirePanel
            campfire={state.survival.campfire}
            resources={state.resources}
            lightCampfire={lightCampfire}
          />
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Exploration */}
          <ExplorationPanel
            exploration={state.survival.exploration}
            resources={state.resources}
            needs={state.survival.needs}
            startExploration={startExploration}
            clickGather={clickGather}
          />

          {/* Technology & Equipment */}
          <div className="panel">
            <h2 style={{ marginBottom: '1rem' }}>🛠️ Technology & Equipment</h2>
            <UpgradeList
              upgradesDiscovered={state.upgradesDiscovered}
              upgradesPurchased={state.upgradesPurchased}
              resources={state.resources}
              purchaseUpgrade={purchaseUpgrade}
            />
            <div style={{ marginTop: '1.5rem' }}>
              <ProducerList
                producers={state.producers}
                upgradesPurchased={state.upgradesPurchased}
                resources={state.resources}
                buyProducer={buyProducer}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        gameState={state}
        onReset={reset}
      />

      {/* Debug Panel */}
      <DebugPanel
        isVisible={showDebug}
        onClose={() => setShowDebug(false)}
        gameState={state}
        onGameStateChange={setState}
      />
    </div>
  )
}
