# Flappy Gull — Technical Architecture

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Game Engine**: Phaser 3 (v3.80+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS for UI elements
- **State Management**: React Context + Zustand for lobby state

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime Channels
- **Hosting**: Vercel (Next.js)
- **Storage**: Supabase Storage (for assets if needed)

### Development Tools
- **Node.js**: v22.16.0 (via nvm)
- **Package Manager**: npm
- **Pixel Art**: Generated programmatically or created with Aseprite equivalent
- **Testing**: Jest + Playwright (for later)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router                                          │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │ React UI     │  │ Phaser 3 Game Canvas                 │ │
│  │ - Home       │  │ - Game loop (60 FPS)                 │ │
│  │ - Lobby      │  │ - Physics (Arcade)                   │ │
│  │ - Results    │  │ - Rendering (WebGL/Canvas)           │ │
│  │ - Leaderboard│  │ - Input handling                     │ │
│  └──────┬───────┘  └────────┬────────────────────────────┘ │
│         │                   │                               │
│         └──────────┬────────┘                               │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ WebSocket + HTTP
                     │
┌────────────────────┼────────────────────────────────────────┐
│                    │         Supabase                        │
├────────────────────┼────────────────────────────────────────┤
│  ┌─────────────────┴──────┐  ┌─────────────────────────┐   │
│  │ Realtime Channels      │  │ PostgreSQL Database     │   │
│  │ - Lobby presence       │  │ - lobbies               │   │
│  │ - Game state sync      │  │ - matches               │   │
│  │ - Player positions     │  │ - match_players         │   │
│  │                        │  │ - leaderboard           │   │
│  └────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Database Schema

#### `lobbies`
```sql
id: uuid (PK)
code: varchar(6) unique -- e.g., "ABC123"
host_id: varchar
created_at: timestamp
status: enum('waiting', 'in_progress', 'finished')
```

#### `matches`
```sql
id: uuid (PK)
lobby_id: uuid (FK)
started_at: timestamp
ended_at: timestamp
duration_seconds: int (300 for 5 minutes)
status: enum('in_progress', 'completed')
```

#### `match_players`
```sql
id: uuid (PK)
match_id: uuid (FK)
player_id: varchar
player_name: varchar(50)
team: varchar(50) nullable
total_distance: int
best_round_distance: int
death_count: int
tokens_collected: int
final_rank: int
created_at: timestamp
```

#### `leaderboard`
```sql
id: uuid (PK)
match_id: uuid (FK)
player_name: varchar(50)
total_distance: int
best_round_distance: int
death_count: int
tokens_collected: int
played_at: timestamp
```

### Realtime Channel Structure

#### Lobby Channel: `lobby:{code}`
**Purpose**: Presence tracking and lobby management

**Events**:
- `presence` - Who's in the lobby
- `player_joined` - New player announcement
- `player_ready` - Ready status updates
- `match_start` - Host initiates match
- `player_kicked` - Host removes player

**Payload examples**:
```typescript
// presence state
{
  player_id: string
  player_name: string
  team?: string
  is_ready: boolean
  is_host: boolean
}

// match_start
{
  match_id: string
  started_at: string
}
```

#### Game Channel: `game:{match_id}`
**Purpose**: Real-time game state synchronisation

**Events**:
- `round_start` - New round begins
- `player_state` - Position/velocity updates (throttled to ~10Hz)
- `player_death` - Someone crashed
- `round_end` - Round results
- `token_collected` - Collectible picked up
- `match_end` - Match time expired

**Payload examples**:
```typescript
// player_state (broadcast every ~100ms per player)
{
  player_id: string
  x: number  // probably unnecessary, all scroll same
  y: number
  velocity_y: number
  distance: number
  is_alive: boolean
  animation: 'flap_up' | 'flap_mid' | 'flap_down' | 'death'
}

// player_death
{
  player_id: string
  distance: number
  timestamp: string
}

// round_end
{
  round_number: number
  rankings: Array<{
    player_id: string
    distance: number
    tokens: number
  }>
}
```

## Game State Management

### Client-Side Game State (in Phaser)
- **Local player**: Full physics simulation
- **Remote players**: Interpolated ghost positions
- **Obstacles**: Deterministic generation (seed-based)
- **Collectibles**: Deterministic generation (seed-based)

### State Synchronisation Strategy
**"Optimistic local, eventual consistency"**

1. **Local player**:
   - Full client-side physics (no lag)
   - Broadcast position every 100ms
   - Broadcast events immediately (death, token)

2. **Remote players**:
   - Receive position updates
   - Linear interpolation between updates
   - Show name tags above sprites

3. **Obstacles**:
   - Seed-based generation (same seed = same obstacles)
   - Seed broadcast at round start
   - No need to sync individual obstacle positions

4. **Round lifecycle**:
   - Server-authoritative round start/end
   - All clients wait for `round_start` event
   - Round ends when last player dies (tracked server-side)

### Anti-Cheat (Basic)
- Server-side validation of final scores
- Distance must be <= `(match_duration * max_possible_speed)`
- Token count must be <= `(distance / min_token_spacing)`
- Rate limit score submissions per lobby
- Sanity checks on death count vs round count

## Networking Performance

### Bandwidth Considerations
- 8 players × 10 updates/sec × ~100 bytes = ~8 KB/s per client
- Acceptable for office Wi-Fi

### Latency Handling
- **Target**: <100ms for lobby interactions
- **Game state**: Update rate 10Hz (100ms) is fine for ghost players
- **Local player**: Zero latency (client-side physics)

### Failure Modes
- Player disconnects: Remove from presence, mark as spectator
- Host disconnects: Migrate host to next player in lobby
- Network hiccup: Ghost players freeze briefly, then catch up

## File Structure (Proposed)

```
flappygull/
├── docs/
│   ├── prd.md
│   ├── technical-architecture.md (this file)
│   ├── implementation-plan.md
│   └── asset-guide.md
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Home (create/join lobby)
│   │   ├── lobby/[code]/page.tsx
│   │   ├── game/[matchId]/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   └── api/               # API routes
│   │       ├── lobby/create/route.ts
│   │       ├── lobby/join/route.ts
│   │       └── match/submit/route.ts
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── lobby/             # Lobby-specific components
│   │   └── game/              # Game HUD components
│   ├── game/                  # Phaser game code
│   │   ├── index.ts           # Game bootstrap
│   │   ├── scenes/
│   │   │   ├── GameScene.ts   # Main gameplay
│   │   │   ├── UIScene.ts     # HUD overlay
│   │   │   └── SpectatorScene.ts
│   │   ├── entities/
│   │   │   ├── Seagull.ts
│   │   │   ├── Obstacle.ts
│   │   │   ├── Token.ts
│   │   │   └── RemoteGull.ts
│   │   ├── systems/
│   │   │   ├── PhysicsSystem.ts
│   │   │   ├── ObstacleGenerator.ts
│   │   │   ├── NetworkSync.ts
│   │   │   └── ScoreManager.ts
│   │   └── config.ts
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── realtime.ts        # Realtime helper functions
│   │   └── utils.ts
│   ├── stores/
│   │   ├── lobbyStore.ts      # Zustand store for lobby
│   │   └── gameStore.ts       # Zustand store for match state
│   ├── types/
│   │   ├── game.ts
│   │   ├── lobby.ts
│   │   └── database.ts
│   └── assets/                # Game assets
│       ├── sprites/
│       │   ├── seagull.png
│       │   ├── obstacles.png
│       │   └── token.png
│       ├── backgrounds/
│       └── sounds/
├── public/
│   └── assets/                # Static assets served directly
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Optional test data
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.local                 # Supabase credentials
```

## Key Technical Decisions

### 1. Phaser Integration with Next.js
- **Challenge**: Phaser expects browser globals, Next.js has SSR
- **Solution**:
  - Dynamic import Phaser with `ssr: false`
  - Initialise game in `useEffect` hook
  - Clean up on unmount

### 2. Obstacle Generation (Deterministic)
- **Why**: Ensures all players see same obstacles without syncing each one
- **How**:
  - Seed RNG with match ID + round number
  - Each client generates identical obstacle sequence
  - Only sync the seed at round start

### 3. Network Update Rate
- **Position updates**: 10Hz (every 100ms)
  - Good enough for ghost visualisation
  - Keeps bandwidth reasonable
- **Event updates**: Immediate
  - Deaths, tokens, round transitions send instantly

### 4. Physics Authority
- **Local player**: Client-authoritative
  - Responsive controls are critical
  - Server validates final scores, not every frame
- **Remote players**: Display-only
  - Just interpolate received positions
  - No collision detection with local player

### 5. Score Validation
**Client submits**:
```typescript
{
  match_id: string
  player_id: string
  total_distance: number
  best_round: number
  deaths: number
  tokens: number
}
```

**Server checks**:
- Match exists and is completed
- Distance < (300 seconds × 5 pixels/second × 60 FPS) = reasonable max
- Token count < (distance / 100) = plausible token density
- Death count > 0 (everyone dies at least once)
- Player was in that match (check presence logs)

If validation fails, reject submission (but don't penalise — just log it)

## Performance Targets

- **Initial load**: <2s to lobby on office Wi-Fi
- **Match start**: <1s from "Start Match" click to gameplay
- **Frame rate**: Stable 60 FPS on mid-range laptops
- **Network jitter**: Graceful handling of 100-200ms latency spikes
- **Concurrent players**: 4-10 players per match without lag
- **Mobile**: 30 FPS acceptable, touch controls responsive

## Browser Support

- **Primary**: Chrome, Firefox, Safari (latest)
- **Mobile**: Safari iOS, Chrome Android
- **Requirements**: WebGL support, WebSocket support

## Security Considerations

- **Input validation**: Sanitise all player names, team names
- **Rate limiting**: Limit lobby creation, score submissions
- **SQL injection**: Use Supabase parameterised queries (automatic)
- **XSS**: Sanitise any user-generated content in leaderboards
- **CORS**: Configure Supabase policies properly

## Monitoring & Debugging

- **Client-side**: Console logs for game events (dev mode)
- **Network**: Supabase dashboard shows realtime connections
- **Performance**: Phaser debug mode shows FPS, physics bounds
- **Errors**: Catch and log Supabase errors, network failures
