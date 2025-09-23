import React, { useEffect, useRef, useState } from 'react'
import './index.css'
import ProducerList from './components/ProducerList'
import ResourceList from './components/ResourceList'
import UpgradeList from './components/UpgradeList'
import SettingsPanel from './components/SettingsPanel'
import DebugPanel from './components/DebugPanel'
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
  category?: string
  description?: string
}

type SurvivalNeed = {
  id: string
  name: string
  current: number
  max: number
  decayRate: number
  criticalThreshold: number
}

type Campfire = {
  lit: boolean
  fuel: number
  maxFuel: number
  warmthPerTick: number
}

type Exploration = {
  active: boolean
  timeRemaining: number
  totalTime: number
}

type Colonist = {
  id: string
  name: string
  health: number
  morale: number
  skills: { [key: string]: number }
  conditions: string[]
}

type Producer = {
  id: string
  name: string
  resource: string // resource id it produces
  count: number
  baseCost: number
  costResource?: string
  growth: number
  power: number // production per tick per producer (before level)
  discovered?: boolean
  description?: string
}

type GameState = {
  resources: Resource[]
  producers: Producer[]
  upgradesPurchased: string[]
  upgradesDiscovered: string[]
  survival: {
    needs: SurvivalNeed[]
    colonists: Colonist[]
    campfire: Campfire
    exploration: Exploration
  }
  lastSaved: number
  daysSurvived: number
}

const SAVE_KEY = 'idlewild:v2'

