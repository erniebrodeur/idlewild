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
      <h3>Upgrades</h3>
      {visible.map((u) => {
        const affordable = (resources.find(r => r.id === u.costResource)?.amount || 0) >= u.cost
        return (
          <div key={u.id} className="upgrade-item">
            <div style={{ fontWeight: 700 }}>{u.name}</div>
            <div className="muted">{u.desc}</div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => purchaseUpgrade(u.id)} disabled={!affordable}>
                Buy — {u.cost} {u.costResource}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
