import React, { useMemo } from 'react'
import '../index.css'
import gameData from '../data/game-data.json'

type ProducerListProps = {
  producers: { id: string; name: string; resource: string; count: number; baseCost: number; growth: number; power: number; discovered?: boolean }[]
  upgradesPurchased: string[]
  resources: { id: string; amount: number }[]
  buyProducer: (id: string) => void
}

export default function ProducerList({ producers, upgradesPurchased, resources, buyProducer }: ProducerListProps) {
  // Cache upgrade multipliers to avoid recalculating for each producer
  const upgradeMultipliers = useMemo(() => {
    const multipliers = new Map<string, number>()
    const upgrades = gameData.upgrades || []
    
    for (const upgId of upgradesPurchased) {
      const upg = upgrades.find((u) => u.id === upgId)
      if (upg?.effect?.type === 'multiplier') {
        const current = multipliers.get(upg.effect.target) || 1
        multipliers.set(upg.effect.target, current * upg.effect.value)
      }
    }
    return multipliers
  }, [upgradesPurchased])

  const visibleProducers = producers.filter(p => p.discovered)
  
  return (
    <div className="producer-list">
      {visibleProducers.map((p) => {
        const nextCost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
        const effectivePower = p.power * (upgradeMultipliers.get(p.id) || 1)
        const affordable = (resources.find(r => r.id === 'credits')?.amount || 0) >= nextCost
        
        return (
          <div key={p.id} className="producer-item">
            <div className="producer-name">{p.name}</div>
            <div className="producer-info">
              <span>Produces: {effectivePower} {p.resource} / tick</span>
              <span>Owned: {p.count}</span>
            </div>
            <button onClick={() => buyProducer(p.id)} disabled={!affordable}>
              Deploy — cost: {nextCost}
            </button>
          </div>
        )
      })}
    </div>
  )
}