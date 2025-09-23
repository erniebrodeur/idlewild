import React from 'react'
import '../index.css'
import gameData from '../data/game-data.json'

type Upgrade = {
  id: string
  name: string
  desc: string
  cost: number
  discovered?: boolean
}

type UpgradeListProps = {
  upgradesDiscovered: string[]
  upgradesPurchased: string[]
  resources: { id: string; amount: number; discovered?: boolean }[]
  purchaseUpgrade: (id: string) => void
}

export default function UpgradeList({ upgradesDiscovered, upgradesPurchased, resources, purchaseUpgrade }: UpgradeListProps) {
  const upgrades = (gameData as any).upgrades || []
  const visible = upgrades.filter((u: any) => upgradesDiscovered.includes(u.id) && !upgradesPurchased.includes(u.id))
  if (visible.length === 0) return null
  return (
    <div className="upgrade-list">
      <h3>Upgrades</h3>
      {visible.map((u: any) => {
        if (!u.costResource) return null // upgrades must declare costResource explicitly
        const affordable = (resources.find(r => r.id === u.costResource)?.amount || 0) >= u.cost
        return (
          <div key={u.id} className="upgrade-item">
            <div style={{ fontWeight: 700 }}>{u.name}</div>
            <div className="muted">{u.desc}</div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => purchaseUpgrade(u.id)} disabled={!affordable}>Buy — {u.cost}</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
