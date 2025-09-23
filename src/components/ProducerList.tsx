import React from 'react'
import '../index.css'
import gameData from '../data/game-data.json'

type Resource = {
  id: string
  name: string
  amount: number
}

type Producer = {
  id: string
  name: string
  resource: string
  count: number
  baseCost: number
  growth: number
  power: number
  discovered?: boolean
}

type ProducerListProps = {
  producers: Producer[]
  upgradesPurchased: string[]
  resources: Resource[]
  buyProducer: (id: string) => void
}

export default function ProducerList({ producers, upgradesPurchased, resources, buyProducer }: ProducerListProps) {
  return (
    <div className="producer-list">
      {producers.filter(p => !!p.discovered).map((p) => {
        const nextCost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
        // calculate effective power with upgrades
        let effectivePower = p.power
        const upgrades = (gameData as any).upgrades || []
        for (const upgId of upgradesPurchased) {
          const upg = upgrades.find((u: any) => u.id === upgId)
          if (upg && upg.effect?.type === 'multiplier' && upg.effect.target === p.id) {
            effectivePower *= upg.effect.value
          }
        }
  const totalPower = effectivePower
        const owned = p.count
        return (
          <div key={p.id} className="producer-item">
            <div className="producer-name">{p.name}</div>
            <div className="producer-info">
              <span>Produces: {totalPower} {p.resource} / tick</span>
              <span>Owned: {owned}</span>
            </div>
            <button onClick={() => buyProducer(p.id)} disabled={(resources.find(r => r.id === 'credits')?.amount || 0) < nextCost}>
              Deploy — cost: {nextCost}
            </button>
          </div>
        )
      })}
    </div>
  )
}
