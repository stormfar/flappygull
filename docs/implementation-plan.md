# Flappy Gull — Implementation Plan

## Implementation Phases

Following the PRD milestone structure with detailed breakdowns. This plan assumes ~2-3 weeks of focused development.

---

## Phase 1: Project Setup & Single-Player Prototype
**Goal**: Get basic Flappy Bird mechanics working locally

### 1.1 Project Initialisation
- [ ] Initialise Next.js 14 project with TypeScript
- [ ] Install dependencies: Phaser 3, Tailwind CSS, Supabase client
- [ ] Configure `next.config.js` for Phaser compatibility
- [ ] Set up basic folder structure (see technical-architecture.md)
- [ ] Configure TypeScript for Phaser types
- [ ] Create `.env.local` template

**Deliverable**: Empty Next.js app that boots

### 1.2 Phaser Integration
- [ ] Create `GameScene.ts` with basic Phaser setup
- [ ] Create game bootstrap component in `src/game/index.ts`
- [ ] Create React wrapper component that dynamically imports Phaser
- [ ] Test game renders in Next.js page (`/game/test`)
- [ ] Verify cleanup on unmount (no memory leaks)

**Deliverable**: Phaser canvas rendering in Next.js

### 1.3 Core Gameplay Mechanics
- [ ] **Seagull entity**:
  - Create `Seagull.ts` class extending Phaser sprite
  - Implement arcade physics body
  - Add flap mechanic (space/click = upward impulse)
  - Add gravity (constant downward force)
  - Add rotation based on velocity
  - Hitbox tuning (slightly smaller than sprite)

- [ ] **Controls**:
  - Keyboard input (space bar)
  - Mouse click input
  - Touch input (mobile)

- [ ] **Camera**:
  - Fixed vertical camera
  - Auto-scrolling horizontal movement (or gull moves right)

- [ ] **Ground collision**:
  - Add ground sprite/rectangle
  - Detect collision with ground = death

- [ ] **Basic death & restart**:
  - Detect death (hit ground or obstacle)
  - Show "Press space to restart" text
  - Reset seagull position, velocity
  - Restart game loop

**Deliverable**: Playable Flappy Bird clone with one seagull, no obstacles

### 1.4 Obstacles System
- [ ] **Obstacle generation**:
  - Create `Obstacle.ts` class (pair of sprites: top + bottom)
  - Create `ObstacleGenerator.ts` system
  - Spawn obstacles at regular intervals (every ~2 seconds)
  - Random gap positioning (within safe range)
  - Recycle off-screen obstacles (object pooling)

- [ ] **Collision detection**:
  - Add overlap detection between seagull and obstacle sprites
  - Trigger death on collision

- [ ] **Difficulty progression** (basic):
  - Start with wide gaps, comfortable speed
  - Gradually narrow gaps every 10 obstacles
  - Gradually increase scroll speed every 20 obstacles

**Deliverable**: Seagull dodging obstacles, game gets harder over time

### 1.5 Scoring System (Single-Player)
- [ ] **Distance tracking**:
  - Track distance travelled (pixels or "metres")
  - Display current distance on HUD

- [ ] **Obstacle counting**:
  - Track pipes passed
  - Display count on HUD

- [ ] **High score**:
  - Store best distance in localStorage
  - Display "Best: X" on HUD

**Deliverable**: Working score display, local high score

### 1.6 Collectibles (Tokens)
- [ ] Create `Token.ts` sprite
- [ ] Spawn tokens in risky positions (centre of gap, near edges)
- [ ] Add collision detection (collect on overlap)
- [ ] Add particle effect on collection (simple burst)
- [ ] Add sound effect (placeholder beep)
- [ ] Track token count in score
- [ ] Bonus points for tokens (e.g., +10 per token)

**Deliverable**: Collectible tokens spawning and working

---

## Phase 2: Art Pass V1
**Goal**: Replace placeholders with themed pixel art

### 2.1 Seagull Sprite
- [ ] Create pixel art seagull sprite sheet:
  - Base shape: larger than Flappy Bird (maybe 48×48px)
  - Flap animation: 3-4 frames (wings up, mid, down)
  - Bank/tilt: 2-3 rotation angles
  - Death frame: "bonk" with dizzy eyes

- [ ] Export as sprite sheet PNG with JSON
- [ ] Import into Phaser and configure animations
- [ ] Test smooth animation loop

**Deliverable**: Animated seagull sprite

### 2.2 Background & Environment
- [ ] Source or create parallax background layers:
  - Sky layer (light blue, static)
  - Distant hills/sea (slow scroll)
  - Beach/sand (medium scroll)
  - Foreground props (fast scroll)

