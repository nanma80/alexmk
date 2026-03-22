# Portal 2D - Development Log

## Project Summary

**Portal 2D** is a browser-based 2D puzzle-platformer inspired by Valve's Portal / Portal 2. The player uses a portal gun to place pairs of connected portals on walls, floors, and ceilings to solve physics-based puzzles and escape each room. Built as a single self-contained HTML file playable in any modern browser.

- **Creator:** Alexandra
- **Repo:** `github.com/nanma80/alexmk` — `portal2d/portal2d.html`
- **Format:** Single-file HTML5 Canvas game (~1050 lines)
- **Genre:** 2D side-scrolling puzzle platformer with portal mechanics

---

## Current State (v0.2)

### Core Mechanics
- **Portal Gun:** Left-click places blue portal, right-click places orange portal
- **Portal Raycasting:** Step-based ray detection (step=0.1, 500 iterations) from player to mouse cursor
- **Portal Face Detection:** Portals attach to left/right/top/bottom faces of solid tiles based on ray entry direction
- **Adjacent-Air Validation:** Portals can only be placed on surfaces facing open space (prevents placement on interior wall faces)
- **Portal-Proof Surfaces:** Dedicated tile type that blocks portal placement (rendered with diagonal stripe pattern)
- **Teleportation:** Entities touching a portal while moving toward it are teleported to the paired portal, exiting with conserved momentum

### Physics
- **Gravity:** Constant 30 units/s², terminal velocity 15
- **Jump:** Velocity of -11.5 (approximately 3 tiles high)
- **Momentum Conservation:** Fall distance equals launch distance; airborne friction is zero
- **Wall Portal Exit:** Includes slight upward arc (`vy = -exitSpeed * 0.3`) for natural-feeling launches
- **Pre-Collision Velocity:** `_preVx`/`_preVy` saved before `moveEntity()` so portal entry checks see true velocity (not zero from wall collision)
- **Ground Friction:** Player horizontal damping (`vx *= 0.7`) only applied when on ground, preserving airborne momentum for portal launches
- **Box Friction:** Always applies (`vx *= 0.9`) to keep boxes from sliding indefinitely

### Puzzle Elements
- **Buttons / Pressure Plates:** Non-solid tiles that detect player or box presence; toggle linked doors
- **Doors:** Solid when closed, passable when open; controlled by buttons
- **Pushable Boxes:** 0.7x0.7 tile entities with gravity; player pushes them by walking into them
- **Boxes Through Portals:** Boxes can enter portals (wall portals via push velocity, floor/ceiling portals via gravity)
- **Moving Platforms:** Oscillate vertically between min/max rows; carry entities standing on them

### Levels
- **Grid:** 800x600 canvas, 20x15 grid of 40px tiles
- **4 levels** with increasing difficulty, each with a verified solution:

#### Level 1: Think With Portals
- Pure portal puzzle — no boxes or buttons
- Portal-proof barrier (col 9, rows 8-14) splits the room
- **Solution:** Place portals on opposite walls to teleport across the barrier to the exit

#### Level 2: Special Delivery
- Introduces boxes and buttons
- Portal-proof wall at col 12 (full height) with a door at ground level (row 13)
- Button at col 9, wall-stop at col 10, exit at col 17
- Portal-proof ceiling on right side prevents ceiling-portal bypass
- **Solution:** Push box onto button to hold door open, jump over box, walk through door to exit

#### Level 3: Chain Reaction
- Combines portals, boxes, buttons, and moving platforms
- Wall divider at col 13 (rows 1-13), door at row 6
- Box starts on elevated shelf (row 5, cols 3-5)
- Moving platform at col 2 (oscillates rows 4-10)
- Button at col 12 (next to wall), exit at col 15 on right-side platform
- **Solution:** Ride platform up, push box off shelf, box falls to ground and lands on button, portal through wall to exit platform

