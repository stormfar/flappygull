PRD — Flappy Gull (Multiplayer Flappy-Bird-style, holiday-home theme)
1) Summary

Flappy Gull is a browser game for colleagues: a multiplayer, Flappy-Bird-style endless runner where players control a larger seagull flying through holiday-home themed obstacles (Mallorca beaches, villas, parasols, pool noodles… the usual). Players join via a lobby link, start together, and compete in 5-minute matches consisting of rapid “rounds” (runs). If you crash, you spectate until the round ends. Winner is based on distance across the match.

Tech constraints: Next.js starter deployed on Vercel, Phaser 3 for gameplay.

2) Goals

Fast fun: game boots quickly, instant restart loop.

Multiplayer chaos: see other players’ gulls in real-time (good enough for office bragging rights).

Match-based: clear start/end, a winner, and a match leaderboard.

Persistent Top 10: global leaderboard across matches.

3) Non-goals (for MVP)

Anti-cheat beyond basic sanity checks (this is colleagues, not esports).

Monetisation, accounts, cosmetics store (don’t give Product ideas).

Perfect netcode or rollback.

4) Target users

Internal colleagues playing during breaks.

Primary device: desktop/laptop; secondary: mobile (tap to flap).

5) Core game loop

Player opens link → enters Lobby

Picks display name + optional “team”

Host clicks Start Match

Match timer starts (5:00)

Players repeatedly attempt Rounds while time remains:

Round begins immediately for all alive players

If a player dies, they spectate until the round ends

When all players are dead OR a round timer limit is hit, a new round starts automatically if match time remains

Match ends at 0:00 → show results + persist scores → offer “Play again” (same lobby)

6) Rules & scoring (proposed — pick one and stick to it)

MVP scoring model (simple + clear):

Each round you earn Distance (e.g., metres, pipes passed, or px/units).

Match Score = sum of round distances (reward consistency).

Tiebreakers: best single-round distance, then fewest deaths.

What players see

Live HUD: your distance, best this match, match time remaining

Post-round: round ranking by distance

Post-match: match ranking by total distance + highlights (best round)

7) Multiplayer experience
Lobby

Join by URL: /lobby/<code>

Show list of players connected + ready status

Host controls:

Start match

Kick (optional MVP?)

Match settings (optional, later)

In-game

Render other gulls as “ghost competitors” in the same world scroll

Show name tags above gulls (toggleable)

Spectator mode on death:

Camera follows the current leader OR free-cam toggle (later)

Networking approach (high-level; details left to Claude)

Use a realtime channel to:

track lobby presence/state (who’s in, who’s ready)

broadcast low-latency game events (start, round reset, player state snapshots)

Persistence (leaderboards, match history) stored in DB.

(Supabase is perfectly normal here; Phaser doesn’t care what database you pick.)

8) Gameplay specs
Controls

Desktop: Space / click = flap

Mobile: tap = flap

Optional: hold to “buffer” flap disabled (keep it classic)

Physics feel (MVP targets)

Seagull is visibly larger than Flappy Bird (hitbox tuned accordingly)

Responsive flap: instant upward impulse, gravity feels snappy

Difficulty ramps gradually:

obstacle gap narrows slightly over time

obstacle speed increases slightly

optional wind gusts later

Obstacles (holiday-home Mallorca theme)

Obstacles should be readable silhouettes in pixel art:

Villa walls / archways (top/bottom)

Beach parasols (top) + sun loungers (bottom)

Palm trunks (bottom) + palm fronds (top)

Pool floats / buoys as occasional variants

Each obstacle is basically “pipes” with a new skin.

Collectibles (extra points)

“Jury tickets” (or rename to “Holiday Vouchers” / “Booking Tokens”)

Spawn in riskier lines (centre of gap or near edges)

Add Bonus Points and a satisfying sound

Optional special pickups later:

“Tailwind” (brief speed reduction)

“Lucky Feather” (one-hit shield) — probably not MVP

9) Art direction & asset plan (high-fidelity pixel art, low effort)
Style

High-fidelity pixel art with clean silhouettes and limited palette per scene

Parallax background layers: sky → distant hills → sea → beach → foreground props

Pixel-perfect scaling (crisp, not blurry)

Seagull sprite requirements (you already have the base image)

Create a sprite sheet for the gull:

Flap animation: 3–4 frames (up/mid/down + optional smear)

Bank/tilt frames: 2–3 angles (upward tilt, neutral, downward tilt)

Death frame: “bonk” / dizzy eyes

Optional: tiny wing trail particle

Quickest workflow (not artisanal)

Use a pixel editor (Aseprite is the usual pick) to:

trace/clean silhouette

create 3–4 wing positions by simple redraw

export a spritesheet PNG (+ JSON if desired)

Background & environment sourcing (suggestions)

You likely won’t find “Mallorca holiday homes pixel pack” ready-made, so do this:

Source generic pixel beach + village/villa assets

Palette unify (recolour pass) so it looks coherent

Kitbash a few signature props (villa balcony, rental sign, etc.)

Asset sources that are fast and common:

Kenney: huge library, many packs are CC0 (easy licensing for internal games).

CraftPix: lots of pixel backgrounds/objects/tilesets (free + paid).

itch.io: broad marketplace for pixel packs; good for “beach/parallax/tileset” hunting.

MVP art deliverables

1 themed background set (Mallorca beach day)

1 obstacle set (villa/parasols)

1 ground strip (sand/boardwalk) looping tile

1 collectible sprite (+ small sparkle anim)

UI bits (score panel, lobby buttons) — Kenney UI pack is a solid base

10) UX screens

Home

“Create lobby” / “Join lobby”

Lobby

Lobby code + share link

Player list + ready status

Host “Start match”

Match

Canvas game view

HUD: time left, your distance, best distance, tokens collected

Mini leaderboard (top 3)

Round end

Round ranking, “You died at X”

Match end

Final ranking + stats

Buttons: “Play again”, “Back to lobby”

Leaderboards

“This match” (ephemeral)

“Top 10 all-time” (persistent)

11) Data & leaderboard

Persistent leaderboard (Top 10)

Store: player name, score, date, match id, maybe lobby id

Basic anti-spam:

rate limit submissions per lobby

cap player name length

sanity check score ranges

Supabase is suitable for persistence + realtime features.

12) Success criteria (internal)

Match start to “playing” in under ~3 seconds on office Wi-Fi

4–10 players in a lobby without it feeling laggy

People voluntarily shout “one more round” at least once

13) Milestones (implementation order)

Single-player prototype (Phaser physics, obstacles, scoring, restart)

Art pass v1 (seagull animations, Mallorca background, villa obstacles, collectibles)

Lobby + multiplayer sync (presence, start match, show other gulls)

Match rules (5-min timer, rounds, spectating)

Leaderboards (match + top 10 persistent)

Polish (SFX, juice, mobile controls, performance)

14) Assumptions & open decisions (for Claude to resolve)

Exact scoring model (sum-of-distance vs best-run vs hybrid)

Round reset rule (all dead vs time cap vs host skip)

Network model (authoritative host vs server-authoritative vs “good enough” sync)

Asset licensing choices (CC0 vs paid packs; internal-only distribution)