import React, { useEffect, useRef, useState } from 'react'
import './index.css'

type GameState = {
  coins: number
  producers: number
  producerLevel: number
  lastSaved: number
}

const SAVE_KEY = 'idlewild:v1'

function defaultState(): GameState {
  return { coins: 0, producers: 0, producerLevel: 1, lastSaved: Date.now() }
}

function useIdleGame() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) return JSON.parse(raw) as GameState
    } catch {}
    return defaultState()
  })

  // passive income every second
  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        if (s.producers > 0) {
          const gain = s.producers * s.producerLevel
          return { ...s, coins: s.coins + gain }
        }
        return s
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // save periodically
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSaved: Date.now() }))
    }, 5000)
    return () => clearInterval(interval)
  }, [state])

  // apply offline progress on load (once)
  useEffect(() => {
    const now = Date.now()
    const dt = Math.floor((now - state.lastSaved) / 1000)
    if (dt > 0 && state.producers > 0) {
      const gain = dt * state.producers * state.producerLevel
      setState((s) => ({ ...s, coins: s.coins + gain }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function clickGain(amount = 1) {
    setState((s) => ({ ...s, coins: s.coins + amount }))
  }

  function buyProducer() {
    setState((s) => {
      const cost = Math.ceil(10 * Math.pow(1.15, s.producers))
      if (s.coins < cost) return s
      return { ...s, coins: s.coins - cost, producers: s.producers + 1 }
    })
  }

  function upgradeProducers() {
    setState((s) => {
      const cost = 100 * s.producerLevel
      if (s.coins < cost) return s
      return { ...s, coins: s.coins - cost, producerLevel: s.producerLevel + 1 }
    })
  }

  function reset() {
    setState(defaultState())
    localStorage.removeItem(SAVE_KEY)
  }

  return { state, clickGain, buyProducer, upgradeProducers, reset }
}

export default function App() {
  const { state, clickGain, buyProducer, upgradeProducers, reset } = useIdleGame()

  const nextProducerCost = Math.ceil(10 * Math.pow(1.15, state.producers))
  const upgradeCost = 100 * state.producerLevel

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Idlewild</h1>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div>
          <button
            style={{ fontSize: '1.25rem', padding: '1rem 1.5rem' }}
            onClick={() => clickGain(1)}
          >
            Click (+1)
          </button>
          <div style={{ marginTop: '0.5rem' }}>Coins: {Math.floor(state.coins)}</div>
          <div>Producers: {state.producers} (x{state.producerLevel})</div>
        </div>

        <div>
          <div style={{ marginBottom: '0.5rem' }}>
            <button onClick={buyProducer} disabled={state.coins < nextProducerCost}>
              Buy Producer — cost: {nextProducerCost}
            </button>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <button onClick={upgradeProducers} disabled={state.coins < upgradeCost}>
              Upgrade Producers — cost: {upgradeCost}
            </button>
          </div>
          <div>
            <button onClick={reset}>Reset</button>
          </div>
        </div>
      </div>

      <p style={{ marginTop: '1.5rem', color: '#666' }}>
        Passive income: {state.producers * state.producerLevel} coins / sec
      </p>
      <p style={{ color: '#666' }}>
        Save happens automatically every 5s. Offline progress is applied on load (capped by save interval).
      </p>
    </div>
  )
}
