import React from 'react'

type SurvivalNeed = {
  id: string
  name: string
  current: number
  max: number
  decayRate: number
  criticalThreshold: number
}

interface GameHeaderProps {
  daysSurvived: number
  needs: SurvivalNeed[]
  onShowSettings: () => void
  onShowDebug: () => void
}

export default function GameHeader({ daysSurvived, needs, onShowSettings, onShowDebug }: GameHeaderProps) {
  // Get critical survival status
  const criticalNeeds = needs.filter(n => n.current <= n.criticalThreshold)
  const survivalStatus = criticalNeeds.length > 0 ? 'critical' : 'stable'
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('localhost')

  return (
    <header style={{ 
      marginBottom: '2rem',
      borderBottom: '1px solid #444',
      paddingBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: '2.5rem',
            color: '#87ceeb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            🚀 Crash Site Delta-7
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#aaa',
            fontSize: '1.2rem'
          }}>
            Day {daysSurvived} • Status: <span style={{
              color: survivalStatus === 'critical' ? '#ff6666' : '#66ff66',
              fontWeight: 'bold'
            }}>{survivalStatus}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={onShowSettings}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#888',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.color = '#ccc'}
            onMouseOut={(e) => (e.target as HTMLElement).style.color = '#888'}
            title="Settings"
          >
            ⚙️
          </button>
          {isLocalhost && (
            <button 
              onClick={onShowDebug}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: '#ff6666',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.color = '#ff9999'}
              onMouseOut={(e) => (e.target as HTMLElement).style.color = '#ff6666'}
              title="Debug Panel"
            >
              🐛
            </button>
          )}
        </div>
      </div>
    </header>
  )
}