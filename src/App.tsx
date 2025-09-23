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

// Cached upgrade calculations to avoid repeated lookups
const upgradeEffects = new Map<string, Map<string, number>>()

function calculateUpgradeEffects(upgradesPurchased: string[]) {
  const key = upgradesPurchased.join(',')
  if (upgradeEffects.has(key)) return upgradeEffects.get(key)!
  
  const effects = new Map<string, number>()
  const upgrades = gameData.upgrades || []
  
  for (const upgId of upgradesPurchased) {
    const upg = upgrades.find((u: any) => u.id === upgId)
    if (upg?.effect?.type === 'multiplier') {
      const current = effects.get(upg.effect.target) || 1
      effects.set(upg.effect.target, current * upg.effect.value)
    }
  }
  
  upgradeEffects.set(key, effects)
  return effects
}

function evaluateUpgradeUnlocks(resources: Resource[], currentDiscovered: string[], upgradesPurchased: string[]): string[] {
  const upgrades = gameData.upgrades || []
  const newly: string[] = []
  
  for (const upg of upgrades) {
    if (upgradesPurchased.includes(upg.id) || currentDiscovered.includes(upg.id)) continue
    if (upg.unlock?.type === 'resource' && upg.unlock.id) {
      const res = resources.find(r => r.id === upg.unlock!.id)
      if (res && upg.unlock.amount && res.amount >= upg.unlock.amount) newly.push(upg.id)
    }
  }
  
  return newly
}

function useIncrementalGame(tickInterval = 1000) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const savedState = JSON.parse(raw) as GameState
        const defaults = defaultState()
        
        // Ensure arrays exist and merge defaults
        savedState.upgradesPurchased = savedState.upgradesPurchased || []
        savedState.upgradesDiscovered = savedState.upgradesDiscovered || []
        savedState.resources = savedState.resources || []
        savedState.producers = savedState.producers || []
        
        // Merge missing resources/producers
        for (const defRes of defaults.resources) {
          if (!savedState.resources.find(r => r.id === defRes.id)) {
            savedState.resources.push({ ...defRes })
          }
        }
        for (const defP of defaults.producers) {
          if (!savedState.producers.find(p => p.id === defP.id)) {
            savedState.producers.push({ ...defP })
          }
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
        const upgradeMultipliers = calculateUpgradeEffects(s.upgradesPurchased)
        
        for (const p of s.producers) {
          if (p.count <= 0) continue
          
          const effectivePower = p.power * (upgradeMultipliers.get(p.id) || 1)
          const produced = p.count * effectivePower
          const target = resources.find((res) => res.id === p.resource)
          if (target && produced > 0) {
            target.amount += produced
            target.discovered = true
          }
        }
        
        // Check for newly unlocked upgrades
        const newlyDiscovered = evaluateUpgradeUnlocks(resources, s.upgradesDiscovered, s.upgradesPurchased)
        if (newlyDiscovered.length > 0) {
          return { ...s, resources, upgradesDiscovered: [...s.upgradesDiscovered, ...newlyDiscovered] }
        }
        
        return { ...s, resources }
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
      setState((s) => {
        const resources = s.resources.map((r) => ({ ...r }))
        const upgradeMultipliers = calculateUpgradeEffects(s.upgradesPurchased)
        
        for (const p of s.producers) {
          if (p.count <= 0) continue
          
          const effectivePower = p.power * (upgradeMultipliers.get(p.id) || 1)
          const produced = p.count * effectivePower * dt
          const target = resources.find((res) => res.id === p.resource)
          if (target && produced > 0) {
            target.amount += produced
            target.discovered = true
          }
        }
        
        return { ...s, resources }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addResource(id: string, amount: number) {
    setState((s) => ({
      ...s,
      resources: s.resources.map((r) => 
        r.id === id ? { ...r, amount: r.amount + amount, discovered: true } : r
      ),
    }))
  }

  function purchaseUpgrade(upgId: string) {
    const upgrades = gameData.upgrades || []
    const upg = upgrades.find((u: any) => u.id === upgId)
    if (!upg?.costResource) return
    
    setState((s) => {
      const payRes = s.resources.find((r) => r.id === upg.costResource)
      if (!payRes || payRes.amount < upg.cost || s.upgradesPurchased.includes(upgId)) return s
      
      const resources = s.resources.map((r) => 
        r.id === upg.costResource ? { ...r, amount: r.amount - upg.cost, discovered: true } : r
      )
      const purchased = [...s.upgradesPurchased, upgId]
      
      // Check for newly unlocked upgrades after purchase
      const newlyDiscovered = evaluateUpgradeUnlocks(resources, s.upgradesDiscovered, purchased)
      
      return { 
        ...s, 
        resources, 
        upgradesPurchased: purchased, 
        upgradesDiscovered: [...s.upgradesDiscovered, ...newlyDiscovered]
      }
    })
  }

  function buyProducer(pid: string) {
    setState((s) => {
      const p = s.producers.find((x) => x.id === pid)
      if (!p) return s
      
      const cost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
      const res = s.resources.find((r) => r.id === 'credits')
      if (!res || res.amount < cost) return s
      
      const resources = s.resources.map((r) => 
        r.id === 'credits' ? { ...r, amount: r.amount - cost, discovered: true } : r
      )
      const producers = s.producers.map((prod) => 
        prod.id === pid ? { ...prod, count: prod.count + 1, discovered: true } : prod
      )
      
      // Check for newly unlocked upgrades after purchase
      const newlyDiscovered = evaluateUpgradeUnlocks(resources, s.upgradesDiscovered, s.upgradesPurchased)
      
      return { 
        ...s, 
        producers, 
        resources, 
        upgradesDiscovered: [...s.upgradesDiscovered, ...newlyDiscovered]
      }
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
