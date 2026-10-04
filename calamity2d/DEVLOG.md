# Calamity 2D - Development Log

## Project Summary

**Calamity 2D** is a browser-based top-down musou (Warriors-style) hack-and-slash game inspired by Hyrule Warriors: Age of Calamity. The player controls a Link-like hero with sword attacks, combos, and a spin special to fight through hordes of enemies. Built as a self-contained HTML5 Canvas game playable in any modern browser.

- **Creator:** Alexandra
- **Repo:** `github.com/nanma80/alexmk` — `calamity2d/`
- **Format:** Multi-file HTML5 Canvas game (index.html + style.css + game.js)
- **Genre:** Top-down musou / hack-and-slash

---

## Current State (v0.5)

### Core Mechanics
- **Movement:** WASD / Arrow keys, 8-directional, smooth movement
- **Aiming:** Mouse cursor determines facing direction (crosshair cursor)
- **Sword Attack:** Left click swings sword in facing direction with arc hitbox
- **3-Hit Combo:** Clicking rapidly chains 3 attacks with increasing arc and damage
  - Hit 1: 120° arc, 48px range, 20 damage
  - Hit 2: 150° arc, 52px range, 25 damage
  - Hit 3: 180° arc, 60px range, 35 damage
  - Combo window: 28 frames between hits
- **Mini Spin (J key):** 360° area damage (20 damage, 70px range), no cooldown — can be spammed freely
- **Ultra Spin (Space key):** 360° area damage (120 damage, 90px range), 3-second cooldown — gold/orange visual effect
- **Knockback:** Enemies are pushed away on hit
- **Hit Stop:** Brief 2-3 frame pause on impact for satisfying combat feel
- **Screen Shake:** Camera shakes on heavy hits, intensity scales with hit type

### Tutorial System (Level 1)
- **Step-by-step guided tutorial** teaches all mechanics before combat:
  1. **Move** — Walk north using WASD to reach a ground marker
  2. **Attack** — 3 training dummies, learn basic sword swing
  3. **Combo** — 3 more dummies, learn 3-hit combo chain
  4. **Special** — 5 clustered dummies, learn J-key mini spin (tutorial also mentions Space ultra)
  5. **Horde 1** — 8 weak enemies behind a gate, first real combat
  6. **Horde 2** — 12 slightly tougher enemies, second gate
  7. **Goal** — Reach the golden goal marker to complete the level
- **Ground markers:** Glowing circles and directional arrows painted on the map guide the player
- **Persistent tutorial prompt:** Top-center HUD box shows current instruction with key highlights
- **Waypoint arrow:** On-screen arrow always points toward the next objective
- **Training dummies:** Stationary enemies that don't fight back, for safe practice

### Level Select Screen
- Game starts with title screen, then shows level selection
- Dynamically built grid of level buttons with name and subtitle
- **Level unlock progression** — only the Tutorial is available initially; completing a level unlocks the next
- Locked levels display a lock icon (🔒) and "Complete previous level to unlock" text
- **Persistent progress** — unlock state saved to `localStorage` (`calamity2d-progress` key), survives tab close/reload
- **Reset Progress button** — small button at bottom of level select screen clears all unlock data (for testing)
- After completing a level: "Next Level" + "Level Select" buttons
- After game over: "Retry" + "Level Select" buttons

### Level 2: The Dark March
- **Three horde encounters** with increasing size and difficulty:
  - Horde 1: 12 enemies (8 soldiers, 4 scouts)
  - Horde 2: 16 enemies (8 soldiers, 5 scouts, 3 knights)
  - Horde 3: 20 enemies (8 soldiers, 6 scouts, 6 knights)
- **3 gates** blocking progression between hordes
- **150 player HP** (vs 120 in tutorial) to handle more enemies
- **Zone-triggered hordes** — entering a battle zone activates that wave
- **Horde progress counter** in HUD shows cleared/total hordes
- More rocks and obstacles in battle zones for tactical cover
- No tutorial prompts — just combat objectives and banners

