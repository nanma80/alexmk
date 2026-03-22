# Agent Instructions

This repo contains Alex's game projects, hosted via GitHub Pages.

## URL Mapping

- Repo root → `https://www.nan.ma/alexmk/`
- Each game subdirectory → `https://www.nan.ma/alexmk/<game-name>/`

## How to Add a New Game

1. Create a new directory at the repo root with a kebab-case name (e.g., `space-invaders/`)
2. The directory MUST contain an `index.html` as the entry point
3. Put all game assets (CSS, JS, images) inside the game directory — keep it self-contained
4. Update the root `index.html` to add a link to the new game in the game list
5. Commit and push to `main`. GitHub Pages will deploy automatically within a few minutes.

## Directory Structure

```
alexmk/
├── CLAUDE.md              ← You are here (agent instructions)
├── README.md
├── index.html             ← Landing page listing all games
├── cool-game/
│   ├── index.html         ← Game entry point
│   ├── style.css
│   └── script.js
└── another-game/
    ├── index.html
    ├── style.css
    └── script.js
```

## Rules

- **Static files only** — no build steps, no bundlers, no server-side code. GitHub Pages serves files as-is.
- **Self-contained games** — each game directory should include everything it needs. Do not share files between games.
- **Always update root index.html** — when adding or removing a game, update the game list on the landing page.
- **Use relative paths** — inside a game directory, reference assets with relative paths (e.g., `./style.css`, not `/bradymk/cool-game/style.css`).
- **Test locally** — you can open `index.html` directly in a browser to test before pushing.
