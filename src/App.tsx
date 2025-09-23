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
      padding: '1rem', 
      minHeight: '100vh',
      display: 'flex',
      gap: '2rem'
    }}>
      {/* Left Sidebar - Header and Resources */}
      <div style={{ 
        width: '300px',
        flexShrink: 0
      }}>
        <GameHeader
          daysSurvived={state.daysSurvived}
          needs={state.survival.needs}
          onShowSettings={() => setShowSettings(true)}
          onShowDebug={() => setShowDebug(true)}
        />
        
        {/* Resources */}
        <div className="panel" style={{ marginTop: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>📦 Resources</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {state.resources.filter(r => r.discovered).map(resource => (
              <div key={resource.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '1rem',
                color: '#ccc'
              }}>
                <span>{resource.name}</span>
                <span style={{ color: '#87ceeb', fontWeight: 'bold' }}>
                  {Math.floor(resource.amount * 10) / 10}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Flexible Width */}
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