### Level 3: The Flooded Ruins
- **Three horde encounters** with similar difficulty to Level 2:
  - Horde 1: 13 enemies (8 soldiers, 5 scouts)
  - Horde 2: 16 enemies (7 soldiers, 5 scouts, 4 knights)
  - Horde 3: 20 enemies (8 soldiers, 6 scouts, 6 knights)
- **New terrain: water pools** — large impassable circular obstacles in battle zones
  - 12 water pools total across all 3 battle zones (3 + 4 + 5, increasing density)
  - Dark blue rendered pools with layered shading and subtle glow outline
  - Block both player and enemy movement (uses existing obstacle collision)
  - Force tactical positioning — players must navigate around pools during combat
  - Enemies also path around pools, creating chokepoints and safe zones
- Fewer trees/rocks than Level 2 to compensate for water pool clutter
- **150 player HP**, same as Level 2

### Enemy Types
| Type | HP | Speed | Damage | Notes |
|------|----|-------|--------|-------|
| Dummy | 20 | 0 | 0 | Training target, no AI |
| Basic | 25 | 0.8 | 5 | Tutorial: slow, weak, long cooldown |
| Fast | 20 | 1.0 | 4 | Tutorial: slightly faster, fragile |
| Tough | 50 | 0.7 | 8 | Tutorial: tanky, slow |
| Soldier | 30 | 1.0 | 10 | Levels 2–3: standard combat grunt |
| Scout | 20 | 1.5 | 6 | Levels 2–3: fast, aggressive |
| Knight | 55 | 0.7 | 15 | Levels 2–3: heavy tank, big radius |

### Player Stats
- **HP:** 120 (Tutorial) / 150 (The Dark March, The Flooded Ruins) — configured per level
- **Speed:** 3.5 px/frame (reduced to 40% during attacks)
- **I-Frames:** 50 frames after taking damage
- **Ultra Spin Cooldown:** 180 frames (3 seconds)
- **Mini Spin Cooldown:** None

### Map
- **Size:** 1920 × 2880 pixels
- **Structure:** Vertical progression from south (start) to north (goal)
- **Terrain:** Grass tiles with variation, central dirt path
- **Obstacles:** Trees along edges, rocks scattered in battle zones, water pools (Level 3)
- **Gates:** Wooden barriers between zones, open with fade-up animation when zone is cleared
- **Goal:** Golden Triforce-like marker with glow and sparkle effects when active

### HUD
- Health bar (top left)
- Ultra spin cooldown bar ("ULTRA READY" / "Ultra charging...")
- KO counter (top right)
- Hit combo counter (center, appears on multi-hits)
- Tutorial instruction prompt with step-progress dots (top center, Level 1 only)
- Horde progress counter ("Hordes Cleared: X / Y", Level 2+ only)
- Waypoint arrow (points to next objective)
- Minimap (bottom right) showing player, enemies, gates, goal
- Banner text for announcements (zone transitions, horde alerts)
- Objective text (bottom center)

### Audio
- **Procedural sound effects** using Web Audio API (no external files needed):
  - Sword slash: white noise burst
  - Hit impact: square wave, descending frequency
  - Enemy kill: sawtooth wave, descending
  - Spin attack (mini + ultra): sine wave sweep
  - Player hurt: square wave, descending
  - Gate open: triangle wave, ascending
  - Victory: ascending 4-note melody (C5-E5-G5-C6)

### Visual Design
- Dark green background (`#1a3a1a`)
- Canvas-drawn characters (no sprite sheets):
  - **Player:** Green tunic, blonde hair, cap, belt with gold buckle, brown boots
  - **Enemies:** Dark-colored bodies with red eyes, helmets, weapons
