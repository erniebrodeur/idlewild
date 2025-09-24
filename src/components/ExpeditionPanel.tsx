import React from 'react'
import expeditions from '../data/expeditions.json'
import { Expedition, Resource, SurvivalNeed } from '../types/GameTypes'

interface ExpeditionPanelProps {
  resources: Resource[]
  needs: SurvivalNeed[]
  startExploration: (duration: number) => void
}

export default function ExpeditionPanel({ resources, needs, startExploration }: ExpeditionPanelProps) {
  const list: Expedition[] = (expeditions as any)

  function isUnlocked(exp: Expedition) {
    if (!exp.unlock) return true
    const type = exp.unlock.type
    if (type === 'resource') {
      const r = resources.find(rr => rr.id === exp.unlock!.id)
      return !!r && (r.amount >= (exp.unlock!.amount || 0))
    }
    if (type === 'upgrade') {
      // upgradesDiscovered/purchased not available here; assume locked until upgrade exists in resource form
      return false
    }
    return true
  }

  function hasCosts(exp: Expedition) {
    if (!exp.costs || exp.costs.length === 0) return true
    return exp.costs.every(c => {
      const r = resources.find(rr => rr.id === c.resourceId)
      return !!r && r.amount >= c.amount
    })
  }

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '1rem' }}>🧭 Expeditions</h2>
      <p style={{ color: '#aaa', marginBottom: '1rem' }}>Choose a targeted expedition. Costs shown are estimated — the exploration system also applies duration-based costs.</p>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {list.map((exp) => {
          const unlocked = isUnlocked(exp)
          const affordable = hasCosts(exp)

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
                    onClick={() => startExploration(exp.duration)}
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
  )
}
