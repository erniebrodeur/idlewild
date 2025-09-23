import React, { useState } from 'react'
import './index.css'
import GameLayout from './components/GameLayout'
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
  
  return (
    <GameLayout
      state={state}
      showSettings={showSettings}
      showDebug={showDebug}
      onShowSettings={() => setShowSettings(true)}
      onShowDebug={() => setShowDebug(true)}
      onCloseSettings={() => setShowSettings(false)}
      onCloseDebug={() => setShowDebug(false)}
      consumeResource={consumeResource}
      lightCampfire={lightCampfire}
      startExploration={startExploration}
      clickGather={clickGather}
      purchaseUpgrade={purchaseUpgrade}
      buyProducer={buyProducer}
      reset={reset}
      setState={setState}
    />
  )
}