- Particle effects on hits (gold sparks), kills (enemy color + gold burst)
- Floating "+KO" text on kills
- Attack slash trails and sword rendering during swings
- Depth-sorted rendering (entities sorted by Y position)
- Responsive canvas scaling to fill browser window

### Architecture
- **index.html:** Canvas element, overlay screens (title, level select with reset button, victory with Next/Select buttons, game over with Retry/Select buttons)
- **style.css:** Fullscreen canvas layout, overlay styling, level select grid (with locked state), button styles, reset button, pulse animations
- **game.js:** All game logic (~760 lines), organized as:
  - Configuration constants
  - Progress persistence (`localStorage` save/load/reset)
  - Level definitions (`LEVELS` array with per-level zones, HP, horde configs)
  - Tutorial step definitions (`TUTORIAL_STEPS`)
  - Utility functions (distance, angle, lerp, clamp, random)
  - Procedural audio system (Web Audio API)
  - Input manager (keyboard + mouse)
  - Camera class (follow, screen shake)
  - Particle system and floating text
  - Per-level obstacle generation
  - Gate class (collision, open animation)
  - Player class (movement, combat, combos, mini spin, ultra spin, rendering)
  - Enemy types table (`ENEMY_TYPES` lookup) and Enemy class (AI, combat, rendering)
  - Map renderer (tile-based grass, path, zone indicators)
  - Ground markers and goal point rendering
  - HUD (level-aware: tutorial prompt or horde counter)
  - Game class (level select, `startLevel()`, tutorial flow, horde-trigger flow, victory/gameover)

### Controls
| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move |
| Mouse | Aim direction |
| Left Click | Sword attack (chain for combos) |
| J | Mini spin attack (360°, no cooldown) |
| Space | Ultra spin attack (360°, powerful, 3s cooldown) |

---

## Development History

### Iteration 1: Initial Build (v0.1)
- Created top-down canvas game with scrolling map (1920×2880)
- Player character with Link-like appearance (green tunic, blonde hair)
- 8-directional movement with WASD, mouse aiming
- 3-hit combo system with increasing arc/damage/range
- Spin attack special with cooldown
- 3 enemy types: basic, fast, tough
- Two enemy hordes (15 + 20 enemies) with gate barriers
- Procedural audio using Web Audio API
- Particle effects, screen shake, hit stop
- HUD with health, special meter, KO counter, minimap
- Victory/game over screens with replay

### Iteration 2: Tutorial Redesign (v0.2)
- **Problem:** Level 1 threw players straight into combat with 15+ enemies, no explanation of controls
- **Redesign:** Converted Level 1 into a step-by-step tutorial:
  - Added tutorial state machine with 7 progressive steps
  - Created "dummy" enemy type (stationary, non-hostile) for safe practice
  - Added ground markers (glowing circles + arrows) to guide movement
  - Added persistent tutorial prompt bar with key highlights
  - Added waypoint arrow always pointing to next objective
  - Reduced horde sizes (8 + 12) and enemy difficulty for tutorial
  - Tutorial enemies: lower HP (25), lower damage (5), slower speed (0.8), longer attack cooldowns
  - Each step teaches one mechanic before introducing the next
- Added DEVLOG.md
- Added game link to root landing page

### Iteration 3: Level Select & Level 2 (v0.3)
- Added level select screen as the first interface after the title
- Refactored Game class with `startLevel(idx)` for multi-level support
- Level definitions stored as config objects in `LEVELS` array
- Enemy types defined in `ENEMY_TYPES` lookup table for cleaner construction
- Added Level 2 "The Dark March" with 3 hordes (12 + 16 + 20 enemies)
- New enemy types for Level 2: soldier (standard), scout (fast), knight (tank)
- Zone-trigger horde activation for combat levels (vs tutorial step machine)
- Per-level obstacle layouts — Level 2 has more rocks for tactical cover
- Per-level player HP (120 tutorial, 150 Level 2)
- Victory screen shows "Next Level" button (hidden on last level)
- Game over screen shows "Retry" and "Level Select" buttons
- Horde progress counter in HUD for combat levels

