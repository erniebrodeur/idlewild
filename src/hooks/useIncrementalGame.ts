import { useEffect, useRef, useState } from 'react'
import { GameState, Expedition } from '../types/GameTypes'
import { 
  calculateUpgradeEffects, 
  evaluateUpgradeUnlocks, 
  evaluateExpeditionUnlocks,
  defaultState,
  updateResourceAmount,
  updateMultipleResources,
  hasEnoughResource,
  hasEnoughResources,
  updateSurvivalNeed,
  updateMultipleSurvivalNeeds,
  applyStateWithUpgradeDiscoveries
} from '../utils/gameLogic'
import gameData from '../data/game-data.json'

const SAVE_KEY = gameData.settings?.saveKey || 'idlewild:v2'

export function useIncrementalGame(tickInterval = gameData.settings?.defaultTickIntervalMs || 1000) {
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
        savedState.expeditions = savedState.expeditions || []
        savedState.survival = savedState.survival || { needs: [], colonists: [], campfire: { lit: false, fuel: 0, maxFuel: 100, warmthPerTick: 2 }, activeExpedition: null }
        
        // Ensure campfire and activeExpedition exist
        savedState.survival.campfire = savedState.survival.campfire || { lit: false, fuel: 0, maxFuel: 100, warmthPerTick: 2 }
        savedState.survival.activeExpedition = savedState.survival.activeExpedition || null
        
        // Merge missing resources/producers/expeditions and survival data
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
        for (const defE of defaults.expeditions) {
          if (!savedState.expeditions.find(e => e.id === defE.id)) {
            savedState.expeditions.push({ ...defE })
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
        
        // Handle expedition timer
        if (survival.activeExpedition && survival.activeExpedition.timeRemaining > 0) {
          survival.activeExpedition.timeRemaining -= 1

          // Survival drain during expedition (use per-expedition drain if available, fallback to global)
          const expId = survival.activeExpedition.expeditionId
          const expDef = s.expeditions.find(e => e.id === expId)
          const drainUpdates = [] as Array<{ id: string, delta: number }>
          if (expDef?.drain) {
            if (typeof expDef.drain.hunger === 'number') drainUpdates.push({ id: 'hunger', delta: expDef.drain.hunger })
            if (typeof expDef.drain.thirst === 'number') drainUpdates.push({ id: 'thirst', delta: expDef.drain.thirst })
            if (typeof expDef.drain.warmth === 'number') drainUpdates.push({ id: 'warmth', delta: expDef.drain.warmth })
          } else {
            const ed = gameData.settings?.expeditionDrain || {}
            if (typeof ed.hunger === 'number') drainUpdates.push({ id: 'hunger', delta: ed.hunger })
            if (typeof ed.thirst === 'number') drainUpdates.push({ id: 'thirst', delta: ed.thirst })
            if (typeof ed.warmth === 'number') drainUpdates.push({ id: 'warmth', delta: ed.warmth })
          }
          survival.needs = updateMultipleSurvivalNeeds(survival.needs, drainUpdates)

          // Check for failure
          if (survival.needs.some(n => n.current <= 0)) {
            console.log('Expedition failed!')
            survival.activeExpedition = null
          }
          
          // When expedition completes
          if (survival.activeExpedition && survival.activeExpedition.timeRemaining <= 0) {
            const expId = survival.activeExpedition.expeditionId
            const expDef = s.expeditions.find(e => e.id === expId)
            console.log(`Expedition ${expId} succeeded!`)

            // Apply rewards defined on the expedition (randomized between min/max)
            if (expDef?.rewards && expDef.rewards.length > 0) {
              for (const r of expDef.rewards) {
                const min = r.min || 0
                const max = typeof r.max === 'number' ? r.max : min
                const amount = Math.floor(Math.random() * (max - min + 1)) + min
                if (amount > 0) {
                  const target = resources.find(res => res.id === r.resourceId)
                  if (target) {
                    target.amount += amount
                    target.discovered = true
                  }
                }
              }
            }

            // Apply unlocks if expedition has an unlock element (handled elsewhere by existing logic on next tick)
            survival.activeExpedition = null
          }
        }
        
        // Handle campfire - provides warmth when lit
        if (survival.campfire.lit && survival.campfire.fuel > 0) {
          const fuelDrain = gameData.settings?.campfire?.fuelDrainPerTick || 1
          survival.campfire.fuel = Math.max(0, survival.campfire.fuel - fuelDrain)
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
        const newlyDiscoveredUpgrades = evaluateUpgradeUnlocks(resources, s.upgradesDiscovered, s.upgradesPurchased)
        
        // Check for newly unlocked expeditions
        const newlyDiscoveredExpeditions = evaluateExpeditionUnlocks(resources, s.expeditions, s.upgradesPurchased)
        const expeditions = s.expeditions.map(exp => 
          newlyDiscoveredExpeditions.includes(exp.id) ? { ...exp, discovered: true } : exp
        )
        
        if (newlyDiscoveredUpgrades.length > 0 || newlyDiscoveredExpeditions.length > 0) {
          return { 
            ...s, 
            resources, 
            survival, 
            expeditions,
            upgradesDiscovered: [...s.upgradesDiscovered, ...newlyDiscoveredUpgrades] 
          }
        }
        
        return { ...s, resources, survival, expeditions }
      })
    }, tickInterval)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [tickInterval])

  // autosave
  useEffect(() => {
    const autosaveMs = gameData.settings?.autosaveIntervalMs || 5000
    const id = window.setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSaved: Date.now() }))
    }, autosaveMs)
    return () => clearInterval(id)
  }, [state])

  // offline progress on mount
  useEffect(() => {
    const now = Date.now()
  let dt = Math.floor((now - state.lastSaved) / 1000)
  const maxOffline = gameData.settings?.maxOfflineSeconds || 86400
  if (dt > maxOffline) dt = maxOffline
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
          const padding = gameData.settings?.offlineSafetyPadding || 5
          const newCurrent = Math.max(need.criticalThreshold + padding, need.current - totalDecay)
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
        
        return { ...s, resources, survival }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addResource(id: string, amount: number) {
    setState((s) => ({
      ...s,
      resources: updateResourceAmount(s.resources, id, amount, true)
    }))
  }

  function purchaseUpgrade(upgId: string) {
    const upgrades = gameData.upgrades || []
    const upg = upgrades.find((u: any) => u.id === upgId)
    if (!upg?.costResource) return
    
    setState((s) => {
      if (!hasEnoughResource(s.resources, upg.costResource, upg.cost) || s.upgradesPurchased.includes(upgId)) {
        return s
      }
      
      const resources = updateResourceAmount(s.resources, upg.costResource, -upg.cost, true)
      const purchased = [...s.upgradesPurchased, upgId]
      
      return applyStateWithUpgradeDiscoveries(s, {
        resources,
        upgradesPurchased: purchased
      })
    })
  }

  function buyProducer(pid: string) {
    setState((s) => {
      const p = s.producers.find((x) => x.id === pid)
      if (!p) return s
      const rawCost = p.baseCost * Math.pow(p.growth, p.count)
      const rounding = gameData.settings?.production?.costRounding || 'ceil'
      const cost = rounding === 'floor' ? Math.floor(rawCost) : Math.ceil(rawCost)
      const costResourceId = p.costResource || 'materials'
      
      if (!hasEnoughResource(s.resources, costResourceId, cost)) return s
      
      const resources = updateResourceAmount(s.resources, costResourceId, -cost, true)
      const producers = s.producers.map((prod) => 
        prod.id === pid ? { ...prod, count: prod.count + 1, discovered: true } : prod
      )
      
      return applyStateWithUpgradeDiscoveries(s, {
        producers,
        resources
      })
    })
  }

  function clickGather(resourceId: string, amount = 1) {
    addResource(resourceId, amount)
  }

  function lightCampfire() {
    setState((s) => {
      const campfireSettings = gameData.survival.campfire
      const lightCostResource = gameData.settings?.campfire?.lightCostResource || 'materials'
      if (!hasEnoughResource(s.resources, lightCostResource, campfireSettings.lightCost)) return s
      
      const survival = { ...s.survival }
      survival.campfire.lit = true
      survival.campfire.fuel = Math.min(survival.campfire.maxFuel, survival.campfire.fuel + campfireSettings.fuelAdded)
      
  const resources = updateResourceAmount(s.resources, lightCostResource, -campfireSettings.lightCost)
      
      return { ...s, resources, survival }
    })
  }

  function startExpedition(expedition: Expedition) {
    setState((s) => {
      if (s.survival.activeExpedition) return s // Already on an expedition

      const costs = expedition.costs || []
      if (!hasEnoughResources(s.resources, costs.map(c => ({ id: c.resourceId, amount: c.amount })))) {
        return s
      }

      const resources = updateMultipleResources(s.resources, costs.map(c => ({ id: c.resourceId, delta: -c.amount })))

      const survival = { ...s.survival }
      survival.activeExpedition = {
        expeditionId: expedition.id,
        timeRemaining: expedition.duration,
        totalTime: expedition.duration
      }
      
      return { ...s, resources, survival }
    })
  }

  function consumeResource(resourceId: string, amount: number) {
    setState((s) => {
      if (!hasEnoughResource(s.resources, resourceId, amount)) return s
      
      const resources = updateResourceAmount(s.resources, resourceId, -amount)
      const survival = { ...s.survival }
      
      // Restore needs based on what was consumed using configurable values
      const consumption = gameData.survival.consumption
      if (resourceId === 'food' && consumption.food) {
        survival.needs = updateSurvivalNeed(survival.needs, 'hunger', amount * consumption.food.hungerRestore)
      }
      
      if (resourceId === 'water' && consumption.water) {
        survival.needs = updateSurvivalNeed(survival.needs, 'thirst', amount * consumption.water.thirstRestore)
      }
      
      return { ...s, resources, survival }
    })
  }

  function reset() {
    setState(defaultState())
    localStorage.removeItem(SAVE_KEY)
  }

  return { state, setState, buyProducer, clickGather, reset, purchaseUpgrade, lightCampfire, startExpedition, consumeResource }
}