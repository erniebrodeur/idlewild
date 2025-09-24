import React from 'react'
import gameData from '../data/game-data.json'

interface ForageButtonsProps {
  clickGather: (resourceId: string, amount: number) => void
}

export default function ForageButtons({ clickGather }: ForageButtonsProps) {
  return (
    <div className="panel" style={{ textAlign: 'center' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🍃 Forage</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {gameData.survival.foraging.map((activity: any) => (
          <button 
            key={activity.id}
            style={{ 
              fontSize: '1rem', 
              padding: '1rem',
              borderRadius: 8,
              backgroundColor: '#2a3a2a',
              border: '1px solid #4a5a4a',
              color: '#ccc'
            }} 
            onClick={() => clickGather(activity.resource, activity.baseAmount)}
          >
            {activity.icon} {activity.name} (+{activity.baseAmount})
          </button>
        ))}
      </div>
    </div>
  )
}