### Iteration 4: Level Locking, Progress Persistence & Level 3 (v0.4)
- **Level unlock progression:**
  - Only Tutorial is available on first play; all other levels show as locked
  - Locked levels display a 🔒 lock icon and grayed-out styling, cannot be clicked
  - Completing a level unlocks the next one in the sequence
- **Persistent progress via `localStorage`:**
  - Unlock state stored under key `calamity2d-progress` (highest unlocked level index)
  - Progress survives page reload, tab close, and browser restart
  - Helper functions: `getMaxUnlocked()`, `unlockUpTo(idx)`, `resetProgress()`
- **Reset Progress button:**
  - Small button at bottom of level select screen, subtle gray styling
  - Turns red on hover; clicking clears localStorage and rebuilds the level grid
  - Intended for testing — allows returning to the initial locked state
- **Level 3 "The Flooded Ruins":**
  - New terrain element: **water pools** — large impassable circular obstacles
  - 12 water pools placed across 3 battle zones (3 + 4 + 5, density increases northward)
  - Rendered as dark blue pools with layered shading and subtle glow outline
  - Both player and enemies collide with water pools (reuses existing obstacle collision)
  - Creates tactical chokepoints, safe zones, and forced movement during combat
  - 3 hordes with similar difficulty to Level 2 (13 + 16 + 20 enemies)
  - Fewer trees/rocks to compensate for water pool obstacle density

### Iteration 5: Kid-Friendly Combat Rework (v0.5)
- **Motivation:** Make the game accessible for a 5-year-old player (Alexandra)
- **Split spin attack into two abilities:**
  - **Mini Spin (J key):** 20 damage, 70px range, 18-frame duration, no cooldown — spammable for young players
  - **Ultra Spin (Space key):** 120 damage, 90px range, 30-frame duration, 3-second cooldown — powerful "ultimate" move
  - Mini spin uses blue ring visual (same as old spin); ultra spin uses gold/orange double-ring visual
  - Both share the same sine-sweep procedural sound
- **Reduced enemy difficulty for Levels 2–3:**
  - Soldier: HP 45→30, speed 1.3→1.0, damage 12→10, cooldown 50–90→70–120
  - Scout: HP 28→20, speed 2.0→1.5, damage 8→6, cooldown 40–70→60–100
  - Knight: HP 80→55, speed 0.9→0.7, damage 20→15, cooldown 60–100→80–130
- **HUD updates:** Cooldown bar now reads "ULTRA READY [SPACE]" / "Ultra charging..."
- **Tutorial updated:** Step 4 teaches J-key mini spin, mentions Space ultra
- **Title screen updated:** Controls info shows J and Space as separate actions
- **Bugfix:** Added `unlockUpTo(idx)` call in `startLevel()` as a safety net — if a player reaches a level through the "Next Level" button, their access is recorded even if the prior unlock write was missed

---

## Known Issues
- Combo window timing can feel inconsistent at varying framerates (uses frame counting, not delta time)
- Enemies can stack on each other despite separation logic when chasing through narrow gaps between obstacles
- Enemy type distinction is subtle (color + helmet shade + weapon size) — could add more visual variety
- No pause functionality
- Mouse aiming requires cursor to be over the canvas

## Future Ideas
- Shield / block mechanic (player-requested)
- Keyboard-only aiming (use last WASD direction for facing, enabling full keyboard play)
- Boss enemies with attack patterns
- More enemy types (ranged, shield-bearing, flying)
- Dash/dodge mechanic (invincible roll)
- Health pickups and power-ups
- Equipment or upgrades between levels
- Score/ranking system per level
- Touchscreen controls for mobile
- Background music (procedural or looped)
- Destructible environment objects
- Allied NPCs fighting alongside the player
