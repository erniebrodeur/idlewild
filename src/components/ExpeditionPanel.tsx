import React from 'react'
import { Resource, SurvivalNeed, ActiveExpedition, Expedition } from '../types/GameTypes'
import expeditions from '../data/expeditions.json'

interface ExpeditionPanelProps {
  activeExpedition: ActiveExpedition | null
  resources: Resource[]
  needs: SurvivalNeed[]
  startExpedition: (expedition: Expedition) => void
}

export default function ExpeditionPanel({ 
  activeExpedition, 
  resources, 
  needs, 
  startExpedition
}: ExpeditionPanelProps) {

  function isExpeditionUnlocked(exp: Expedition) {
    if (!exp.unlock) return true
    const type = exp.unlock.type
    if (type === 'resource') {
      const r = resources.find((rr: Resource) => rr.id === exp.unlock!.id)
      return !!r && (r.amount >= (exp.unlock!.amount || 0))
    }
    if (type === 'upgrade') {
      // This part needs to be implemented if you have an upgrades system
      return false 
    }
    return true
  }

  function hasExpeditionCosts(exp: Expedition) {
    if (!exp.costs || exp.costs.length === 0) return true
    return exp.costs.every(c => {
      const r = resources.find((rr: Resource) => rr.id === c.resourceId)
      return !!r && r.amount >= c.amount
    })
  }

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '1rem' }}>🧭 Expeditions</h2>
      
      {activeExpedition ? (
        <div>
          <h3 style={{ color: '#66ff66', marginBottom: '1rem' }}>🚀 On Expedition...</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>Time Remaining</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{activeExpedition.timeRemaining} seconds</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 12, 
              backgroundColor: '#333', 
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${((activeExpedition.totalTime - activeExpedition.timeRemaining) / activeExpedition.totalTime) * 100}%`, 
                height: '100%', 
                backgroundColor: '#44ff44',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <p style={{ color: '#aaa', textAlign: 'center', fontStyle: 'italic' }}>
            Your team is exploring. Survival needs are draining faster.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Available Expeditions</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {(expeditions as Expedition[]).map((exp) => {
                const unlocked = isExpeditionUnlocked(exp)
                const affordable = hasExpeditionCosts(exp)

                return (
                  <div key={exp.id} style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    backgroundColor: unlocked ? '#222' : '#1a1a1a',
                    border: '1px solid ' + (unlocked ? '#3a6' : '#333')
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '600' }}>{exp.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#999' }}>{exp.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>{exp.duration}s</div>
                        <button
                          onClick={() => startExpedition(exp)}
                          disabled={!unlocked || !affordable}
                          style={{
                            marginTop: 8,
                            padding: '0.4rem 0.6rem',
                            borderRadius: 6,
                            backgroundColor: unlocked && affordable ? '#356' : '#333',
                            color: '#fff',
                            border: 'none'
                          }}
                        >
                          {unlocked ? (affordable ? 'Start' : 'Need Resources') : 'Locked'}
                        </button>
                      </div>
                    </div>

                    {exp.costs && exp.costs.length > 0 && (
                      <div style={{ marginTop: 8, color: '#aaa', fontSize: '0.85rem' }}>
                        Costs: {exp.costs.map(c => `${c.amount} ${c.resourceId}`).join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}