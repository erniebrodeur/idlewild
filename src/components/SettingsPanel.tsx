import React, { useState } from 'react'
import '../index.css'

type SettingsPanelProps = {
  isVisible: boolean
  onClose: () => void
  onReset: () => void
  gameState: any
}

export default function SettingsPanel({ isVisible, onClose, onReset, gameState }: SettingsPanelProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [importError, setImportError] = useState('')

  if (!isVisible) return null

  const handleExportGame = () => {
    try {
      const exportJson = JSON.stringify(gameState, null, 2)
      setExportData(exportJson)
      
      // Also copy to clipboard if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(exportJson)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImportGame = () => {
    try {
      setImportError('')
      const parsed = JSON.parse(importData)
      
      // Basic validation of the game state structure
      if (!parsed.resources || !Array.isArray(parsed.resources)) {
        throw new Error('Invalid game state: missing or invalid resources')
      }
      if (!parsed.producers || !Array.isArray(parsed.producers)) {
        throw new Error('Invalid game state: missing or invalid producers')
      }
      if (!parsed.survival || !parsed.survival.needs || !Array.isArray(parsed.survival.needs)) {
        throw new Error('Invalid game state: missing or invalid survival data')
      }

      // Store the imported data in localStorage and reload
      localStorage.setItem('idlewild:v2', importData)
      window.location.reload()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Invalid JSON format')
    }
  }

  const handleResetConfirm = () => {
    onReset()
    setShowResetConfirm(false)
    onClose()
  }

  const downloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `idlewild-save-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#66ccff' }}>⚙️ Settings</h2>
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

        {/* Game Data Management */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#88ddff', marginBottom: '1rem' }}>💾 Game Data</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <button 
              onClick={handleExportGame}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              📤 Export Game
            </button>
            {exportData && (
              <button 
                onClick={downloadExport}
                style={{
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#008800',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                💾 Download Export
              </button>
            )}
          </div>

          {exportData && (
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                value={exportData}
                readOnly
                style={{
                  width: '100%',
                  height: '120px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #555',
                  borderRadius: 4,
                  color: '#ccc',
                  padding: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  resize: 'vertical'
                }}
                placeholder="Exported game data will appear here..."
              />
              <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.5rem 0 0 0' }}>
                Game data exported successfully! Data has been copied to clipboard if available.
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: '#88ddff', marginBottom: '0.5rem' }}>📥 Import Game</h4>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ccc',
                padding: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                resize: 'vertical'
              }}
              placeholder="Paste your exported game data here..."
            />
            {importError && (
              <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                Error: {importError}
              </p>
            )}
            <button 
              onClick={handleImportGame}
              disabled={!importData.trim()}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: importData.trim() ? '#cc6600' : '#333',
                color: importData.trim() ? 'white' : '#666',
                border: 'none',
                borderRadius: 6,
                cursor: importData.trim() ? 'pointer' : 'not-allowed',
                marginTop: '0.5rem'
              }}
            >
              📥 Import Game
            </button>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.5rem 0 0 0' }}>
              Warning: Importing will overwrite your current game and reload the page.
            </p>
          </div>
        </div>

        {/* Emergency Reset */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#ff6666', marginBottom: '1rem' }}>🚨 Emergency Actions</h3>
          
          {!showResetConfirm ? (
            <button 
              onClick={() => setShowResetConfirm(true)}
              style={{
                padding: '0.8rem 1.5rem',
                backgroundColor: '#cc3333',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              🗑️ Emergency Reset
            </button>
          ) : (
            <div style={{
              padding: '1rem',
              backgroundColor: '#2a1a1a',
              border: '2px solid #cc3333',
              borderRadius: 8
            }}>
              <p style={{ color: '#ff6666', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                ⚠️ Are you sure you want to reset?
              </p>
              <p style={{ color: '#ccc', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                This will permanently delete your current game progress and cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleResetConfirm}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: '#cc3333',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Yes, Reset Game
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: '#555',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#88ddff', marginBottom: '1rem' }}>📊 Game Info</h3>
          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '1rem', 
            borderRadius: 6,
            border: '1px solid #555'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
              <strong>Days Survived:</strong> {gameState.daysSurvived}
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
              <strong>Resources Discovered:</strong> {gameState.resources?.filter((r: any) => r.discovered).length || 0}
            </p>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
              <strong>Producers Deployed:</strong> {gameState.producers?.reduce((sum: number, p: any) => sum + p.count, 0) || 0}
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem' }}>
              <strong>Upgrades Purchased:</strong> {gameState.upgradesPurchased?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}