#### Level 4: Portal Express
- Combines portals, boxes, buttons, and moving platforms in a new layout
- Wall divider at col 10 (rows 1-13, portal-able WALL), door at row 8
- Box starts on elevated shelf (row 9, cols 3-5)
- Moving platform at col 2 (oscillates rows 6-12)
- Button at col 9 (ground, next to wall), exit at col 15 on elevated right-side platform (row 5, cols 12-18)
- **Solution:** Ride platform up to shelf, push box right off shelf edge, box falls to ground, push box onto button opening door at row 8, shoot a portal through the open door onto the right wall, place second portal on left wall, walk through portal to launch onto exit platform

### Level Select Screen
- **Added in v0.2** — game starts with a level selection screen instead of jumping straight into Level 1
- 2x2 grid of buttons showing level number and name
- Clicking a level starts it directly
- After completing a level, overlay shows "Next Level" (or "Play Again" on last level) **and** "Level Select" button to return to menu
- Game loop pauses rendering when on the select screen

### Tile Types
| Code | Type | Description |
|------|------|-------------|
| 0 | AIR | Empty space |
| 1 | WALL | Standard wall (portal-compatible) |
| 2 | PORTALPROOF | Wall that blocks portal placement |
| 3 | GROUND | Floor tile (portal-compatible) |
| 4 | EXIT | Level exit |
| 5 | BUTTON | Pressure plate (non-solid) |
| 6 | DOOR | Opens/closes based on button state |
| 7 | CEILING | Ceiling tile (portal-compatible) |

### Controls
| Input | Action |
|-------|--------|
| Arrow Keys / WASD | Move & Jump |
| Left Click | Place blue portal |
| Right Click | Place orange portal |
| R | Reset level |

### Visual Design
- Dark theme (`#1a1a2e` background)
- Portal rendering offset 3px into air space (so portals appear on the wall surface, not inside it)
- Portal glow effects with `shadowBlur`
- Box rendered with cross pattern
- Player character with visor and portal gun
- Pressure plates rendered as thin yellow bars at tile bottom
- Portal-proof tiles have diagonal stripe overlay
- Exit tile with green border and "EXIT" text
- Level completion overlay with next-level/replay/level-select buttons

### Architecture
- **Single-file HTML** with inline CSS and JavaScript
- **Grid-based levels** built by dedicated `buildLevelNGrid()` functions
- **Level definitions** store metadata (player start, boxes, buttons, platforms, hints)
- **Level names** stored in `levelNames` array, used by select screen and UI
- **Game state:** `inGame` flag controls whether game loop updates/renders or select screen is shown
- **Entity system:** Player and boxes share `applyGravity()`, `moveEntity()`, `checkPortalEntry()`
- **Game loop:** `requestAnimationFrame` with delta-time capping at 0.05s
- **Portal cooldown:** 20 frames after teleport to prevent re-entry loops

---

## Development History

### Iteration 1: Initial Build
- Created 2D side-scrolling platformer with gravity, arrow key movement, mouse portal placement
- 3 levels with portal-proof surfaces, buttons, boxes, moving platforms
- Portal raycasting and face detection

### Iteration 2: Portal Entry Fix
- **Bug:** Portal entry directions were inverted — code checked if player was moving AWAY from wall instead of toward it
- **Fix:** Corrected direction checks (e.g., 'left' face requires `pvx > 0.3` not `pvx < -0.5`)

### Iteration 3: Pre-Collision Velocity
- **Bug:** `moveEntity()` zeroed vx/vy on wall collision, then `checkPortalEntry()` saw zero velocity — portals never triggered
- **Fix:** Save `_preVx`/`_preVy` before `moveEntity()` for portal entry checks

### Iteration 4: Box Pushing Fix
- **Bug:** BUTTON tiles were solid in `isSolid()`, blocking player and box movement over pressure plates
- **Fix:** Removed BUTTON from solid check — buttons are now non-solid pressure plates

### Iteration 5: Portal Placement Validation
- **Bug:** Portals could be placed inside walls (on faces between two solid tiles)
- **Fix:** Added adjacent-air check — portal face must be next to a non-solid tile. Also offset portal rendering 3px into air space

