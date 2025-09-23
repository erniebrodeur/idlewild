import React from 'react'
import '../index.css'
import gameData from '../data/game-data.json'

type UpgradeListProps = {
  upgradesDiscovered: string[]
  upgradesPurchased: string[]
  resources: { id: string; amount: number }[]
  purchaseUpgrade: (id: string) => void
}

export default function UpgradeList({ upgradesDiscovered, upgradesPurchased, resources, purchaseUpgrade }: UpgradeListProps) {
  const upgrades = gameData.upgrades || []
  const visible = upgrades.filter((u) => 
    upgradesDiscovered.includes(u.id) && 
    !upgradesPurchased.includes(u.id) &&
    u.costResource
  )
  
  if (visible.length === 0) return null
  
  return (
    <div className="upgrade-list">
      <h3>🔬 Research & Upgrades</h3>
      <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: 16 }}>
        Improve your survival capabilities through research and technology
      </p>
      {visible.map((u) => {
        const affordable = (resources.find(r => r.id === u.costResource)?.amount || 0) >= u.cost
        return (
          <div key={u.id} className="upgrade-item" style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            padding: 16,
            marginBottom: 12
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#66ccff' }}>
              {u.name}
            </div>
            <div className="muted" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
              {u.desc}
            </div>
            <div>
              <button 
                onClick={() => purchaseUpgrade(u.id)} 
                disabled={!affordable}
                style={{
                  padding: '8px 16px',
                  backgroundColor: affordable ? '#0066cc' : '#333',
                  color: affordable ? 'white' : '#666',
                  border: 'none',
                  borderRadius: 4,
                  cursor: affordable ? 'pointer' : 'not-allowed'
                }}
              >
                Research — {u.cost} {u.costResource}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