function defaultState(): GameState {
  // Initialize from JSON game data file and attach lastSaved
  const resources = (gameData.resources || []).map((r: any) => ({ ...r }))
  const producers = (gameData.producers || []).map((p: any) => ({ ...p }))
  const survival = {
    needs: (gameData.survival?.needs || []).map((n: any) => ({ ...n })),
    colonists: (gameData.survival?.colonists || []).map((c: any) => ({ ...c })),
    campfire: gameData.survival?.campfire || { lit: false, fuel: 0, maxFuel: 100, warmthPerTick: 2 },
    exploration: gameData.survival?.exploration || { active: false, timeRemaining: 0, totalTime: 0 }
  }
  return { 
    resources, 
    producers, 
    upgradesPurchased: [], 
    upgradesDiscovered: [], 
    survival,
    daysSurvived: 0,
    lastSaved: Date.now() 
  }
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
    if (upg?.effect?.type === 'multiplier' && upg.effect.value && upg.effect.target) {
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
        savedState.daysSurvived = savedState.daysSurvived || 0
        savedState.survival = savedState.survival || { needs: [], colonists: [], campfire: { lit: false, fuel: 0, maxFuel: 100, warmthPerTick: 2 }, exploration: { active: false, timeRemaining: 0, totalTime: 0 } }
        
        // Ensure campfire and exploration exist
        savedState.survival.campfire = savedState.survival.campfire || { lit: false, fuel: 0, maxFuel: 100, warmthPerTick: 2 }
        savedState.survival.exploration = savedState.survival.exploration || { active: false, timeRemaining: 0, totalTime: 0 }
        
        // Merge missing resources/producers and survival data
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
        
        // Merge missing survival needs and colonists
        for (const defNeed of defaults.survival.needs) {
          if (!savedState.survival.needs.find(n => n.id === defNeed.id)) {
            savedState.survival.needs.push({ ...defNeed })
          }
        }
        for (const defCol of defaults.survival.colonists) {
          if (!savedState.survival.colonists.find(c => c.id === defCol.id)) {
            savedState.survival.colonists.push({ ...defCol })
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
        const survival = { ...s.survival }
        const upgradeMultipliers = calculateUpgradeEffects(s.upgradesPurchased)
        
        // Handle exploration timer
        if (survival.exploration.active && survival.exploration.timeRemaining > 0) {
          survival.exploration.timeRemaining -= 1
          
          // When exploration completes
          if (survival.exploration.timeRemaining <= 0) {
            survival.exploration.active = false
            // Award materials based on exploration time
            const materialsFound = Math.floor(survival.exploration.totalTime / 5) + Math.random() * 3
            const materialResource = resources.find(r => r.id === 'materials')
            if (materialResource) {
              materialResource.amount += materialsFound
              materialResource.discovered = true
            }
          }
        }
        
        // Handle campfire - provides warmth when lit and not exploring
        if (survival.campfire.lit && survival.campfire.fuel > 0 && !survival.exploration.active) {
          survival.campfire.fuel = Math.max(0, survival.campfire.fuel - 1)
          const warmthNeed = survival.needs.find(n => n.id === 'warmth')
          if (warmthNeed) {
            warmthNeed.current = Math.min(warmthNeed.max, warmthNeed.current + survival.campfire.warmthPerTick)
          }
          
          // Extinguish campfire when out of fuel
          if (survival.campfire.fuel <= 0) {
            survival.campfire.lit = false
          }
        }
        
        // No automatic resource consumption when not exploring - this is now a clicker/incremental game!
        
        // Producer production
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
          return { ...s, resources, survival, upgradesDiscovered: [...s.upgradesDiscovered, ...newlyDiscovered] }
        }
        
        return { ...s, resources, survival }
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
        const survival = { ...s.survival }
        const upgradeMultipliers = calculateUpgradeEffects(s.upgradesPurchased)
        
        // Calculate offline survival decay (but don't let it kill the player)
        survival.needs = survival.needs.map(need => {
          let decayRate = need.decayRate
          
          // Apply survival modifiers from upgrades
          const modifierUpgrades = gameData.upgrades?.filter((u: any) => 
            s.upgradesPurchased.includes(u.id) && 
            u.effect?.type === 'survival_modifier' && 
            u.effect.target === need.id
          ) || []
          
          for (const upg of modifierUpgrades) {
            if (upg.effect?.attribute === 'decayRate' && upg.effect.value) {
              decayRate *= upg.effect.value
            }
          }
          
          const totalDecay = decayRate * dt
          const newCurrent = Math.max(need.criticalThreshold + 5, need.current - totalDecay)
          return { ...need, current: newCurrent }
        })
        
        // Calculate offline production
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
        
        return { ...s, resources, survival, daysSurvived: s.daysSurvived + Math.floor(dt / 86400) }
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
      const costResourceId = p.costResource || 'materials'
      const res = s.resources.find((r) => r.id === costResourceId)
      if (!res || res.amount < cost) return s
      
      const resources = s.resources.map((r) => 
        r.id === costResourceId ? { ...r, amount: r.amount - cost, discovered: true } : r
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

  function lightCampfire() {
    setState((s) => {
      const materialResource = s.resources.find(r => r.id === 'materials')
      if (!materialResource || materialResource.amount < 2) return s
      
      const survival = { ...s.survival }
      survival.campfire.lit = true
      survival.campfire.fuel = Math.min(survival.campfire.maxFuel, survival.campfire.fuel + 50)
      
      const resources = s.resources.map(r => 
        r.id === 'materials' ? { ...r, amount: r.amount - 2 } : r
      )
      
      return { ...s, resources, survival }
    })
  }

  function startExploration(duration: number) {
    setState((s) => {
      // Check if we have enough resources for exploration
      const foodCost = duration * 0.5
      const waterCost = duration * 0.3
      const warmthCost = duration * 0.4
      
      const foodResource = s.resources.find(r => r.id === 'food')
      const waterResource = s.resources.find(r => r.id === 'water')
      const warmthNeed = s.survival.needs.find(n => n.id === 'warmth')
      
      if (!foodResource || foodResource.amount < foodCost ||
          !waterResource || waterResource.amount < waterCost ||
          !warmthNeed || warmthNeed.current < warmthCost) {
        return s
      }
      
      // Apply exploration efficiency upgrades
      let efficiency = 1.0
      const explorationUpgrades = gameData.upgrades?.filter((u: any) => 
        s.upgradesPurchased.includes(u.id) && u.effect?.type === 'exploration_modifier'
      ) || []
      
      for (const upg of explorationUpgrades) {
        if (upg.effect?.attribute === 'efficiency' && upg.effect.value) {
          efficiency *= upg.effect.value
        }
      }
      
      const actualFoodCost = foodCost * efficiency
      const actualWaterCost = waterCost * efficiency
      const actualWarmthCost = warmthCost * efficiency
      
      const resources = s.resources.map(r => {
        if (r.id === 'food') return { ...r, amount: r.amount - actualFoodCost }
        if (r.id === 'water') return { ...r, amount: r.amount - actualWaterCost }
        return r
      })
      
      const survival = { ...s.survival }
      survival.exploration.active = true
      survival.exploration.timeRemaining = duration
      survival.exploration.totalTime = duration
      
      const hungerNeed = survival.needs.find(n => n.id === 'hunger')
      const thirstNeed = survival.needs.find(n => n.id === 'thirst')
      const warmthNeedUpdate = survival.needs.find(n => n.id === 'warmth')
      
      if (hungerNeed) hungerNeed.current = Math.max(0, hungerNeed.current - actualFoodCost * 2)
      if (thirstNeed) thirstNeed.current = Math.max(0, thirstNeed.current - actualWaterCost * 2)
      if (warmthNeedUpdate) warmthNeedUpdate.current = Math.max(0, warmthNeedUpdate.current - actualWarmthCost * 2)
      
      return { ...s, resources, survival }
    })
  }

  function consumeResource(resourceId: string, amount: number) {
    setState((s) => {
      const resource = s.resources.find(r => r.id === resourceId)
      if (!resource || resource.amount < amount) return s
      
      const resources = s.resources.map(r => 
        r.id === resourceId ? { ...r, amount: r.amount - amount } : r
      )
      
      const survival = { ...s.survival }
      
      // Restore needs based on what was consumed
      if (resourceId === 'food') {
        const hungerNeed = survival.needs.find(n => n.id === 'hunger')
        if (hungerNeed) hungerNeed.current = Math.min(hungerNeed.max, hungerNeed.current + amount * 25)
      }
      
      if (resourceId === 'water') {
        const thirstNeed = survival.needs.find(n => n.id === 'thirst')
        if (thirstNeed) thirstNeed.current = Math.min(thirstNeed.max, thirstNeed.current + amount * 30)
      }
      
      return { ...s, resources, survival }
    })
  }

  function reset() {
    setState(defaultState())
    localStorage.removeItem(SAVE_KEY)
  }

  return { state, setState, buyProducer, clickGather, reset, purchaseUpgrade, lightCampfire, startExploration, consumeResource }
}

export default function App() {
  const { state, setState, buyProducer, clickGather, reset, purchaseUpgrade, lightCampfire, startExploration, consumeResource } = useIncrementalGame()
  const [showSettings, setShowSettings] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  
  // Get critical survival status
  const criticalNeeds = state.survival.needs.filter(n => n.current <= n.criticalThreshold)
  const survivalStatus = criticalNeeds.length > 0 ? 'critical' : 'stable'
  
  return (
    <div className="game-root" style={{ padding: '1rem 2rem' }}>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>🚀 Crash Site Delta-7</h2>
            <p className="muted">Day {state.daysSurvived} • Status: {survivalStatus}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowSettings(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#333',
                color: '#ccc',
                border: '1px solid #555',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ⚙️ Settings
            </button>
            <button 
              onClick={() => setShowDebug(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#441111',
                color: '#ff6666',
                border: '1px solid #cc3333',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🐛 Debug
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ResourceList resources={state.resources} />
        </div>
        
        {/* Survival Status */}
        <div style={{ marginTop: 20 }}>
          <h3>Survival Status</h3>
          {state.survival.needs.map(need => {
            const percentage = (need.current / need.max) * 100
            const status = percentage <= (need.criticalThreshold / need.max) * 100 ? 'critical' : 
                          percentage <= 50 ? 'warning' : 'good'
            return (
              <div key={need.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{need.name}</span>
                  <span className={`status-${status}`}>{Math.round(percentage)}%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: 8, 
                  backgroundColor: '#333', 
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    backgroundColor: status === 'critical' ? '#ff4444' : 
                                   status === 'warning' ? '#ffaa44' : '#44ff44',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )
          })}
          
          {/* Resource consumption buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => consumeResource('food', 1)}
              disabled={!state.resources.find(r => r.id === 'food')?.amount || state.resources.find(r => r.id === 'food')!.amount < 1}
              style={{ padding: '4px 8px', fontSize: '0.9rem' }}
            >
              Eat Food (-1)
            </button>
            <button 
              onClick={() => consumeResource('water', 1)}
              disabled={!state.resources.find(r => r.id === 'water')?.amount || state.resources.find(r => r.id === 'water')!.amount < 1}
              style={{ padding: '4px 8px', fontSize: '0.9rem' }}
            >
              Drink Water (-1)
            </button>
          </div>
        </div>

        {/* Campfire Section */}
        <div style={{ marginTop: 20, padding: 16, backgroundColor: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
          <h3>🔥 Campfire</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Status: {state.survival.campfire.lit ? '🔥 Burning' : '❄️ Cold'}</span>
              <span>Fuel: {Math.round(state.survival.campfire.fuel)}/{state.survival.campfire.maxFuel}</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 6, 
              backgroundColor: '#333', 
              borderRadius: 3,
              overflow: 'hidden',
              marginTop: 4
            }}>
              <div style={{ 
                width: `${(state.survival.campfire.fuel / state.survival.campfire.maxFuel) * 100}%`, 
                height: '100%', 
                backgroundColor: state.survival.campfire.lit ? '#ff6600' : '#666',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <button 
            onClick={lightCampfire}
            disabled={!state.resources.find(r => r.id === 'materials')?.amount || state.resources.find(r => r.id === 'materials')!.amount < 2}
            style={{ 
              width: '100%',
              padding: '8px 16px',
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            {state.survival.campfire.lit ? 'Add Fuel' : 'Light Campfire'} (2 Materials)
          </button>
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 8 }}>
            Provides warmth when lit and you're not exploring
          </p>
        </div>
      </div>

      <div className="panel center-card">
        <h2>🔍 Exploration Operations</h2>
        <p className="muted">Venture into the wilderness to find materials. Costs food, water, and warmth!</p>
        
        {state.survival.exploration.active ? (
          <div style={{ marginTop: 18 }}>
            <h3>🚶 Currently Exploring...</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Time Remaining</span>
                <span>{state.survival.exploration.timeRemaining} seconds</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: 8, 
                backgroundColor: '#333', 
                borderRadius: 4,
                overflow: 'hidden',
                marginTop: 4
              }}>
                <div style={{ 
                  width: `${((state.survival.exploration.totalTime - state.survival.exploration.timeRemaining) / state.survival.exploration.totalTime) * 100}%`, 
                  height: '100%', 
                  backgroundColor: '#44ff44',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            <p style={{ color: '#888' }}>You'll return with materials when exploration completes.</p>
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                style={{ fontSize: '1.2rem', padding: '1rem 1.5rem' }} 
                onClick={() => startExploration(10)}
                disabled={
                  !state.resources.find(r => r.id === 'food')?.amount || state.resources.find(r => r.id === 'food')!.amount < 5 ||
                  !state.resources.find(r => r.id === 'water')?.amount || state.resources.find(r => r.id === 'water')!.amount < 3 ||
                  !state.survival.needs.find(n => n.id === 'warmth') || state.survival.needs.find(n => n.id === 'warmth')!.current < 4
                }
              >
                Quick Scout (10s)<br/>
                <small>-5 food, -3 water, -4 warmth</small>
              </button>
              <button 
                style={{ fontSize: '1.2rem', padding: '1rem 1.5rem' }} 
                onClick={() => startExploration(30)}
                disabled={
                  !state.resources.find(r => r.id === 'food')?.amount || state.resources.find(r => r.id === 'food')!.amount < 15 ||
                  !state.resources.find(r => r.id === 'water')?.amount || state.resources.find(r => r.id === 'water')!.amount < 9 ||
                  !state.survival.needs.find(n => n.id === 'warmth') || state.survival.needs.find(n => n.id === 'warmth')!.current < 12
                }
              >
                Long Expedition (30s)<br/>
                <small>-15 food, -9 water, -12 warmth</small>
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <button 
                style={{ fontSize: '1rem', padding: '0.8rem 1.2rem' }} 
                onClick={() => clickGather('food', 0.5)}
              >
                Forage for Food (+0.5)
              </button>
              <button 
                style={{ fontSize: '1rem', padding: '0.8rem 1.2rem', marginLeft: '8px' }} 
                onClick={() => clickGather('water', 0.3)}
              >
                Collect Water (+0.3)
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #444' }}>
          <p style={{ fontSize: '0.9rem', color: '#888' }}>
            Use the Settings panel (⚙️) to access emergency reset and game data management
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>🛠️ Technology & Equipment</h2>
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

      {/* Settings Panel */}
      <SettingsPanel
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        onReset={reset}
        gameState={state}
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