- [ ] Create looping ground tile (sand/boardwalk)
- [ ] Implement parallax scrolling in GameScene
- [ ] Colour palette unification (Mallorca vibes: warm, sunny)

**Deliverable**: Themed Mallorca background

### 2.3 Obstacles (Holiday Theme)
- [ ] Create obstacle sprites (villa walls, parasols, palm trees):
  - Top obstacle variant (fronds, parasol tops)
  - Bottom obstacle variant (trunks, loungers)
  - Clear silhouettes, easy to read

- [ ] Replace placeholder rectangles with themed sprites
- [ ] Test readability while scrolling

**Deliverable**: Themed obstacles

### 2.4 Collectible & UI Assets
- [ ] Create token sprite (holiday voucher, booking token)
- [ ] Add sparkle animation for token
- [ ] Source or create UI elements:
  - Score panel background
  - Button styles (Kenney UI pack is good base)
  - Font for distance numbers (pixel font)

**Deliverable**: All art assets integrated

### 2.5 Polish & Juice
- [ ] Particle effects:
  - Wing trail particles (optional)
  - Death explosion (feathers?)
  - Token sparkles

- [ ] Placeholder sound effects:
  - Flap sound
  - Death sound
  - Token collection sound
  - Background music (optional, muted by default)

**Deliverable**: Game feels juicy and responsive

---

## Phase 3: Lobby & Multiplayer Sync
**Goal**: Get multiplayer working with lobby system

### 3.1 Supabase Setup
- [ ] Create Supabase project
- [ ] Set up database schema (see technical-architecture.md):
  - `lobbies` table
  - `matches` table
  - `match_players` table
  - `leaderboard` table

- [ ] Write SQL migrations
- [ ] Configure Row Level Security (RLS) policies
- [ ] Create Supabase client in `src/lib/supabase.ts`
- [ ] Test connection from Next.js

**Deliverable**: Database ready, connection working

### 3.2 Home Screen & Lobby Creation
- [ ] Create home page UI (`/`):
  - "Create Lobby" button
  - "Join Lobby" input field + button

- [ ] Implement lobby creation:
  - Generate unique 6-character code
  - Insert lobby into database
  - Redirect to `/lobby/[code]`

- [ ] Implement lobby join:
  - Validate code exists
  - Redirect to `/lobby/[code]`

**Deliverable**: Can create and join lobbies

### 3.3 Lobby UI & Presence
- [ ] Create lobby page (`/lobby/[code]/page.tsx`)
- [ ] Display lobby code and shareable link
- [ ] Implement Supabase Realtime presence on lobby channel
- [ ] Display list of connected players:
  - Player name
  - Ready status (checkbox)
  - Host indicator

- [ ] Add "Ready" button (toggle ready state)
- [ ] Host controls:
  - "Start Match" button (enabled when >1 player ready)
  - "Kick Player" button (optional)

- [ ] Handle disconnects (remove from presence)

**Deliverable**: Functional lobby with presence tracking

### 3.4 Match Initialisation
- [ ] Host clicks "Start Match":
  - Create match record in database
  - Broadcast `match_start` event to lobby channel
  - Redirect all players to `/game/[matchId]`

- [ ] Subscribe to `match_start` event in lobby
- [ ] Pass match metadata (match_id, players) to game page

**Deliverable**: Lobby → Game transition works

### 3.5 Real-Time Game State Sync
- [ ] Create game channel subscription (`game:{match_id}`)
- [ ] Implement `NetworkSync.ts` system in Phaser:
  - Broadcast local player position (every 100ms)
  - Receive remote player positions
  - Broadcast local player death event
  - Broadcast token collection event

- [ ] Create `RemoteGull.ts` entity:
  - Display ghost seagull at received position
  - Interpolate between position updates
  - Show player name tag above sprite
  - Play same animations as local player

- [ ] Test with 2 clients:
  - Both players see each other's gulls
  - Positions update smoothly
  - Death events trigger ghost animations

**Deliverable**: Multiplayer game with ghost players visible

---

## Phase 4: Match Rules & Round System
**Goal**: Implement 5-minute match with multiple rounds

### 4.1 Match Timer
- [ ] Add 5-minute countdown timer (300 seconds)
- [ ] Display timer on HUD
- [ ] Timer starts when match begins
- [ ] Broadcast `match_end` event when timer hits 0:00
- [ ] Pause game on match end, show results

**Deliverable**: Match ends after 5 minutes

### 4.2 Round System
- [ ] Define round lifecycle:
  - Round starts when all players spawn
  - Round ends when all players dead
  - New round starts automatically if match time remains

- [ ] Track round number (display on HUD)
- [ ] Implement `round_start` event:
  - Broadcast seed for obstacle generation
  - Reset all players to start position
  - Clear obstacles and tokens
  - Increment round counter