### Iteration 6: Level 3 Exit Bypass
- **Bug:** Exit at (10,6) on LEFT side of wall was reachable via ceiling portals, skipping the puzzle
- **Fix:** Moved exit to (15,6) on RIGHT side of wall divider

### Iteration 7: Level 3 Wall Extension
- **Bug:** Wall at col 13 only covered rows 1-5, allowing portal rays through rows 8-13
- **Fix:** Extended wall to rows 1-13 (full height minus ground)

### Iteration 8: Level 3 Box Overshoot
- **Bug:** Button at col 9 was far from wall, box could overshoot past it
- **Fix:** Moved button to col 12 (directly next to wall at col 13)

### Iteration 9: Level 2 Redesign (Multiple Iterations)
- **Problem:** Original Level 2 could be bypassed with portals in various ways; multiple redesigns were too similar to Level 3 or required overly precise portal aiming
- **Final Design:** Ground-level-only approach with portal-proof wall at col 12, ground-level door, button far enough from door that player can't step-and-run through, portal-proof ceiling on right side to prevent ceiling bypass

### Iteration 10: Vertical Portal Entry
- Added support for floor portals (top face — fall down into) and ceiling portals (bottom face — jump up into)
- Velocity thresholds tuned to prevent false triggers from gravity ticks while standing

### Iteration 11: Momentum Conservation Fix
- **Bug:** Player launched only ~1 tile from wall portal exits due to horizontal friction applied while airborne
- **Fix:** Only apply `vx *= 0.7` friction when `player.onGround` is true. Added upward arc on wall portal exits for natural trajectory

### Iteration 12: Box Portal Entry
- Added `box.vx` assignment in `pushBoxes()` so boxes have velocity for wall portal entry
- Update `box._preVx` after push so portal entry detects push velocity
- Lowered floor/ceiling portal velocity thresholds for boxes (`pvy > 0.5` vs player's `1.5`)

### Iteration 13: Floor Portal Threshold Tuning
- **Bug:** Both player and box needed to be dropped from a full tile height to enter floor portals — just walking/pushing onto one didn't work
- **Fix:** Lowered floor portal threshold to `pvy > 0.3` for all entities — walking over a floor portal now drops you through, matching Portal game behavior

### Iteration 14: Box Size Adjustment
- **Bug:** Box at 0.9x0.9 tiles was too tight to fit through 1-tile door openings
- **Fix:** Shrunk box to 0.7x0.7 tiles for better clearance

### Iteration 15: Level 4 — Portal Express
- Added Level 4 combining all existing mechanics (portals, boxes, buttons, moving platforms) at similar difficulty to Level 3
- Two-chamber layout split by portal-able wall at col 10 with a door at row 8
- Key puzzle insight: player must shoot a portal ray *through the open door* to place a portal on the right wall, then use wall-to-wall portals to launch onto the elevated exit platform
- Updated level count from 3 to 4 across UI and completion logic

### Iteration 16: Level Select Screen
- Added level selection screen shown on startup — 2x2 grid of buttons with level number and name
- Game area hidden until a level is selected; game loop skips update/draw when not in-game
- Level completion overlay now includes "Level Select" button alongside "Next Level"/"Play Again"
- Added `inGame` state flag, `showLevelSelect()` and `startLevel()` functions
- Added `levelNames` array for display

---

## Known Issues
- Bounds clamping after portal teleport may interfere with edge-case portal placements near map borders
- Box portal entry for wall portals depends on push velocity, which can be inconsistent at low framerates
- No visual indicator for which button controls which door
- Level 4 has not been playtested yet — solution is designed but may need tuning

## Future Ideas
- More levels with increasing complexity
- Timed challenges / par times
- Companion cube (weighted box that must reach the exit)
- Laser emitters and redirectors
- Fizzler fields that destroy portals
- Sound effects and music
- Save/load progress
- Level editor
- Particle effects for portal entry/exit
- Animated portal swirl effect
