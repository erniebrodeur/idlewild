import React from 'react'

type Resource = {
  id: string
  name: string
  amount: number
  discovered?: boolean
  category?: string
  description?: string
}

type Campfire = {
  lit: boolean
  fuel: number
  maxFuel: number
  warmthPerTick: number
}

interface CampfirePanelProps {
  campfire: Campfire
  resources: Resource[]
  lightCampfire: () => void
}

export default function CampfirePanel({ campfire, resources, lightCampfire }: CampfirePanelProps) {
  const materialsResource = resources.find(r => r.id === 'materials')
  const canLightCampfire = materialsResource && materialsResource.amount >= 2

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '1rem' }}>🔥 Campfire</h2>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '1.1rem' }}>Status: {campfire.lit ? '🔥 Burning' : '❄️ Cold'}</span>
          <span style={{ fontSize: '1.1rem' }}>Fuel: {Math.round(campfire.fuel)}/{campfire.maxFuel}</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: 10, 
          backgroundColor: '#333', 
          borderRadius: 5,
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${(campfire.fuel / campfire.maxFuel) * 100}%`, 
            height: '100%', 
            backgroundColor: campfire.lit ? '#ff6600' : '#666',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      <button 
        onClick={lightCampfire}
        disabled={!canLightCampfire}
        style={{ 
          width: '100%',
          padding: '12px 20px',
          backgroundColor: '#ff6600',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold'
        }}
      >
        {campfire.lit ? '🔥 Add Fuel' : '🔥 Light Campfire'} (2 Materials)
      </button>
      <p style={{ fontSize: '0.9rem', color: '#888', marginTop: 12, textAlign: 'center' }}>
        Provides warmth when lit and you're not exploring
      </p>
    </div>
  )
}