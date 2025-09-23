import React from 'react'

type SurvivalNeed = {
  id: string
  name: string
  current: number
  max: number
  decayRate: number
  criticalThreshold: number
}

type Resource = {
  id: string
  name: string
  amount: number
  discovered?: boolean
  category?: string
  description?: string
}

interface SurvivalStatusProps {
  needs: SurvivalNeed[]
  resources: Resource[]
  consumeResource: (resourceId: string, amount: number) => void
}

export default function SurvivalStatus({ needs, resources, consumeResource }: SurvivalStatusProps) {
  return (
    <div className="panel">
      <h2 style={{ marginBottom: '1rem' }}>❤️ Survival Status</h2>
      {needs.map(need => {
        const percentage = (need.current / need.max) * 100
        const status = percentage <= (need.criticalThreshold / need.max) * 100 ? 'critical' : 
                      percentage <= 50 ? 'warning' : 'good'
        return (
          <div key={need.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '1.1rem' }}>{need.name}</span>
              <span className={`status-${status}`} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{Math.round(percentage)}%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 12, 
              backgroundColor: '#333', 
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${percentage}%`, 
                height: '100%', 
                backgroundColor: status === 'critical' ? '#ff4444' : 
                               status === 'warning' ? '#ffaa44' : '#44ff44',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )
      })}
      
      {/* Resource consumption buttons */}
      <div style={{ marginTop: 20, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => consumeResource('food', 1)}
          disabled={!resources.find(r => r.id === 'food')?.amount || resources.find(r => r.id === 'food')!.amount < 1}
          style={{ 
            padding: '8px 16px', 
            fontSize: '1rem',
            borderRadius: 6
          }}
        >
          🍎 Eat Food (-1)
        </button>
        <button 
          onClick={() => consumeResource('water', 1)}
          disabled={!resources.find(r => r.id === 'water')?.amount || resources.find(r => r.id === 'water')!.amount < 1}
          style={{ 
            padding: '8px 16px', 
            fontSize: '1rem',
            borderRadius: 6
          }}
        >
          💧 Drink Water (-1)
        </button>
      </div>
    </div>
  )
}