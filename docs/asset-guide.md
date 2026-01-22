# Flappy Gull — Asset Creation Guide

## Overview

This guide covers creating pixel art assets for Flappy Gull. The approach balances quality with speed: high-fidelity pixel art that looks professional but can be created quickly.

---

## Art Style Guidelines

### Visual Style
- **High-fidelity pixel art**: Clean, detailed sprites with smooth curves
- **Limited palette**: 8-12 colours per scene element for cohesion
- **Clear silhouettes**: Readable at speed, distinct shapes
- **Mallorca holiday theme**: Warm, sunny, beachy atmosphere

### Colour Palette (Suggested)

**Sky & Sea**:
- Sky blue: `#87CEEB` (light)
- Sea blue: `#4A90E2` (medium)
- Sea dark: `#2E5C8A` (shadow)

**Sand & Beach**:
- Sand light: `#F4E4C1`
- Sand mid: `#D4C5A9`
- Sand dark: `#B8A68A`

**Vegetation**:
- Palm green: `#6BA368`
- Palm dark: `#4A7C59`
- Trunk brown: `#8B6F47`

**Villa & Props**:
- Villa white: `#F8F4E8`
- Villa shadow: `#D8D4C8`
- Terracotta: `#C86A4A`
- Parasol stripe: `#E85D4A` / `#FFF`

**Seagull**:
- White: `#FFFFFF`
- Grey: `#B0B0B0`
- Grey dark: `#707070`
- Beak/feet: `#FFB84D`
- Eye: `#2C2C2C`

### Technical Specs
- **Resolution**: Native pixel art, scale integer multiples (2×, 3×, 4×)
- **Canvas size**: Varies by asset (see below)
- **Export format**: PNG with transparency
- **Sprite sheets**: Use Phaser-compatible JSON (TexturePacker, Aseprite)

---

## Asset List & Specs

### 1. Seagull Sprite (Main Character)

**Canvas size**: 64×64px (gives padding for animations)
**Sprite size**: ~48×32px (body, excluding wing extremes)
**File**: `seagull-spritesheet.png` + `seagull-spritesheet.json`

#### Frames Required:

| Frame Name | Description | Notes |
|------------|-------------|-------|
| `idle` | Wings neutral, mid-flight | Default state |
| `flap_up` | Wings at peak of upstroke | Fast flap motion |
| `flap_mid` | Wings mid-position | Transition frame |
| `flap_down` | Wings at bottom of downstroke | Push down |
| `tilt_up` | Body angled upward (~15°) | When ascending |
| `tilt_down` | Body angled downward (~15°) | When descending |
| `death` | Dizzy/bonk expression | Eyes as X's or spirals |

#### Animation Sequences:
- **Flap loop**: `flap_up → flap_mid → flap_down → flap_mid` (repeat)
- **Flight**: Combine flap loop with tilt based on velocity
- **Death**: Static `death` frame + rotation

#### Creation Steps:
1. Draw base seagull silhouette (side view, facing right)
2. Add white body, grey wings, orange beak and feet
3. Create 3-4 wing positions (up, mid, down)
4. Duplicate and adjust body angle for tilt frames
5. Draw death frame (X eyes, ruffled feathers)
6. Export as sprite sheet with consistent frame size (64×64px per frame)

**Quick method**: Start with simple shapes, refine iteratively. Focus on readable silhouette first.

---

### 2. Obstacles (Villa/Parasol/Palm)

**Canvas size**: Varies by obstacle type
**File**: `obstacles-spritesheet.png` or separate PNGs

#### Villa Archway (Top/Bottom Pair)

**Sprite size**: 96×400px (tall enough for full screen)

| Variant | Description |
|---------|-------------|
| `villa_top` | White stucco wall with terracotta tiles at bottom edge |
| `villa_bottom` | White stucco wall with terracotta window arch at top |

**Style notes**:
- Clean white walls (`#F8F4E8`)
- Terracotta accents (`#C86A4A`)
- Subtle brick/texture lines for detail
- Shadow on one side for depth

#### Beach Parasol (Top/Bottom Pair)

**Sprite size**: 80×400px

| Variant | Description |
|---------|-------------|
| `parasol_top` | Striped umbrella canopy (bottom edge visible) |
| `parasol_bottom` | Central pole + sand base |

**Style notes**:
- Bold stripes (red/white or blue/white)
- Pole is thin but visible
- Canopy has slight curve/scallop edge

