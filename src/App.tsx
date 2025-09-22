import React, { useEffect, useRef, useState } from 'react'
import './index.css'
import ResourceList from './components/ResourceList'
import gameData from './data/game-data.json'

/*
  Simple incremental core inspired by Theory of Magic / The Kitten Game:
  - Multiple resources
  - Multiple producer types
  - Idle tick, offline progress, autosave
  - Buying producers and level upgrades
  This is intentionally small and extensible.
*/

type Resource = {
  id: string
  name: string
  amount: number
}

type Producer = {
  id: string
  name: string
  resource: string // resource id it produces
  count: number
  baseCost: number
  growth: number
  power: number // production per tick per producer (before level)
}

type GameState = {
  resources: Resource[]
  producers: Producer[]
  producerLevel: number
  upgradesPurchased: string[]
  lastSaved: number
}

const SAVE_KEY = 'idlewild:v2'

function defaultState(): GameState {
  // Initialize from JSON game data file and attach lastSaved
  const resources = (gameData.resources || []).map((r: any) => ({ ...r }))
  const producers = (gameData.producers || []).map((p: any) => ({ ...p }))
  const producerLevel = gameData.producerLevel || 1
  return { resources, producers, producerLevel, upgradesPurchased: [], lastSaved: Date.now() }
}

