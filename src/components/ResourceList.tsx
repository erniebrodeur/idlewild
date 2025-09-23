import React from 'react'
import '../index.css'

type ResourceListProps = {
  resources: { id: string; name: string; amount: number; discovered?: boolean }[]
}

export default function ResourceList({ resources }: ResourceListProps) {
  const discoveredResources = resources.filter(r => r.discovered)
  
  return (
    <div className="resource-list">
      {discoveredResources.map((r) => (
        <div key={r.id} className="resource-item">
          <span className="resource-name">{r.name}</span>
          <span className="resource-amount">{Math.floor(r.amount)}</span>
        </div>
      ))}
    </div>
  )
}
