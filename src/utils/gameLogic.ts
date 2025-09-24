import { GameState, Resource, SurvivalNeed } from '../types/GameTypes'
import gameData from '../data/game-data.json'

// Cached upgrade calculations to avoid repeated lookups
const upgradeEffects = new Map<string, Map<string, number>>()

export function calculateUpgradeEffects(upgradesPurchased: string[]) {
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

export function evaluateUpgradeUnlocks(resources: Resource[], currentDiscovered: string[], upgradesPurchased: string[]): string[] {
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

// Resource update helpers
export function updateResourceAmount(resources: Resource[], resourceId: string, delta: number, markDiscovered = true): Resource[] {
  return resources.map(r => 
    r.id === resourceId 
      ? { ...r, amount: r.amount + delta, discovered: markDiscovered || r.discovered } 
      : r
  )
}

export function updateMultipleResources(resources: Resource[], updates: Array<{id: string, delta: number}>): Resource[] {
  return resources.map(r => {
    const update = updates.find(u => u.id === r.id)
    return update ? { ...r, amount: r.amount + update.delta, discovered: true } : r
  })
}

// Resource availability check
export function hasEnoughResources(resources: Resource[], costs: Array<{id: string, amount: number}>): boolean {
  return costs.every(cost => {
    const resource = resources.find(r => r.id === cost.id)
    return resource && resource.amount >= cost.amount
  })
}

// Single resource check
export function hasEnoughResource(resources: Resource[], resourceId: string, amount: number): boolean {
  const resource = resources.find(r => r.id === resourceId)
  return resource ? resource.amount >= amount : false
}

// Survival need updates
export function updateSurvivalNeed(needs: SurvivalNeed[], needId: string, delta: number): SurvivalNeed[] {
  return needs.map(need => {
    if (need.id === needId) {
      const newCurrent = Math.max(0, Math.min(need.max, need.current + delta))
      return { ...need, current: newCurrent }
    }
    return need
  })
}

// Apply multiple survival need updates
export function updateMultipleSurvivalNeeds(needs: SurvivalNeed[], updates: Array<{id: string, delta: number}>): SurvivalNeed[] {
  return needs.map(need => {
    const update = updates.find(u => u.id === need.id)
    if (update) {
      const newCurrent = Math.max(0, Math.min(need.max, need.current + update.delta))
      return { ...need, current: newCurrent }
    }
    return need
  })
}

// State with upgrade discoveries
export function applyStateWithUpgradeDiscoveries(
  state: GameState, 
  updates: Partial<GameState>
): GameState {
  const newState = { ...state, ...updates }
  const newlyDiscovered = evaluateUpgradeUnlocks(
    newState.resources, 
    state.upgradesDiscovered, 
    newState.upgradesPurchased || state.upgradesPurchased
  )
  
  return newlyDiscovered.length > 0 
    ? { ...newState, upgradesDiscovered: [...state.upgradesDiscovered, ...newlyDiscovered] }
    : newState
}

// Helper function to update state with newly discovered upgrades
export function updateStateWithUpgradeDiscoveries(
  baseState: any, 
  resources: Resource[], 
  upgradesPurchased: string[]
) {
  const newlyDiscovered = evaluateUpgradeUnlocks(resources, baseState.upgradesDiscovered, upgradesPurchased)
  return newlyDiscovered.length > 0 
    ? { ...baseState, upgradesDiscovered: [...baseState.upgradesDiscovered, ...newlyDiscovered] }
    : baseState
}

export function defaultState(): GameState {
  // Initialize from JSON game data file and attach lastSaved
  const resources = (gameData.resources || []).map((r: any) => ({ ...r }))
  const producers = (gameData.producers || []).map((p: any) => ({ ...p }))
  const survival = {
    needs: (gameData.survival?.needs || []).map((n: any) => ({ ...n })),
    colonists: (gameData.survival?.colonists || []).map((c: any) => ({ ...c })),
    campfire: gameData.survival?.campfire || { lit: false, fuel: 0, maxFuel: 100, warmthPerTick: 2 },
    activeExpedition: null
  }
  return { 
    resources, 
    producers, 
    upgradesPurchased: [], 
    upgradesDiscovered: [], 
    survival,
    lastSaved: Date.now() 
  }
}