function useIncrementalGame(tickInterval = 1000) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const savedState = JSON.parse(raw) as GameState
        // Ensure upgradesPurchased is always an array
        if (!Array.isArray(savedState.upgradesPurchased)) {
          savedState.upgradesPurchased = []
        }
        return savedState
      }
      
    } catch (e) {
      // ignore
    }
    return defaultState()
  })

  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    // main tick
    tickRef.current = window.setInterval(() => {
      setState((s) => {
        if (s.producers.length === 0) return s
        const resources = s.resources.map((r) => ({ ...r }))
        for (const p of s.producers) {
          if (p.count <= 0) continue
          // Calculate effective power with upgrades
          let effectivePower = p.power
          const upgrades = (gameData as any).upgrades || []
          for (const upgId of (s.upgradesPurchased || [])) {
            const upg = upgrades.find((u: any) => u.id === upgId)
            if (upg && upg.effect?.type === 'multiplier' && upg.effect.target === p.id) {
              effectivePower *= upg.effect.value
            }
          }
          const produced = p.count * effectivePower * s.producerLevel
          const target = resources.find((res) => res.id === p.resource)
          if (target) target.amount += produced
        }
        return { ...s, resources, lastSaved: s.lastSaved }
      })
    }, tickInterval)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [tickInterval])

  // autosave every 5s
  useEffect(() => {
    const id = window.setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSaved: Date.now() }))
    }, 5000)
    return () => clearInterval(id)
  }, [state])

  // offline progress on mount
  useEffect(() => {
    const now = Date.now()
    const dt = Math.floor((now - state.lastSaved) / 1000)
    if (dt > 0) {
      // apply dt ticks
      setState((s) => {
        const resources = s.resources.map((r) => ({ ...r }))
        for (const p of s.producers) {
          if (p.count <= 0) continue
          // Calculate effective power with upgrades for offline progress too
          let effectivePower = p.power
          const upgrades = (gameData as any).upgrades || []
          for (const upgId of (s.upgradesPurchased || [])) {
            const upg = upgrades.find((u: any) => u.id === upgId)
            if (upg && upg.effect?.type === 'multiplier' && upg.effect.target === p.id) {
              effectivePower *= upg.effect.value
            }
          }
          const produced = p.count * effectivePower * s.producerLevel * dt
          const target = resources.find((res) => res.id === p.resource)
          if (target) target.amount += produced
        }
        return { ...s, resources }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // helpers
  function getResource(id: string) {
    return state.resources.find((r) => r.id === id)!
  }

  function isUpgradePurchased(id: string) {
    return (state.upgradesPurchased || []).includes(id)
  }

  function purchaseUpgrade(upgId: string) {
    const upgrades = (gameData as any).upgrades || []
    const upg = upgrades.find((u: any) => u.id === upgId)
    if (!upg) return
    setState((s) => {
      const credits = s.resources.find((r) => r.id === 'credits')
      if (!credits || credits.amount < upg.cost) return s
      if ((s.upgradesPurchased || []).includes(upgId)) return s // already purchased
      const resources = s.resources.map((r) => (r.id === 'credits' ? { ...r, amount: r.amount - upg.cost } : r))
      const purchased = [...(s.upgradesPurchased || []), upgId]
      return { ...s, resources, upgradesPurchased: purchased }
    })
  }

  function addResource(id: string, amount: number) {
    setState((s) => ({
      ...s,
      resources: s.resources.map((r) => (r.id === id ? { ...r, amount: r.amount + amount } : r))
    }))
  }

  function buyProducer(pid: string) {
    setState((s) => {
      const producers = s.producers.map((p) => ({ ...p }))
      const p = producers.find((x) => x.id === pid)
      if (!p) return s
      const cost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
      const res = s.resources.find((r) => r.id === 'credits')
      if (!res || res.amount < cost) return s
      // deduct
      const resources = s.resources.map((r) => (r.id === 'credits' ? { ...r, amount: r.amount - cost } : r))
      p.count += 1
      return { ...s, producers, resources }
    })
  }

  function upgradeProducers() {
    setState((s) => {
      const cost = 100 * s.producerLevel
      const res = s.resources.find((r) => r.id === 'credits')
      if (!res || res.amount < cost) return s
      const resources = s.resources.map((r) => (r.id === 'credits' ? { ...r, amount: r.amount - cost } : r))
      return { ...s, producerLevel: s.producerLevel + 1, resources }
    })
  }

  function clickGather(resourceId: string, amount = 1) {
    addResource(resourceId, amount)
  }

  function reset() {
    setState(defaultState())
    localStorage.removeItem(SAVE_KEY)
  }

  return { state, buyProducer, upgradeProducers, clickGather, reset }
}

export default function App() {
  const { state, buyProducer, upgradeProducers, clickGather, reset } = useIncrementalGame()
  return (
    <div className="game-root" style={{ padding: '1rem 2rem' }}>
      <div className="panel">
        <h2>Command</h2>
        <p className="muted">Starship Idle — experimental build</p>
        <div style={{ marginTop: 12 }}>
          <ResourceList resources={state.resources} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="muted">Producer level: x{state.producerLevel}</div>
          <button onClick={upgradeProducers} disabled={(state.resources.find(r=>r.id==='credits')?.amount||0) < 100} style={{ marginTop: 8 }}>Upgrade Fleet (cost: 100)</button>
        </div>
      </div>

      <div className="panel center-card">
        <h2>Bridge</h2>
        <p className="muted">Perform actions to gather resources and expand your outposts.</p>
        <div style={{ marginTop: 18 }}>
          <button style={{ fontSize: '1.5rem', padding: '1.25rem 2rem' }} onClick={() => clickGather('credits', 1)}>Launch Prospect (+1 Credits)</button>
        </div>

        <div className="actions-grid">
          <button onClick={() => clickGather('credits', 5)}>Send Drone (+5 Credits)</button>
          <button onClick={() => clickGather('nanites', 3)}>Synthesize (+3 Nanites)</button>
          <button onClick={() => clickGather('credits', 20)}>Salvage (+20 Credits)</button>
          <button onClick={() => clickGather('nanites', 10)}>Overclock (+10 Nanites)</button>
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={reset}>Factory Reset</button>
        </div>
      </div>

      <div className="panel">
        <h2>Outposts</h2>
        {state.producers.map((p) => {
          const nextCost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
          // Calculate effective power with upgrades
          let effectivePower = p.power
          const upgrades = (gameData as any).upgrades || []
          for (const upgId of (state.upgradesPurchased || [])) {
            const upg = upgrades.find((u: any) => u.id === upgId)
            if (upg && upg.effect?.type === 'multiplier' && upg.effect.target === p.id) {
              effectivePower *= upg.effect.value
            }
          }
          return (
            <div key={p.id} className="producer-card">
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="muted">Produces: {effectivePower * state.producerLevel} {p.resource} / tick each</div>
              <div>Owned: {p.count}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => buyProducer(p.id)} disabled={(state.resources.find(r=>r.id==='credits')?.amount||0) < nextCost}>
                  Deploy — cost: {nextCost}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