#### Palm Tree (Top/Bottom Pair)

**Sprite size**: 80×400px

| Variant | Description |
|---------|-------------|
| `palm_top` | Fronds extending downward |
| `palm_bottom` | Trunk extending upward |

**Style notes**:
- Brown trunk with horizontal bark lines
- Green fronds with distinct "finger" shapes
- Top and bottom don't connect (gap in middle)

#### Creation Steps:
1. Sketch silhouette for each obstacle type
2. Add base colours (white, terracotta, green, brown)
3. Add shading (one side darker)
4. Add details (bricks, stripes, bark texture)
5. Export as separate top/bottom sprites
6. Ensure top/bottom align correctly in Phaser

**Quantity needed**: 2-3 obstacle types, each with top/bottom variants (6 sprites total)

---

### 3. Collectible Token

**Canvas size**: 32×32px
**Sprite size**: ~24×24px
**File**: `token.png` + `token-sparkle.png` (optional particle)

#### Design Options:

| Option | Description |
|--------|-------------|
| **Holiday Voucher** | Paper ticket with star icon |
| **Booking Token** | Coin with "H" logo (Holidu?) |
| **Sun Icon** | Yellow sun with rays (simple) |

**Recommended**: Coin/token design (easiest to read at speed)

#### Animation:
- **Idle**: Gentle bob or rotate (2-4 frames)
- **Collect**: Sparkle burst particle effect

#### Creation Steps:
1. Draw circular coin shape with border
2. Add icon/text in centre ("H", star, sun)
3. Add highlight/shine on one edge
4. Create 2-3 rotation frames (optional)
5. Create sparkle sprite (4-point star, white)

---

### 4. Background Layers (Parallax)

**Canvas size**: Varies by layer (should be wider than viewport for scrolling)

#### Layer 1: Sky (Static)
**Size**: 1920×1080px (or viewport size)
**File**: `bg_sky.png`

- Solid gradient (light blue at top → slightly warmer at horizon)
- Optional: few wispy clouds
- This layer doesn't scroll (or scrolls very slowly)

#### Layer 2: Distant Hills/Sea
**Size**: 2400×300px (looping tile)
**File**: `bg_hills.png`

- Silhouette of distant hills
- Sea horizon line
- Parallax speed: 0.2× (slow scroll)

#### Layer 3: Beach/Sand
**Size**: 2400×400px
**File**: `bg_beach.png`

- Sandy beach with texture
- Optional: distant umbrellas, boats
- Parallax speed: 0.5× (medium scroll)

#### Layer 4: Foreground Props
**Size**: 2400×200px
**File**: `bg_foreground.png`

- Beach details: shells, driftwood, signs
- Parallax speed: 1.0× (same as obstacles)

#### Creation Steps:
1. Start with sky layer (simple gradient)
2. Add hills/sea layer (silhouette shapes)
3. Add beach layer (textured sand, distant props)
4. Add foreground layer (detailed small props)
5. Ensure all layers tile seamlessly (left/right edges match)

**Tiling technique**: Copy left 200px to right side, blend seams

---

### 5. Ground Strip

**Canvas size**: 256×128px (seamless loop)
**File**: `ground.png`

- Sandy texture with occasional details (pebbles, footprints)
- Seamless horizontal tile
- Collides with seagull (acts as floor)

**Alternative**: Wooden boardwalk (brown planks with gaps)

---

### 6. UI Elements

**Canvas size**: Varies
**File**: Individual PNGs or sprite sheet

#### Required UI Assets:

| Asset | Size | Description |
|-------|------|-------------|
| `panel_bg.png` | 400×200px | Semi-transparent panel for HUD |
| `button_primary.png` | 200×60px | Button background (default) |
| `button_hover.png` | 200×60px | Button background (hover) |
| `button_pressed.png` | 200×60px | Button background (pressed) |
| `icon_ready.png` | 32×32px | Checkmark icon (lobby ready) |
| `icon_host.png` | 32×32px | Crown icon (lobby host) |
| `icon_token.png` | 24×24px | Small token icon (HUD) |

#### Font Recommendation:
- **Game text**: Pixel font (e.g., "Press Start 2P", "Pixel Arial")
- **UI text**: Clean sans-serif (e.g., "Inter", "Roboto")

