# Paw Pals - Development Log

## Project Summary

**Paw Pals** is a browser-based virtual pet game inspired by Nintendogs + Cats. The player adopts a kitten, names it, and takes care of it: feeding, playing, washing, cleaning the litter box, napping, teaching tricks, and buying toys, furniture and outfits. The name was picked so dogs (and other pets) can join later.

- **Creator:** Alexandra
- **Repo:** `github.com/nanma80/alexmk` — `paw-pals/`
- **Format:** Multi-file HTML5 Canvas game (index.html + style.css + game.js), no build step
- **Genre:** Virtual pet / life sim for young kids

---

## Design Principles (from research)

What makes Nintendogs-style games work for kids, and how Paw Pals applies it:

| Principle | How Paw Pals does it |
|---|---|
| **Never punish** — no death, no game over | Stats only make the cat look sad / sleepy / dirty. Time away is capped (stats never drop below 10 while away; energy rises because the cat rests). |
| **Show feelings, don't explain them** | Face changes (happy eyes, blush, sad brows, droopy ears, sleepy lids), dirt smudges + stink lines, thought bubbles with an emoji of what it needs (🐟 💤 🛁 💩 🧶). |
| **Minimal reading** | Every button is a big emoji + one word. The button for what the kitty needs most **wiggles with a yellow glow**. |
| **Instant, juicy feedback** | Hearts, sparkles, confetti, purring, meows, coin pops on every good action. |
| **Touch/pet the pet** | Rub the cat with the mouse (or hold P) → hearts + purr. Click the cat → it meows and says hi. |
| **Long-term bond** | Affection grows slowly with care and fades only a little when the kitty is neglected or left alone. 5 heart levels (Just Met → Soulmates) unlock harder tricks; learned tricks are never lost. |
| **Collecting & decorating** | Coins buy toys, furniture and outfits. Furniture appears in the room and the cat actually uses it. |
| **Silly failures** | Failed trick lessons just make the cat tilt its head ("Huh? ❓"), so trying again is fun. |
| **Come-back hooks (gentle)** | Daily gift (+15 coins), "I missed you!" greeting, treats that refill over time. |

---

## Current State (v0.2)

### Flow
1. **Title** — "Play with <name>" (if a save exists) or "Adopt a Kitty". Enter to start.
2. **Adopt** — pick one of 5 kittens (Orange Tabby, Gray Tabby, Black Cat, Snow White, Calico) with ←/→, then name it (name chips + 🎲 random). Owner name defaults to **Alex**.
3. **Home** — the room with the cat, HUD on top, 9 action buttons below.

