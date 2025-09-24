import React from 'react'
import { Resource, SurvivalNeed, Exploration, Expedition } from '../types/GameTypes'
import gameData from '../data/game-data.json'
import expeditions from '../data/expeditions.json'

interface ExpeditionPanelProps {
  exploration: Exploration
  resources: Resource[]
  needs: SurvivalNeed[]
  startExploration: (duration: number) => void
  clickGather: (resourceId: string, amount: number) => void
}

export default function ExpeditionPanel({ 
  exploration, 
  resources, 
  needs, 
  startExploration, 
  clickGather 
}: ExpeditionPanelProps) {
  const foodResource = resources.find((r: Resource) => r.id === 'food')
  const waterResource = resources.find((r: Resource) => r.id === 'water')
  const warmthNeed = needs.find((n: SurvivalNeed) => n.id === 'warmth')

  function canAffordExploration(expType: any) {
    return foodResource && foodResource.amount >= expType.foodCost &&
           waterResource && waterResource.amount >= expType.waterCost &&
           warmthNeed && warmthNeed.current >= expType.warmthCost
  }

  function isExpeditionUnlocked(exp: Expedition) {
    if (!exp.unlock) return true
    const type = exp.unlock.type
    if (type === 'resource') {
      const r = resources.find((rr: Resource) => rr.id === exp.unlock!.id)
      return !!r && (r.amount >= (exp.unlock!.amount || 0))
    }
    if (type === 'upgrade') {
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
      
      {exploration.active ? (
        <div>
          <h3 style={{ color: '#66ff66', marginBottom: '1rem' }}>🚶 Currently Exploring...</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>Time Remaining</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{exploration.timeRemaining} seconds</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 12, 
              backgroundColor: '#333', 
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${((exploration.totalTime - exploration.timeRemaining) / exploration.totalTime) * 100}%`, 
                height: '100%', 
                backgroundColor: '#44ff44',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <p style={{ color: '#aaa', textAlign: 'center', fontStyle: 'italic' }}>
            You'll return with discovered resources when exploration completes.
          </p>
        </div>
      ) : (
        <div>
          {exploration.recentDiscoveries && exploration.recentDiscoveries.length > 0 && (
            <div style={{ 
              backgroundColor: '#2a4a2a', 
              border: '1px solid #4a8a4a',
              padding: '1rem', 
              borderRadius: 8, 
              marginBottom: '1.5rem' 
            }}>
              <h3 style={{ color: '#66ff66', marginBottom: '0.5rem', fontSize: '1rem' }}>🎉 Exploration Complete!</h3>
              <p style={{ color: '#aaa', marginBottom: '0.5rem', fontSize: '0.9rem' }}>You discovered:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {exploration.recentDiscoveries?.map((discovery: { resourceId: string, amount: number }, index: number) => {
                  const resource = resources.find((r: Resource) => r.id === discovery.resourceId)
                  return (
                    <span key={index} style={{ 
                      backgroundColor: '#3a5a3a',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.85rem',
                      color: '#88ff88'
                    }}>
                      +{discovery.amount} {resource?.name || discovery.resourceId}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {gameData.survival.explorationTypes.map((expType: any) => (
              <button 
                key={expType.id}
                style={{ 
                  fontSize: '1.1rem', 
                  padding: '1.5rem',
                  borderRadius: 10,
                  backgroundColor: expType.id === 'quick_scout' ? '#2a4a2a' : '#4a2a2a',
                  border: expType.id === 'quick_scout' ? '1px solid #4a6a4a' : '1px solid #6a4a4a',
                  color: '#ccc'
                }} 
                onClick={() => startExploration(expType.duration)}
                disabled={!canAffordExploration(expType)}
              >
                <div>{expType.icon} {expType.name}</div>
                <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                  {expType.duration} seconds<br/>
                  -{expType.foodCost} food, -{expType.waterCost} water, -{expType.warmthCost} warmth
                </div>
              </button>
            ))}
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Targeted Expeditions</h3>
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
      )}
    </div>
  )
}