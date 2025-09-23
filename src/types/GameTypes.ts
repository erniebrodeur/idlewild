export type Resource = {
  id: string
  name: string
  amount: number
  discovered?: boolean
  category?: string
  description?: string
  findChance?: number
}

export type SurvivalNeed = {
  id: string
  name: string
  current: number
  max: number
  decayRate: number
  criticalThreshold: number
}

export type Campfire = {
  lit: boolean
  fuel: number
  maxFuel: number
  warmthPerTick: number
}

export type Exploration = {
  active: boolean
  timeRemaining: number
  totalTime: number
  recentDiscoveries?: { resourceId: string, amount: number }[]
}

export type Colonist = {
  id: string
  name: string
  health: number
  morale: number
  skills: { [key: string]: number }
  conditions: string[]
}

export type Producer = {
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

export type GameState = {
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
}