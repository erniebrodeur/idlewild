import React from 'react'
import GameHeader from './GameHeader'
import { Resource } from '../types/GameTypes'

interface ResourcesSidebarProps {
  resources: Resource[]
  onShowSettings: () => void
  onShowDebug: () => void
}

export default function ResourcesSidebar({ 
  resources, 
  onShowSettings, 
  onShowDebug 
}: ResourcesSidebarProps) {
  return (
    <div style={{ 
      width: '300px',
      flexShrink: 0
    }}>
      <GameHeader
        onShowSettings={onShowSettings}
        onShowDebug={onShowDebug}
      />
      
      {/* Resources */}
      <div className="panel" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>📦 Resources</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {resources.filter(r => r.discovered).map(resource => (
            <div key={resource.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '1rem',
              color: '#ccc'
            }}>
              <span>{resource.name}</span>
              <span style={{ color: '#87ceeb', fontWeight: 'bold' }}>
                {Math.floor(resource.amount * 10) / 10}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}