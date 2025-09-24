import React, { useState } from 'react'

export interface TabDefinition {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsContainerProps {
  tabs: TabDefinition[]
  defaultTab?: string
  className?: string
}

export default function TabsContainer({ tabs, defaultTab, className }: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={`tabs-container ${className || ''}`}>
      {/* Tab Navigation */}
      <div className="tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTabContent}
      </div>
    </div>
  )
}