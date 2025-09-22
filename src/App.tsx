import React, { useEffect, useRef, useState } from 'react'
import './index.css'

/*
  Simple incremental core inspired by Theory of Magic / The Kitten Game:
  - Multiple resources
  - Multiple producer types
  - Idle tick, offline progress, autosave
  - Buying producers and level upgrades
  This is intentionally small and extensible.
*/

type Resource = {
  id: string
  name: string
  amount: number
}

type Producer = {
  id: string
  name: string
  resource: string // resource id it produces
  count: number
  baseCost: number
  growth: number
  power: number // production per tick per producer (before level)
}

type GameState = {
  resources: Resource[]
  producers: Producer[]
  producerLevel: number
  lastSaved: number
}

const SAVE_KEY = 'idlewild:v2'

function defaultState(): GameState {
  return {
    resources: [
      { id: 'coins', name: 'Coins', amount: 0 },
      { id: 'mana', name: 'Mana', amount: 0 }
    ],
    producers: [
      { id: 'miner', name: 'Miner', resource: 'coins', count: 0, baseCost: 10, growth: 1.15, power: 1 },
      { id: 'apprentice', name: 'Apprentice', resource: 'mana', count: 0, baseCost: 25, growth: 1.2, power: 0.5 }
    ],
    producerLevel: 1,
    lastSaved: Date.now()
  }
}

function useIncrementalGame(tickInterval = 1000) {
  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) return JSON.parse(raw) as GameState
    } catch (e) {
      // ignore
    }
    return defaultState()
  })

  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    // main tick
    tickRef.current = window.setInterval(() => {
      setState((s) => {
        if (s.producers.length === 0) return s
        const resources = s.resources.map((r) => ({ ...r }))
        for (const p of s.producers) {
          if (p.count <= 0) continue
          const produced = p.count * p.power * s.producerLevel
          const target = resources.find((res) => res.id === p.resource)
          if (target) target.amount += produced
        }
        return { ...s, resources, lastSaved: s.lastSaved }
      })
    }, tickInterval)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [tickInterval])

  // autosave every 5s
  useEffect(() => {
    const id = window.setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSaved: Date.now() }))
    }, 5000)
    return () => clearInterval(id)
  }, [state])

  // offline progress on mount
  useEffect(() => {
    const now = Date.now()
    const dt = Math.floor((now - state.lastSaved) / 1000)
    if (dt > 0) {
      // apply dt ticks
      setState((s) => {
        const resources = s.resources.map((r) => ({ ...r }))
        for (const p of s.producers) {
          if (p.count <= 0) continue
          const produced = p.count * p.power * s.producerLevel * dt
          const target = resources.find((res) => res.id === p.resource)
          if (target) target.amount += produced
        }
        return { ...s, resources }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // helpers
  function getResource(id: string) {
    return state.resources.find((r) => r.id === id)!
  }

  function addResource(id: string, amount: number) {
    setState((s) => ({
      ...s,
      resources: s.resources.map((r) => (r.id === id ? { ...r, amount: r.amount + amount } : r))
    }))
  }

  function buyProducer(pid: string) {
    setState((s) => {
      const producers = s.producers.map((p) => ({ ...p }))
      const p = producers.find((x) => x.id === pid)
      if (!p) return s
      const cost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
      const res = s.resources.find((r) => r.id === 'coins')
      if (!res || res.amount < cost) return s
      // deduct
      const resources = s.resources.map((r) => (r.id === 'coins' ? { ...r, amount: r.amount - cost } : r))
      p.count += 1
      return { ...s, producers, resources }
    })
  }

  function upgradeProducers() {
    setState((s) => {
      const cost = 100 * s.producerLevel
      const res = s.resources.find((r) => r.id === 'coins')
      if (!res || res.amount < cost) return s
      const resources = s.resources.map((r) => (r.id === 'coins' ? { ...r, amount: r.amount - cost } : r))
      return { ...s, producerLevel: s.producerLevel + 1, resources }
    })
  }

  function clickGather(resourceId: string, amount = 1) {
    addResource(resourceId, amount)
  }

  function reset() {
    setState(defaultState())
    localStorage.removeItem(SAVE_KEY)
  }

  return { state, buyProducer, upgradeProducers, clickGather, reset }
}

export default function App() {
  const { state, buyProducer, upgradeProducers, clickGather, reset } = useIncrementalGame()

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Idlewild — incremental prototype</h1>

      <section style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 260 }}>
          <h2>Resources</h2>
          {state.resources.map((r) => (
            <div key={r.id} style={{ marginBottom: 8 }}>
              <strong>{r.name}:</strong> {Math.floor(r.amount)}{' '}
              <button onClick={() => clickGather(r.id, 1)} style={{ marginLeft: 8 }}>Gather +1</button>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div>Producer level: x{state.producerLevel}</div>
            <button onClick={upgradeProducers} disabled={(state.resources.find(r=>r.id==='coins')?.amount||0) < 100}>
              Upgrade Producers (cost: 100)
            </button>
          </div>
        </div>

        <div>
          <h2>Producers</h2>
          {state.producers.map((p) => {
            const nextCost = Math.ceil(p.baseCost * Math.pow(p.growth, p.count))
            return (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div>Produces: {p.power * state.producerLevel} {p.resource} / tick each</div>
                <div>Owned: {p.count}</div>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => buyProducer(p.id)} disabled={(state.resources.find(r=>r.id==='coins')?.amount||0) < nextCost}>
                    Buy — cost: {nextCost}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <button onClick={reset}>Reset</button>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>Auto-saving every 5s. Offline progress is applied on load.</p>
    </div>
  )
}
