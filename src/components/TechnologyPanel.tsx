import React from 'react'
import UpgradeList from './UpgradeList'
import ProducerList from './ProducerList'
import { Resource, Producer } from '../types/GameTypes'

interface TechnologyPanelProps {
  upgradesDiscovered: string[]
  upgradesPurchased: string[]
  producers: Producer[]
  resources: Resource[]
  purchaseUpgrade: (upgId: string) => void
  buyProducer: (pid: string) => void
}

export default function TechnologyPanel({
  upgradesDiscovered,
  upgradesPurchased,
  producers,
  resources,
  purchaseUpgrade,
  buyProducer
}: TechnologyPanelProps) {
  return (
    <div className="panel">
      <h2 style={{ marginBottom: '1rem' }}>🛠️ Technology & Equipment</h2>
      <UpgradeList
        upgradesDiscovered={upgradesDiscovered}
        upgradesPurchased={upgradesPurchased}
        resources={resources}
        purchaseUpgrade={purchaseUpgrade}
      />
      <div style={{ marginTop: '1.5rem' }}>
        <ProducerList
          producers={producers}
          upgradesPurchased={upgradesPurchased}
          resources={resources}
          buyProducer={buyProducer}
        />
      </div>
    </div>
  )
}