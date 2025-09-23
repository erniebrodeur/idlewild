import { useEffect, useRef, useState } from 'react'
import { GameState } from '../types/GameTypes'
import { calculateUpgradeEffects, evaluateUpgradeUnlocks, defaultState } from '../utils/gameLogic'
import gameData from '../data/game-data.json'

const SAVE_KEY = 'idlewild:v2'

export function useIncrementalGame(tickInterval = 1000) {
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