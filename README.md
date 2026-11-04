# Squeek Life — From Rags to Riches

A pixel rags-to-riches life sim that runs in the browser: scavenge trash in the slums, take
jobs in the office district, upgrade your look, and talk your way past the golden gate into
the rich district. Real Squeekchain data drives the WHEELY9000 station and the onchain panel.

## Controls

| Key | Action |
| --- | --- |
| `WASD` / arrows | Move |
| `E` | Interact · **hold** next to a trash pile to scavenge |
| `Space` | Stop the work timing bar (center = ×1.5 pay) |
| `Esc` | Close dialogs |
| Touch | On-screen d-pad + E button (hold to scavenge) |

## How the run works

1. **The slums** — hold `E` at trash piles for Coins and a bit of XP-like progress.
2. **Office district** — buy gear at the shops, then work the ladder: office clerk → corporate
   manager → business deals → startup founder. Better gear = better pay per shift.
3. **The golden gate** — suit + sports car + 4,000 Coins opens the rich district and the win.
4. Look changes with everything you own (6 appearance stages), and Coins are in-game points,
   never SQK tokens.

## Stack

- `frontend/` — Vite + React + Tailwind, canvas game engine, procedural pixel art, WebAudio
  chiptune soundtrack (4 district themes + SFX). No image or audio assets.
- `backend/` — Express on the Surf SDK: progress/achievements in Postgres, leaderboard, and a
  cached proxy to the public Squeekchain API.

Deployment notes: see [DEPLOY.md](./DEPLOY.md).