- [ ] Implement `round_end` event:
  - Calculate round rankings by distance
  - Display round results overlay (3 seconds)
  - Auto-start next round if time remains

**Deliverable**: Multiple rounds within one match

### 4.3 Death & Spectator Mode
- [ ] When local player dies:
  - Broadcast `player_death` event
  - Switch to spectator mode
  - Display "You died at Xm" message
  - Show "Spectating…" indicator

- [ ] Spectator camera:
  - Follow the current leader (highest distance)
  - Show all alive players as ghosts
  - Option to free-cam toggle (later)

- [ ] Track alive player count server-side
- [ ] Trigger `round_end` when last player dies

**Deliverable**: Death → spectate → round reset flow working

### 4.4 Score Accumulation
- [ ] Track per-player match state:
  - Total distance (sum across all rounds)
  - Best single-round distance
  - Death count (increments each round)
  - Total tokens collected

- [ ] Update state after each round
- [ ] Display cumulative scores on HUD:
  - Your total distance
  - Your best round
  - Match time remaining

**Deliverable**: Scores accumulate correctly across rounds

### 4.5 Round Rankings Display
- [ ] Create round-end overlay UI:
  - Show top 3 players that round
  - Highlight if local player placed top 3
  - Show your rank ("You finished 5th - 42m")

- [ ] Auto-dismiss after 3 seconds
- [ ] Smooth transition to next round

**Deliverable**: Round results screen

---

## Phase 5: Leaderboards & Persistence
**Goal**: Persistent top 10 and match history

### 5.1 Match Results Screen
- [ ] When match ends (time = 0:00):
  - Stop gameplay
  - Submit final scores to database

- [ ] Create match results page/overlay:
  - Final rankings (all players sorted by total distance)
  - Show stats for each player:
    - Total distance
    - Best round distance
    - Deaths
    - Tokens collected
  - Highlight winner (1st place)
  - Highlight local player rank

- [ ] Add buttons:
  - "Play Again" (returns to lobby, same players)
  - "Back to Home"

**Deliverable**: Match results screen

### 5.2 Score Submission & Validation
- [ ] Create API route: `/api/match/submit`
- [ ] Submit scores from client:
  - match_id
  - player_id
  - player_name
  - total_distance
  - best_round_distance
  - death_count
  - tokens_collected

- [ ] Server-side validation:
  - Check match exists and is completed
  - Sanity check distance (< max possible)
  - Sanity check token count (< distance / spacing)
  - Rate limit submissions per lobby

- [ ] Insert into `match_players` table
- [ ] Insert into `leaderboard` table (top 10 only)

**Deliverable**: Scores saved to database

### 5.3 Persistent Top 10 Leaderboard
- [ ] Create leaderboard page (`/leaderboard`)
- [ ] Query top 10 scores from `leaderboard` table:
  - ORDER BY total_distance DESC
  - LIMIT 10

- [ ] Display leaderboard UI:
  - Rank, Player Name, Score, Best Round, Date

- [ ] Update leaderboard after each match:
  - Check if player score beats lowest top 10
  - Insert new entry, remove 11th place

**Deliverable**: Global top 10 leaderboard

### 5.4 Match History (Optional MVP)
- [ ] Create match history page (`/matches`)
- [ ] List recent matches with:
  - Match date
  - Winner
  - Number of players
  - Link to match details

- [ ] Match details page:
  - Full rankings for that match
  - Stats per player

**Deliverable**: Browse past matches (optional)

---

## Phase 6: Polish & Mobile
**Goal**: Final touches, mobile support, SFX, performance

### 6.1 Mobile Controls
- [ ] Test touch input on mobile devices
- [ ] Add visual "tap zone" indicator (optional)
- [ ] Test responsive layout for lobby/results screens
- [ ] Adjust HUD layout for smaller screens
- [ ] Test portrait vs landscape modes

**Deliverable**: Playable on mobile

### 6.2 Sound Effects & Music
- [ ] Source or generate sound effects:
  - Flap (wing whoosh)
  - Death (crash, seagull squawk)
  - Token collection (ding, sparkle)
  - Round end (fanfare)
  - Match start (whistle)

- [ ] Add background music (looping, Mallorca vibe):
  - Muted by default
  - Toggle button on UI

- [ ] Implement audio manager in Phaser:
  - Load sounds on boot
  - Play sounds on events
  - Volume controls

**Deliverable**: Full audio experience

### 6.3 Performance Optimisation
- [ ] Profile frame rate with 8 players
- [ ] Optimise sprite rendering (use texture atlas)
- [ ] Optimise particle effects (limit particle count)
- [ ] Test on mid-range laptop (should hit 60 FPS)
- [ ] Test on mobile (should hit 30+ FPS)
- [ ] Reduce network bandwidth if needed (lower update rate)

