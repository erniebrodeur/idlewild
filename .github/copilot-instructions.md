# Idlewild - AI Coding Instructions

## Project Overview
Idlewild is a survival incremental/idle game built with React + TypeScript + Vite. Players manage resources, build producers, purchase upgrades, and survive in a post-apocalyptic setting with survival mechanics like hunger, thirst, and warmth.

## Architecture & Data Flow

### Core Game State Pattern
- **Single source of truth**: `useIncrementalGame` hook manages all game state via React `useState`
- **Data-driven design**: Game configuration lives in `src/data/game-data.json` - resources, producers, upgrades, and survival settings
- **Persistent state**: Auto-saves to localStorage every 5 seconds with offline progress calculation
- **Tick-based updates**: 1-second intervals drive resource production, survival decay, and exploration timers

### Key Files to Understand
- `src/types/GameTypes.ts` - Core type definitions for all game entities
- `src/hooks/useIncrementalGame.ts` - Main game loop, state management, and persistence
- `src/utils/gameLogic.ts` - Pure functions for upgrade effects and state initialization
- `src/data/game-data.json` - Configuration-driven content (resources, producers, upgrades)

## Development Patterns

### Component Architecture
- **Props drilling pattern**: `App.tsx` → `GameLayout.tsx` → individual panels
- **Functional components only**: No class components, hooks for state management
- **Panel-based UI**: Each game feature (resources, survival, campfire) gets its own component in `src/components/`

### State Updates
```typescript
// Always use functional state updates for immutability
setState((s) => ({
  ...s,
  resources: s.resources.map((r) => 
    r.id === id ? { ...r, amount: r.amount + amount } : r
  )
}))
```

### Adding New Features
1. **Types first**: Define interfaces in `GameTypes.ts`
2. **Data configuration**: Add to `game-data.json` if content-driven
3. **Game logic**: Pure functions in `gameLogic.ts` for calculations
4. **Hook integration**: Update `useIncrementalGame` for state management
5. **UI component**: Create panel in `src/components/`

## Development Workflow

### Build & Dev Commands
- `npm run dev` - Vite dev server with HMR (primary development)
- `npm run build:watch` - File watcher that rebuilds on changes
- `npm run livereload` - Production build preview with auto-reload
- `npm run typecheck` - TypeScript checking without emit

### Project Structure Conventions
- **No barrel exports**: Direct imports from individual files
- **Co-location**: Related types, logic, and components grouped by feature
- **JSON imports**: TypeScript configured to import JSON directly as modules

### Game Data Configuration
All game content is data-driven through `game-data.json`:
- **Resources**: Basic entities with discovery states and categories
- **Producers**: Auto-generating entities with costs, growth rates, and power
- **Upgrades**: Modifier system with unlock conditions and effect types
- **Survival**: Needs, colonists, and special mechanics (campfire, exploration)

### Upgrade System Pattern
```typescript
// Upgrades use effect types: "multiplier", "survival_modifier", "unlock"
"effect": { "type": "multiplier", "target": "water_collector", "value": 1.5 }
```

### Save System
- **Version key**: `SAVE_KEY = 'idlewild:v2'` in localStorage
- **Graceful loading**: Merges saved state with defaults for missing properties
- **Offline progress**: Calculates time delta and applies production/decay on load

## Common Tasks

### Adding a New Resource
1. Add to `game-data.json` resources array
2. Resource automatically available via `defaultState()` merge logic
3. UI will show when `discovered: true` or amount > 0

### Adding a New Producer
1. Define in `game-data.json` with cost, growth, power values
2. Ensure target resource exists
3. Hook automatically handles production in main tick loop

### Adding UI Panels
Follow existing pattern: create component in `src/components/`, import in `GameLayout.tsx`, pass required props from `useIncrementalGame` return values.

### TypeScript Configuration
- **Strict mode enabled**: All strict checks active
- **JSON modules**: `resolveJsonModule: true` for direct JSON imports
- **No emit**: Development uses Vite bundling, tsc for checking only