import React, { useState } from 'react'
import '../index.css'
import gameData from '../data/game-data.json'

type DebugPanelProps = {
  isVisible: boolean
  onClose: () => void
  gameState: any
  onGameStateChange: (newState: any) => void
}

export default function DebugPanel({ isVisible, onClose, gameState, onGameStateChange }: DebugPanelProps) {
  const [selectedResource, setSelectedResource] = useState('food')
  const [resourceAmountInput, setResourceAmountInput] = useState('10')
  const [selectedProducer, setSelectedProducer] = useState('')
  const [producerCountInput, setProducerCountInput] = useState('1')

  if (!isVisible) return null

  const setResourceAmountInGame = (resourceId: string, amount: number) => {
    const newState = { ...gameState }
    const resource = newState.resources.find((r: any) => r.id === resourceId)
    if (resource) {
      resource.amount = amount
      resource.discovered = true
    }
    onGameStateChange(newState)
  }

  const addResourceAmount = (resourceId: string, amount: number) => {
    const newState = { ...gameState }
    const resource = newState.resources.find((r: any) => r.id === resourceId)
    if (resource) {
      resource.amount += amount
      resource.discovered = true
    }
    onGameStateChange(newState)
  }

  const discoverAllResources = () => {
    const newState = { ...gameState }
    newState.resources = newState.resources.map((r: any) => ({ ...r, discovered: true }))
    onGameStateChange(newState)
  }

  const discoverAllProducers = () => {
    const newState = { ...gameState }
    newState.producers = newState.producers.map((p: any) => ({ ...p, discovered: true }))
    onGameStateChange(newState)
  }

  const discoverAllUpgrades = () => {
    const newState = { ...gameState }
    const allUpgradeIds = gameData.upgrades?.map(u => u.id) || []
    newState.upgradesDiscovered = [...new Set([...newState.upgradesDiscovered, ...allUpgradeIds])]
    onGameStateChange(newState)
  }

  const purchaseAllUpgrades = () => {
    const newState = { ...gameState }
    const allUpgradeIds = gameData.upgrades?.map(u => u.id) || []
    newState.upgradesPurchased = [...new Set([...newState.upgradesPurchased, ...allUpgradeIds])]
    newState.upgradesDiscovered = [...new Set([...newState.upgradesDiscovered, ...allUpgradeIds])]
    onGameStateChange(newState)
  }

  const setProducerCountInGame = (producerId: string, count: number) => {
    const newState = { ...gameState }
    const producer = newState.producers.find((p: any) => p.id === producerId)
    if (producer) {
      producer.count = count
      producer.discovered = true
    }
    onGameStateChange(newState)
  }

  const maxAllSurvivalNeeds = () => {
    const newState = { ...gameState }
    newState.survival.needs = newState.survival.needs.map((need: any) => ({
      ...need,
      current: need.max
    }))
    onGameStateChange(newState)
  }

  const fillCampfire = () => {
    const newState = { ...gameState }
    newState.survival.campfire.fuel = newState.survival.campfire.maxFuel
    newState.survival.campfire.lit = true
    onGameStateChange(newState)
  }

  const handleQuickResourceSet = () => {
    const amount = parseFloat(resourceAmountInput)
    if (!isNaN(amount)) {
      setResourceAmountInGame(selectedResource, amount)
    }
  }

  const handleQuickResourceAdd = () => {
    const amount = parseFloat(resourceAmountInput)
    if (!isNaN(amount)) {
      addResourceAmount(selectedResource, amount)
    }
  }

  const handleProducerSet = () => {
    const count = parseInt(producerCountInput)
    if (!isNaN(count) && selectedProducer) {
      setProducerCountInGame(selectedProducer, count)
    }
  }

  const getRandomLoot = () => {
    const resourceIds = ['food', 'water', 'materials', 'energy', 'medicine', 'research', 'tools']
    resourceIds.forEach(id => {
      const amount = Math.random() * 50 + 10
      addResourceAmount(id, amount)
    })
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 12,
        padding: '2rem',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#ff6666' }}>🐛 Debug Console</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#aaa', 
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Resource Management */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#ff8866', marginBottom: '1rem' }}>📦 Resource Management</h3>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <select 
              value={selectedResource} 
              onChange={(e) => setSelectedResource(e.target.value)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc'
              }}
            >
              {gameState.resources?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <input 
              type="number" 
              value={resourceAmountInput} 
              onChange={(e) => setResourceAmountInput(e.target.value)}
              style={{
                width: '100px',
                padding: '0.5rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc'
              }}
            />
            <button 
              onClick={handleQuickResourceSet}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#cc6600',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Set
            </button>
            <button 
              onClick={handleQuickResourceAdd}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button onClick={() => addResourceAmount('food', 100)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#008800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              +100 Food
            </button>
            <button onClick={() => addResourceAmount('water', 100)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#0088cc', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              +100 Water
            </button>
            <button onClick={() => addResourceAmount('materials', 100)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#666600', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              +100 Materials
            </button>
            <button onClick={() => addResourceAmount('energy', 100)} style={{ padding: '0.4rem 0.8rem', backgroundColor: '#cccc00', color: 'black', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              +100 Energy
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={discoverAllResources}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#8800cc',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🔍 Discover All Resources
            </button>
            <button 
              onClick={getRandomLoot}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#cc8800',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🎲 Random Loot
            </button>
          </div>
        </div>

        {/* Producer Management */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#ff8866', marginBottom: '1rem' }}>🏭 Producer Management</h3>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <select 
              value={selectedProducer} 
              onChange={(e) => setSelectedProducer(e.target.value)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc'
              }}
            >
              <option value="">Select Producer</option>
              {gameState.producers?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input 
              type="number" 
              value={producerCountInput} 
              onChange={(e) => setProducerCountInput(e.target.value)}
              style={{
                width: '80px',
                padding: '0.5rem',
                backgroundColor: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc'
              }}
            />
            <button 
              onClick={handleProducerSet}
              disabled={!selectedProducer}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedProducer ? '#cc6600' : '#333',
                color: selectedProducer ? 'white' : '#666',
                border: 'none',
                borderRadius: 4,
                cursor: selectedProducer ? 'pointer' : 'not-allowed'
              }}
            >
              Set Count
            </button>
          </div>

          <button 
            onClick={discoverAllProducers}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#8800cc',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            🔍 Discover All Producers
          </button>
        </div>

        {/* Upgrade Management */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#ff8866', marginBottom: '1rem' }}>🔬 Upgrade Management</h3>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={discoverAllUpgrades}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#8800cc',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🔍 Discover All Upgrades
            </button>
            <button 
              onClick={purchaseAllUpgrades}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#cc0066',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              💰 Purchase All Upgrades
            </button>
          </div>
        </div>

        {/* Survival Management */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#ff8866', marginBottom: '1rem' }}>❤️ Survival Management</h3>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={maxAllSurvivalNeeds}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#00cc66',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              ❤️ Max All Needs
            </button>
            <button 
              onClick={fillCampfire}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#ff6600',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🔥 Fill Campfire
            </button>
          </div>
        </div>

        {/* Time Management */}
        {/* Current State Info */}
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '1rem', 
          borderRadius: 6,
          border: '1px solid #555'
        }}>
          <h4 style={{ color: '#88ddff', margin: '0 0 0.5rem 0' }}>📊 Current State</h4>
          <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
            <p style={{ margin: '0.2rem 0' }}>
              Resources: {gameState.resources?.filter((r: any) => r.discovered && r.amount > 0).length || 0} discovered with amounts
            </p>
            <p style={{ margin: '0.2rem 0' }}>
              Producers: {gameState.producers?.filter((p: any) => p.count > 0).length || 0} deployed
            </p>
            <p style={{ margin: '0.2rem 0' }}>
              Upgrades: {gameState.upgradesPurchased?.length || 0} purchased, {gameState.upgradesDiscovered?.length || 0} discovered
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}