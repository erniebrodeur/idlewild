import React, { useMemo } from 'react'
import '../index.css'
import gameData from '../data/game-data.json'

type ProducerListProps = {
  producers: { 
    id: string; 
    name: string; 
    resource: string; 
    count: number; 
    baseCost: number; 
    costResource?: string;
    growth: number; 
    power: number; 
    discovered?: boolean;
    description?: string;
  }[]
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
      if (upg?.effect?.type === 'multiplier' && upg.effect.value) {
        const current = multipliers.get(upg.effect.target) || 1
        multipliers.set(upg.effect.target, current * upg.effect.value)
      }
    }
    return multipliers
  }, [upgradesPurchased])

  const visibleProducers = producers.filter(p => p.discovered)
  
  return (
    <div className="producer-list">
      <h3>🏭 Automated Equipment</h3>
      {visibleProducers.length === 0 && (
        <p className="muted">No equipment deployed. Scavenge materials to unlock production capabilities.</p>
      )}
      {visibleProducers.map((p) => {
        const nextCost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
        const effectivePower = p.power * (upgradeMultipliers.get(p.id) || 1)
        const costResourceId = p.costResource || 'materials'
        const affordable = (resources.find(r => r.id === costResourceId)?.amount || 0) >= nextCost
        
        return (
          <div key={p.id} className="producer-item" style={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #333', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 12 
          }}>
            <div className="producer-name" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {p.name}
            </div>
            {p.description && (
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: 8 }}>
                {p.description}
              </div>
            )}
            <div className="producer-info" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 12,
              fontSize: '0.9rem'
            }}>
              <span>Produces: {effectivePower.toFixed(1)} {p.resource}/tick</span>
              <span>Deployed: {p.count}</span>
            </div>
            <button 
              onClick={() => buyProducer(p.id)} 
              disabled={!affordable}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: affordable ? '#0066cc' : '#333',
                color: affordable ? 'white' : '#666',
                border: 'none',
                borderRadius: 4,
                cursor: affordable ? 'pointer' : 'not-allowed'
              }}
            >
              Deploy — {nextCost} {costResourceId}
            </button>
          </div>
        )
      })}
    </div>
  )
}