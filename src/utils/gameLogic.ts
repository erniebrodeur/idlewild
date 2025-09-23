import { GameState, Resource } from '../types/GameTypes'
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

export function defaultState(): GameState {
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