### Cat Stats (0–100)
- **Food 🐟**, **Clean 🫧**, **Energy ⚡**, **Fun 🧶** — shown as bars (green → yellow → pulsing red)
- **Litter** — 0–4 poops in the box (each meal makes one poop ~40–80s later; the cat walks to the box to go)
- **Happiness** — derived: average of the 4 stats (fun counts 1.5×) + litter cleanliness + up to +10 for furniture. Shown as a mood face (😻 😺 🐱 😿).
- **Affection ❤️** — 0–100. Hearts: 0 / 8 / 22 / 40 / 65 / 90 → Just Met, Buddies, Good Pals, Close Friends, Best Friends, Soulmates. Reaching a heart level for the first time gives a banner, confetti and 10×level coins (`bestHeart` tracks this so it can't be farmed).
  - **Affection can drop a little:** −1 per minute while happiness < 35, and −1 per 30 min away (after the first 30 min, at most −8). Losing a heart → "I feel a little lonely... 💔"; winning it back → "I feel loved again! 💕" (no coins).
  - Tricks already learned stay usable even if hearts drop below the requirement.

Decay while playing (points per second): food 1/30, clean 1/60, energy 1/35 (not while sleeping), fun 1/25.

### Actions (keys 1–9, or click)
| Key | Action | What happens |
|---|---|---|
| 1 | **Feed 🐟** | Cat walks to the bowl and eats for 3s (+40 food, +2 coins). If food ≥ 90 → "I'm full!" |
| 2 | **Treat 🍪** | Treat drops from above, cat jumps and catches it (+12 fun, +2 affection). 3 treats max, refill 1 every 90s. |
| 3 | **Play 🧶** | 15s mini-game: move the toy with the mouse or arrow keys/WASD, the cat chases and pounces (+6 fun each). Pick a toy if you own more than one. Feather wand can fly high so the cat jumps. |
| 4 | **Wash 🛁** | Cat sits in a bubble tub. Rub it with the mouse or tap Space to scrub → rinse → shake off → clean = 100. Esc stops early (partial clean). |
| 5 | **Litter 🧹** | Scoops all poops one by one (+1 coin each). You can also click individual poops. |
| 6 | **Nap 💤** | Cat sleeps in the bed (or rug/floor), room dims, Z's float, energy +3/s. Press again or click the cat to wake it. Auto-naps if energy < 12. |
| 7 | **Tricks ⭐** | Side panel. Each lesson is a chance to succeed (gets easier with stars & hearts). 5 successes = learned. Learned tricks can be performed for fun/affection. |
| 8 | **Shop 🛍️** | Tabs: Toys / Home / Dress Up. |
| 9 | **Dress Up 🎀** | Side panel to wear/remove owned head & neck items. |

Other controls: **P** (hold) pet, **M** mute, **Esc** close panel / stop mini-game, arrow keys + Enter navigate panels, number keys pick cards in a panel.

### Tricks
| Trick | Hearts needed | Base chance | Animation |
|---|---|---|---|
| Sit | 0 | 60% | little hop and sit |
| High Five | 0 | 50% | raised paw |
| Spin | 1 | 45% | flips around twice |
| Jump | 2 | 40% | big jump |
| Roll Over | 3 | 35% | full rotation |

Chance per lesson = base + 8% × stars + 2% × heart level. Lessons cost 3 energy.

### Shop Items
- **Toys:** Yarn Ball (free, starter), Toy Mouse 15, Bouncy Ball 15, Feather Wand 20. Owned toys lie on the floor and the cat bats them.
- **Furniture (cat uses them on its own):** Scratch Post 20, Cozy Bed 30 (nap spot), Cat Tree 45 (perches on top), Cat House 50 (hides inside — eyes peek out; click to call it out), Fish Tank 60 (watches the fish).
- **Decorations:** Soft Rug 15, Plant 15, Fish Picture 20, Curtains 20, Twinkle Lights 25.
- **Outfits:** Bell Collar 10, Heart Collar 10, Bow Tie 15 (neck); Pink Bow 10, Party Hat 15, Flower Crown 20, Royal Crown 40 (head).

### Coins 🪙
Start with 30. Earned from feeding (+2), treats (+1), play (+1 per 2 pounces, max 8), washing (+3), scooping (+1 per poop), trick lessons (+2), learning a trick (+10), heart level ups, the happy-kitty bonus (+1 every 30s while happiness ≥ 70), and the daily gift (+15).

### Cat Behaviour (when idle)
Wanders around, grooms, meows, uses owned furniture/toys, walks to the litter box after meals, walks to the "posing spot" when a side panel (tricks/dress up) is open, shows a thought bubble about its most urgent need every ~8s, and naps by itself when exhausted.

### Room
Wall with polka dots, a window showing **day (sun + clouds) or night (moon + stars) based on the real clock**, wooden floor, food & water bowls, litter box. Purchased items appear at fixed spots. Objects are depth-sorted by y so the cat walks in front of/behind things correctly.

### Saving
`localStorage` key `paw-pals-save`, saved every 5s, on purchase, and when the tab is hidden/closed. Time away (capped at 8 hours) lowers food/fun (−0.5/min) and clean (−0.2/min), never below 10; raises energy; lowers affection a little; adds up to 3 poops and refills treats. If a heart was lost while away the kitty greets you with "I was lonely 💔 Pet me?". Settings (⚙️) can rename the cat/owner or adopt a different kitty.

### Audio
All sounds are synthesized with the Web Audio API: meow (sawtooth + sweeping bandpass), purr (low saw with 24 Hz tremolo), coin, sparkle, nom, boing, splash, scrub, pour, nope, ta-da.

---

## Technical Notes

- Canvas is 960×540 (16:9), scaled by CSS to fit; HUD, action bar, panels and screens are HTML on top.
- The cat is drawn entirely with canvas shapes (`drawCat` in game.js) — front-facing chibi style with poses: sit, walk, eat, sleep, scratch, pounce, highfive, groom; plus lift/rotation/squish for tricks. Wearables are drawn relative to the head.
- `activity` = what the cat is busy with (eat / treat / play / wash / scoop / sleep / trick). While an activity runs, other actions wiggle "no" (except sleep, which any action wakes from).
- `cat.using` = idle furniture behaviour (tree, house, scratcher, tank, bed, toy, groom, potty).
- Panels: one generic `#panel` element, `.side` variant for tricks / dress up / toy picker so the cat stays visible.

---

## Ideas for Next Versions
- 🐶 **Dogs** — adopt a puppy; needs **walks outside** (new outdoor scene) or it gets unhappy and dirty
- More pets at once (multiple cats), switching between them
- Brushing mini-game (fur sparkle), nail trimming
- More rooms / wallpaper & floor colors in the shop
- Cat grows from kitten to cat over days
- Photo mode (save a picture of your cat)
- Cat contests (like Nintendogs competitions) to earn more coins
- Voice/name recognition-lite: cat comes when you click its name

---

## Changelog

### v0.2 — A bit more consequence
- Time-away stat floor lowered from 25 to 10
- Affection can now decrease (neglect while playing, time away); lost hearts can be won back
- Level-up coins only for first-time heart levels; learned tricks never relock

### v0.1 — First playable
- Title, adopt (5 kittens, naming), home room
- 4 stats + litter + happiness + affection hearts
- 9 actions incl. play, wash and trick mini-games
- Shop with 21 items, dress up, furniture the cat uses
- Coins economy, daily gift, save/load with gentle time-away rules
- Synthesized sounds, keyboard + mouse controls