**Source**: Kenney UI pack has excellent free UI elements: [kenney.nl/assets/ui-pack](https://kenney.nl/assets/ui-pack)

---

## Asset Sourcing (if not creating from scratch)

### Recommended Resources

#### 1. Kenney Assets (CC0 License)
**URL**: [kenney.nl/assets](https://kenney.nl/assets)

**Relevant packs**:
- [Pixel Platformer](https://kenney.nl/assets/pixel-platformer) - Props, tiles
- [UI Pack](https://kenney.nl/assets/ui-pack) - Buttons, panels
- [Background Elements](https://kenney.nl/assets/background-elements-redux) - Parallax layers

**Pros**: Free (CC0), high quality, huge variety
**Cons**: May need recolouring to fit theme

#### 2. CraftPix
**URL**: [craftpix.net](https://craftpix.net/)

**Search terms**: "beach", "parallax", "pixel art", "obstacles"

**Pros**: Themed packs available, affordable
**Cons**: Requires licensing check for internal use

#### 3. itch.io
**URL**: [itch.io/game-assets](https://itch.io/game-assets)

**Search terms**: "pixel beach", "seagull", "holiday", "parallax"

**Pros**: Indie artists, unique styles, free + paid
**Cons**: Mixed quality, need to vet licensing

#### 4. OpenGameArt
**URL**: [opengameart.org](https://opengameart.org/)

**Pros**: Free, community-driven, good for placeholders
**Cons**: Inconsistent style, need attribution

### Sourcing Strategy (Fast Approach)

1. **Seagull**: Create custom (unique to game, 2-3 hours work)
2. **Background layers**: Source from Kenney or itch.io, recolour
3. **Obstacles**: Kitbash from tileset packs, add Mallorca touches
4. **UI elements**: Use Kenney UI pack directly (CC0)
5. **Tokens**: Create custom or use gem/coin sprites

**Estimated time**: ~1 day to source, adapt, and integrate all assets

---

## Animation Reference

### Seagull Flight Animation (Real Reference)

Study real seagull flight for timing:
- **Flap rate**: ~3-5 flaps per second (fast for small birds)
- **Wing arc**: Wide arc, wings nearly touch above and below body
- **Glide**: Wings extended, slight tilt for steering

For game feel:
- **Fast flap**: 3-4 frames at 10 FPS = snappy feel
- **Exaggerate**: Make wings slightly larger than realistic for readability

### Obstacle Sprites (Static)

Obstacles don't animate (to save performance), but consider:
- **Palm fronds**: Could sway gently (2-3 frames, low priority)
- **Parasols**: Could flutter slightly in wind (polish phase)
- **Villa**: Static (architectural)

---

## File Organisation

Recommended folder structure:

```
src/assets/
├── sprites/
│   ├── seagull-spritesheet.png
│   ├── seagull-spritesheet.json
│   ├── obstacles/
│   │   ├── villa_top.png
│   │   ├── villa_bottom.png
│   │   ├── parasol_top.png
│   │   ├── parasol_bottom.png
│   │   ├── palm_top.png
│   │   └── palm_bottom.png
│   ├── token.png
│   └── token-sparkle.png
├── backgrounds/
│   ├── sky.png
│   ├── hills.png
│   ├── beach.png
│   ├── foreground.png
│   └── ground.png
├── ui/
│   ├── panel_bg.png
│   ├── button_primary.png
│   ├── button_hover.png
│   ├── icons/
│   │   ├── ready.png
│   │   ├── host.png
│   │   └── token.png
└── sounds/
    ├── flap.wav
    ├── death.wav
    ├── token.wav
    └── music_loop.ogg
```

---

## Asset Loading in Phaser

Example loading code in GameScene:

```typescript
preload() {
  // Sprite sheets
  this.load.atlas(
    'seagull',
    'assets/sprites/seagull-spritesheet.png',
    'assets/sprites/seagull-spritesheet.json'
  );

  // Individual images
  this.load.image('villa_top', 'assets/sprites/obstacles/villa_top.png');
  this.load.image('villa_bottom', 'assets/sprites/obstacles/villa_bottom.png');
  this.load.image('token', 'assets/sprites/token.png');

  // Backgrounds
  this.load.image('bg_sky', 'assets/backgrounds/sky.png');
  this.load.image('bg_hills', 'assets/backgrounds/hills.png');
  this.load.image('bg_beach', 'assets/backgrounds/beach.png');
  this.load.image('ground', 'assets/backgrounds/ground.png');

  // Sounds
  this.load.audio('flap', 'assets/sounds/flap.wav');
  this.load.audio('death', 'assets/sounds/death.wav');
  this.load.audio('token', 'assets/sounds/token.wav');
}
```

---

## Quick Pixel Art Tutorial (for Seagull)

If creating the seagull sprite from scratch:

### Tools Needed:
- **Aseprite** (paid, ~$20, best pixel art tool)
- **Piskel** (free web-based alternative)
- **Photoshop/GIMP** (with pixel grid + nearest-neighbour scaling)

### Steps:

1. **New canvas**: 64×64px, transparent background

2. **Block out silhouette**:
   - Use pencil tool (1px)
   - Draw oval for body (~40px wide, 24px tall)
   - Draw small beak triangle (6px)
   - Draw tail feathers (3 short lines)

3. **Add wings**:
   - Wing up: Arc above body, 20px span
   - Wing down: Arc below body, 20px span
   - Use 2-3 shades of grey for feathers

4. **Refine outline**:
   - Clean up jagged edges
   - Use anti-aliasing sparingly (1-2 intermediate shades)

5. **Add colour**:
   - White body (`#FFFFFF`)
   - Grey wings (`#B0B0B0` and `#707070`)
   - Orange beak/feet (`#FFB84D`)
   - Black eye (`#2C2C2C`, 2×2px)

6. **Create flap frames**:
   - Duplicate base frame
   - Adjust wing position (rotate slightly)
   - Repeat for 3-4 positions

7. **Export**:
   - Save as sprite sheet (horizontal strip)
   - Each frame 64×64px
   - PNG with transparency

**Estimated time**: 1-2 hours for seagull sprite sheet

---

## Sound Effects (Brief Guide)

### Sourcing Sounds

**Free sources**:
- [Freesound.org](https://freesound.org/) (CC0 and CC-BY)
- [Kenney Audio](https://kenney.nl/assets?q=audio) (CC0)
- [ZapSplat](https://www.zapsplat.com/) (free tier available)

**Search terms**:
- "bird flap", "wing whoosh" (for flap)
- "crash", "bonk", "thud" (for death)
- "coin", "ding", "sparkle" (for token)
- "fanfare", "whistle" (for match start/end)

### Required Sounds

| Sound | Description | Length | Format |
|-------|-------------|--------|--------|
| `flap.wav` | Wing whoosh, quick | <0.5s | WAV/OGG |
| `death.wav` | Crash + squawk | ~1s | WAV/OGG |
| `token.wav` | Sparkle/ding | <0.5s | WAV/OGG |
| `round_end.wav` | Short fanfare | ~2s | WAV/OGG |
| `match_start.wav` | Whistle/horn | ~1s | WAV/OGG |
| `music_loop.ogg` | Upbeat background music | 60-120s loop | OGG |

**Music note**: Keep background music optional, muted by default. Office environment = players may prefer silence.

---

## Asset Checklist (Ready for Phase 2)

- [ ] Seagull sprite sheet (7 frames: flap × 3, tilt × 2, idle, death)
- [ ] Villa obstacles (top + bottom)
- [ ] Parasol obstacles (top + bottom)
- [ ] Palm tree obstacles (top + bottom)
- [ ] Token sprite (+ sparkle particle)
- [ ] Sky background
- [ ] Hills/sea background layer
- [ ] Beach background layer
- [ ] Foreground props layer
- [ ] Ground strip tile
- [ ] UI panel background
- [ ] Button sprites (primary, hover, pressed)
- [ ] Icons (ready, host, token)
- [ ] Flap sound effect
- [ ] Death sound effect
- [ ] Token collection sound effect
- [ ] Round end fanfare
- [ ] Match start sound
- [ ] Background music (optional)

**Total estimated time** (if creating from scratch): 2-3 days
**Total estimated time** (if sourcing/adapting): 1 day

---

## Notes on Licensing (Internal Use)

For an internal office game:
- **CC0 (Public Domain)**: Totally fine, no attribution needed
- **CC-BY (Attribution)**: Fine, add credits page or README
- **Paid packs**: Check license, most allow internal use
- **No redistribution**: Since it's not a commercial product, most licenses are permissive

**Recommendation**: Stick to CC0 (Kenney) for simplicity, create custom seagull sprite.
