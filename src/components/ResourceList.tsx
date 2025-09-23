import React from 'react'
import '../index.css'

type ResourceListProps = {
  resources: { 
    id: string; 
    name: string; 
    amount: number; 
    discovered?: boolean;
    category?: string;
    description?: string;
  }[]
}

export default function ResourceList({ resources }: ResourceListProps) {
  const discoveredResources = resources.filter(r => r.discovered)
  
  // Group resources by category for better organization
  const groupedResources = discoveredResources.reduce((groups, resource) => {
    const category = resource.category || 'other'
    if (!groups[category]) groups[category] = []
    groups[category].push(resource)
    return groups
  }, {} as Record<string, typeof discoveredResources>)
  
  const categoryOrder = ['basic', 'building', 'power', 'health', 'knowledge', 'equipment', 'other']
  const categoryIcons = {
    basic: '🥫',
    building: '🔧',
    power: '⚡',
    health: '💊',
    knowledge: '📚',
    equipment: '🛠️',
    other: '📦'
  }
  
  return (
    <div className="resource-list">
      <h3>📊 Resource Inventory</h3>
      {categoryOrder.map(category => {
        const categoryResources = groupedResources[category]
        if (!categoryResources || categoryResources.length === 0) return null
        
        return (
          <div key={category} style={{ marginBottom: 16 }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#aaa', 
              marginBottom: 8,
              textTransform: 'capitalize'
            }}>
              {categoryIcons[category as keyof typeof categoryIcons]} {category}
            </div>
            {categoryResources.map((r) => (
              <div key={r.id} className="resource-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 4,
                marginBottom: 4
              }}>
                <div>
                  <span className="resource-name" style={{ fontWeight: 'bold' }}>
                    {r.name}
                  </span>
                  {r.description && (
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {r.description}
                    </div>
                  )}
                </div>
                <span className="resource-amount" style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold',
                  color: r.amount < 5 ? '#ff6666' : '#66ff66'
                }}>
                  {r.amount.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )
      })}
      {discoveredResources.length === 0 && (
        <p className="muted">No resources discovered yet. Start scavenging to find supplies!</p>
      )}
    </div>
  )
}
