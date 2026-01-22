# Multiplayer Setup Guide

## Phase 2 - Multiplayer Implementation

### ✅ Completed So Far:

1. **Supabase Client Installation** - `@supabase/supabase-js` installed
2. **Database Schema** - SQL migration ready in `/supabase/001_initial_schema.sql`
3. **Seeded RNG** - Deterministic obstacle generation for fair gameplay
4. **Supabase Client Config** - Real-time optimised for fast ghost updates

---

## 🚀 Setup Steps

### 1. Run the SQL Migration

Go to your Supabase project dashboard:
1. Navigate to **SQL Editor**
2. Open `/supabase/001_initial_schema.sql`
3. Copy and paste the entire contents
4. Click **Run** to execute the migration

This creates:
- `matches` table (stores match metadata and seed)
- `match_players` table (players in each match)
- Helper functions for creating matches
- Row Level Security policies

### 2. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Find these in: Supabase Dashboard → Settings → API

### 3. Architecture Overview

**How Multiplayer Works:**

- **Deterministic Obstacles (Option B)**:
  - All players get the same RNG seed from the database
  - Obstacles are generated identically on all clients
  - Fair gameplay - everyone sees the same course

- **Real-time Position Updates**:
  - Uses Supabase Realtime **Broadcast** (not database)
  - ~20 events/second for smooth ghost seagulls
  - Sub-100ms latency for snappy updates

- **Data Flow**:
  ```
  Player → Create Match → Database (generates seed + code)
  Others → Join via Code → Get same seed
  Match Starts → All generate identical obstacles
  During Match → Broadcast positions (Realtime Channel)
  Match Ends → Save final scores to database
  ```

---

## 📋 Next Steps

1. **Lobby/Matchmaking UI** - Create/join match screens
2. **Real-time Position Broadcasting** - Broadcast player positions during match
3. **Ghost Seagulls** - Render other players' seagulls

---

## 🎮 How It Will Work

1. **Player enters name** → "Join Game" or "Create Match"
2. **Create Match**:
   - Generates 6-character code (e.g., "A3X7K9")
   - Creates seed for obstacles
   - Shows waiting lobby
3. **Join Match**:
   - Enter match code
   - Join lobby
   - Wait for host to start
4. **Match Starts**:
   - All clients load same seed
   - Generate identical obstacles
   - 60-second timer begins
5. **During Match**:
   - Each player controls their seagull
   - Positions broadcast 20x/second
   - Ghost seagulls show other players
   - Leaderboard updates in real-time
6. **Match Ends**:
   - Final scores saved
   - Show results with all players
   - Option to play again

---

## 🔧 Technical Details

**Database Tables:**
- `matches` - Match metadata, status, seed
- `match_players` - Player scores and stats

**Realtime Channels:**
- `match:{match_id}` - Position broadcasts
- Uses Presence API for player status

**Seeded RNG:**
- Mulberry32 algorithm (fast, deterministic)
- Same seed = same obstacle sequence
- Replaces Phaser.Math.Between with seededRandom.between()
