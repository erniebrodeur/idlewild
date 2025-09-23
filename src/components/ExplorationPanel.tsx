import React from 'react'
import { Resource, SurvivalNeed, Exploration } from '../types/GameTypes'

interface ExplorationPanelProps {
  exploration: Exploration
  resources: Resource[]
  needs: SurvivalNeed[]
  startExploration: (duration: number) => void
  clickGather: (resourceId: string, amount: number) => void
}

export default function ExplorationPanel({ 
  exploration, 
  resources, 
  needs, 
  startExploration, 
  clickGather 
}: ExplorationPanelProps) {
  const foodResource = resources.find(r => r.id === 'food')
  const waterResource = resources.find(r => r.id === 'water')
  const warmthNeed = needs.find(n => n.id === 'warmth')

  const canQuickScout = foodResource && foodResource.amount >= 5 &&
                       waterResource && waterResource.amount >= 3 &&
                       warmthNeed && warmthNeed.current >= 4

  const canLongExpedition = foodResource && foodResource.amount >= 15 &&
                           waterResource && waterResource.amount >= 9 &&
                           warmthNeed && warmthNeed.current >= 12

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '1rem' }}>🔍 Exploration Operations</h2>
      <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '1rem' }}>
        Venture into the wilderness to discover various resources. Costs food, water, and warmth!
      </p>
      
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
          {/* Show recent discoveries */}
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
                  const resource = resources.find(r => r.id === discovery.resourceId)
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
            <button 
              style={{ 
                fontSize: '1.1rem', 
                padding: '1.5rem',
                borderRadius: 10,
                backgroundColor: '#2a4a2a',
                border: '1px solid #4a6a4a',
                color: '#ccc'
              }} 
              onClick={() => startExploration(10)}
              disabled={!canQuickScout}
            >
              <div>🏃 Quick Scout</div>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                10 seconds<br/>
                -5 food, -3 water, -4 warmth
              </div>
            </button>
            <button 
              style={{ 
                fontSize: '1.1rem', 
                padding: '1.5rem',
                borderRadius: 10,
                backgroundColor: '#4a2a2a',
                border: '1px solid #6a4a4a',
                color: '#ccc'
              }} 
              onClick={() => startExploration(30)}
              disabled={!canLongExpedition}
            >
              <div>🎒 Long Expedition</div>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                30 seconds<br/>
                -15 food, -9 water, -12 warmth
              </div>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button 
              style={{ 
                fontSize: '1rem', 
                padding: '1rem',
                borderRadius: 8,
                backgroundColor: '#2a3a2a',
                border: '1px solid #4a5a4a',
                color: '#ccc'
              }} 
              onClick={() => clickGather('food', 0.5)}
            >
              🍎 Forage for Food (+0.5)
            </button>
            <button 
              style={{ 
                fontSize: '1rem', 
                padding: '1rem',
                borderRadius: 8,
                backgroundColor: '#2a3a3a',
                border: '1px solid #4a5a5a',
                color: '#ccc'
              }} 
              onClick={() => clickGather('water', 0.3)}
            >
              💧 Collect Water (+0.3)
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #444' }}>
        <p style={{ fontSize: '0.95rem', color: '#888', textAlign: 'center', fontStyle: 'italic' }}>
          Use the Settings panel (⚙️) to access emergency reset and game data management
        </p>
      </div>
    </div>
  )
}