import React, { useState } from 'react'
import '../index.css'

type Resource = {
  id: string
  name: string
  amount: number
  discovered?: boolean
}

type ResourceListProps = {
  resources: Resource[]
}

export default function ResourceList({ resources }: ResourceListProps) {
  return (
    <div className="resource-list">
      {resources.filter(r => !!r.discovered).map((r) => (
        <div key={r.id} className="resource-item">
          <span className="resource-name">{r.name}</span>
          <span className="resource-amount">{Math.floor(r.amount)}</span>
        </div>
      ))}
    </div>
  )
}
