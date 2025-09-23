import React from 'react'

interface GameHeaderProps {
  onShowSettings: () => void
  onShowDebug: () => void
}

export default function GameHeader({ onShowSettings, onShowDebug }: GameHeaderProps) {
  
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('localhost')

  return (
    <header style={{ 
      borderBottom: '1px solid #444',
      paddingBottom: '1rem'
    }}>
      <div>
        <h1 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.8rem',
          color: '#87ceeb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🚀 Crash Site Delta-7
        </h1>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
        <button 
          onClick={onShowSettings}
          style={{
            padding: '0.4rem',
            backgroundColor: 'transparent',
            color: '#888',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '1rem',
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
              padding: '0.4rem',
              backgroundColor: 'transparent',
              color: '#ff6666',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1rem',
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
    </header>
  )
}