**Deliverable**: Smooth performance on target devices

### 6.4 Error Handling & Reconnection
- [ ] Handle network disconnects gracefully:
  - Show "Connection lost" overlay
  - Attempt reconnection
  - Mark player as spectator if reconnection fails

- [ ] Handle Supabase errors:
  - Toast notifications for errors
  - Fallback to local play if server unreachable (optional)

- [ ] Handle edge cases:
  - Host leaves mid-match (migrate host)
  - Player joins mid-match (join as spectator)
  - Lobby expires after 24 hours (cleanup job)

**Deliverable**: Robust error handling

### 6.5 UI Polish
- [ ] Add animations:
  - Button hover effects
  - Screen transitions (fade in/out)
  - Player list animations

- [ ] Improve typography:
  - Use pixel font for game text
  - Use clean sans-serif for UI

- [ ] Add loading states:
  - Lobby loading spinner
  - Match loading screen

- [ ] Improve accessibility:
  - Keyboard navigation for UI
  - High contrast mode (optional)

**Deliverable**: Polished UI/UX

### 6.6 Final Testing & Tweaks
- [ ] Playtest with 4-10 colleagues
- [ ] Gather feedback on difficulty curve
- [ ] Adjust obstacle gaps, speeds based on feedback
- [ ] Test edge cases:
  - 1 player in match (should still work)
  - 10 players in match (performance test)
  - Very long rounds (someone survives 2+ minutes)

- [ ] Fix any bugs discovered

**Deliverable**: Stable, fun, playable game

---

## Phase 7: Deployment & Launch
**Goal**: Ship it to colleagues

### 7.1 Deployment Setup
- [ ] Configure Vercel project
- [ ] Link GitHub repository (if using git)
- [ ] Set environment variables in Vercel:
  - Supabase URL
  - Supabase anon key

- [ ] Test deployment on staging
- [ ] Check SSL, domain routing

**Deliverable**: Game deployed at public URL

### 7.2 Database Migration (Production)
- [ ] Run migrations on production Supabase instance
- [ ] Verify RLS policies work correctly
- [ ] Seed test data (optional)

**Deliverable**: Production database ready

### 7.3 Launch Preparation
- [ ] Write brief game instructions (on home page)
- [ ] Create shareable link format (lobby invite)
- [ ] Test full flow end-to-end on production:
  - Create lobby
  - Share link with colleague
  - Play match
  - View leaderboard

**Deliverable**: Ready for colleagues to play

### 7.4 Post-Launch Monitoring
- [ ] Monitor Supabase usage (realtime connections, database queries)
- [ ] Monitor Vercel analytics (traffic, errors)
- [ ] Gather feedback from players
- [ ] Create backlog of improvements (wind gusts, power-ups, etc.)

**Deliverable**: Game is live and monitored

---

## Summary Timeline (Rough Estimates)

| Phase | Estimated Effort | Key Deliverable |
|-------|-----------------|-----------------|
| 1. Single-player prototype | 3-4 days | Playable Flappy Bird clone |
| 2. Art pass V1 | 2-3 days | Themed sprites & background |
| 3. Lobby & multiplayer sync | 3-4 days | Ghost players visible |
| 4. Match rules & rounds | 2-3 days | 5-min matches with rounds |
| 5. Leaderboards & persistence | 2-3 days | Top 10 leaderboard |
| 6. Polish & mobile | 2-3 days | Fully polished game |
| 7. Deployment & launch | 1 day | Live on Vercel |
| **Total** | **~15-21 days** | **Shippable MVP** |

(Note: These are rough estimates for planning purposes. Actual timeline depends on scope changes, testing, and unforeseen blockers.)

---

## Open Questions to Resolve During Implementation

1. **Obstacle seed synchronisation**: Should seed be `${match_id}-${round_number}` or include timestamp?
2. **Host migration**: If host leaves, who becomes new host? First joiner? Random?
3. **Mobile orientation**: Force landscape for gameplay, allow portrait for lobby?
4. **Token bonus points**: Flat +10 per token, or scale with difficulty?
5. **Spectator camera**: Always follow leader, or allow free-cam toggle?
6. **Lobby expiration**: Delete lobbies after 24 hours? 7 days?
7. **Asset licensing**: CC0 only, or okay to use paid packs for internal use?
8. **Death animation**: Quick fade-out, or elaborate "bonk + spin" animation?
9. **Round start countdown**: Instant start, or 3-2-1 countdown?
10. **Match start requirements**: Require all players ready, or allow host to force-start?

(These can be decided pragmatically during implementation based on what feels best.)
