import React, { useEffect, useRef, useState } from 'react'
import './index.css'
import ProducerList from './components/ProducerList'
import ResourceList from './components/ResourceList'
import UpgradeList from './components/UpgradeList'
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
  discovered?: boolean
}

type Producer = {
  id: string
  name: string
  resource: string // resource id it produces
  count: number
  baseCost: number
  growth: number
  power: number // production per tick per producer (before level)
  discovered?: boolean
}

type GameState = {
  resources: Resource[]
  producers: Producer[]
  upgradesPurchased: string[]
  upgradesDiscovered: string[]
  lastSaved: number
}

const SAVE_KEY = 'idlewild:v2'

function defaultState(): GameState {
  // Initialize from JSON game data file and attach lastSaved
  const resources = (gameData.resources || []).map((r: any) => ({ ...r }))
  const producers = (gameData.producers || []).map((p: any) => ({ ...p }))
  return { resources, producers, upgradesPurchased: [], upgradesDiscovered: [], lastSaved: Date.now() }
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
        // Merge missing defaults (new resources/producers) so additions in game-data.json show up
        const defaults = defaultState()
        savedState.resources = savedState.resources || []
        for (const defRes of defaults.resources) {
          if (!savedState.resources.find((r) => r.id === defRes.id)) {
            savedState.resources.push({ ...defRes })
          }
        }
        savedState.producers = savedState.producers || []
        for (const defP of defaults.producers) {
          if (!savedState.producers.find((p) => p.id === defP.id)) {
            savedState.producers.push({ ...defP })
          }
        }
        // ensure upgradesDiscovered exists
        if (!Array.isArray(savedState.upgradesDiscovered)) savedState.upgradesDiscovered = []
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
          const produced = p.count * effectivePower
          const target = resources.find((res) => res.id === p.resource)
          if (target) {
            target.amount += produced
            if (produced > 0) target.discovered = true
          }
        }
        // evaluate unlocks (resource-based unlocks)
        const upgradesCfg = (gameData as any).upgrades || []
        const newly = [] as string[]
        for (const upg of upgradesCfg) {
          if (s.upgradesPurchased?.includes(upg.id)) continue
          if (s.upgradesDiscovered?.includes(upg.id)) continue
          if (upg.unlock && upg.unlock.type === 'resource') {
            const res = resources.find(r => r.id === upg.unlock.id)
            if (res && res.amount >= upg.unlock.amount) newly.push(upg.id)
          }
        }
        if (newly.length > 0) {
          return { ...s, resources, lastSaved: s.lastSaved, upgradesDiscovered: [...(s.upgradesDiscovered||[]), ...newly] }
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
          const produced = p.count * effectivePower * dt
          const target = resources.find((res) => res.id === p.resource)
          if (target) {
            target.amount += produced
            if (produced > 0) target.discovered = true
          }
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
      if (!upg.costResource) return s // must specify which resource pays for this upgrade
      const payRes = s.resources.find((r) => r.id === upg.costResource)
      if (!payRes || payRes.amount < upg.cost) return s
      if ((s.upgradesPurchased || []).includes(upgId)) return s // already purchased
      const resources = s.resources.map((r) => (r.id === upg.costResource ? { ...r, amount: r.amount - upg.cost, discovered: true } : r))
      const purchased = [...(s.upgradesPurchased || []), upgId]
      // when purchasing, also mark any upgrades unlocked by this spend
      const upgradesDiscovered = [...(s.upgradesDiscovered || [])]
      const upgradesCfg = (gameData as any).upgrades || []
      for (const upgCfg of upgradesCfg) {
        if (upgradesDiscovered.includes(upgCfg.id)) continue
        if (upgCfg.unlock && upgCfg.unlock.type === 'resource') {
          const res = resources.find(r => r.id === upgCfg.unlock.id)
          if (res && res.amount >= upgCfg.unlock.amount) upgradesDiscovered.push(upgCfg.id)
        }
      }
      return { ...s, resources, upgradesPurchased: purchased, upgradesDiscovered }
    })
  }

  function addResource(id: string, amount: number) {
    setState((s) => ({
      ...s,
      resources: s.resources.map((r) => (r.id === id ? { ...r, amount: r.amount + amount, discovered: true } : r)),
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
      const resources = s.resources.map((r) => (r.id === 'credits' ? { ...r, amount: r.amount - cost, discovered: true } : r))
      p.count += 1
      p.discovered = true
      // evaluate upgrades unlocked by this change
      const upgradesDiscovered = [...(s.upgradesDiscovered || [])]
      const upgradesCfg = (gameData as any).upgrades || []
      for (const upgCfg of upgradesCfg) {
        if (upgradesDiscovered.includes(upgCfg.id)) continue
        if (upgCfg.unlock && upgCfg.unlock.type === 'resource') {
          const r = resources.find(rr => rr.id === upgCfg.unlock.id)
          if (r && r.amount >= upgCfg.unlock.amount) upgradesDiscovered.push(upgCfg.id)
        }
      }
      return { ...s, producers, resources, upgradesDiscovered }
    })
  }

  // producerLevel / fleet upgrades removed

  function clickGather(resourceId: string, amount = 1) {
    addResource(resourceId, amount)
  }

  function reset() {
    setState(defaultState())
    localStorage.removeItem(SAVE_KEY)
  }

  return { state, buyProducer, clickGather, reset, purchaseUpgrade }
}

export default function App() {
  const { state, buyProducer, clickGather, reset, purchaseUpgrade } = useIncrementalGame()
  
  return (
    <div className="game-root" style={{ padding: '1rem 2rem' }}>
      <div className="panel">
        <h2>Command</h2>
        <p className="muted">Starship Idle — experimental build</p>
        <div style={{ marginTop: 12 }}>
          <ResourceList resources={state.resources} />
        </div>
        {/* Producer level / fleet upgrades removed */}
      </div>

      <div className="panel center-card">
        <h2>Bridge</h2>
        <p className="muted">Scavenge nearby wreckage to find raw materials.</p>
        <div style={{ marginTop: 18 }}>
          <button style={{ fontSize: '1.5rem', padding: '1.25rem 2rem' }} onClick={() => clickGather('metal', 1)}>Scavenge (+1 Metal)</button>
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={reset}>Factory Reset</button>
        </div>
      </div>

      <div className="panel">
        <h2>Outposts</h2>
        <UpgradeList
          upgradesDiscovered={state.upgradesDiscovered}
          upgradesPurchased={state.upgradesPurchased}
          resources={state.resources}
          purchaseUpgrade={purchaseUpgrade}
        />
        <ProducerList
          producers={state.producers}
          upgradesPurchased={state.upgradesPurchased}
          resources={state.resources}
          buyProducer={buyProducer}
        />
      </div>
    </div>
  )
}
