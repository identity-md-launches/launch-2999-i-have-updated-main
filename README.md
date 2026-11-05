# Squeek Life — From Rags to Riches

A pixel rags-to-riches life sim that runs entirely in the browser. Squeek wakes up in the
slums with torn rags and zero Coins, scavenges the bins for a living, works his way up the
office ladder, and — if he dresses the part and makes a name for himself — walks through the
golden gate into the rich district.

**Play:** https://finish-product-322f7d.surf.computer/

Every pixel of art and every note of music is generated in code: the canvas engine draws the
whole city with `fillRect`, and the soundtrack is WebAudio chiptune. There are no image or
audio files in this repository.

---

## The city

Three districts, one road, and a city that keeps its own clock.

- **The slums** — food carts with real staff (a cook flipping a pan, waiters carrying trays,
  diners eating at pavement tables, customers carrying takeaway into the buildings), a
  laundry, shacks, scooters, and a rival scavenger who raids piles before you get there.
- **The office district** — towers, a mall, a salon, a garage, a bank, a park with gym
  machines and joggers behind the towers, and the job ladder: trash → delivery → clerk →
  manager → business → startup.
- **The rich district** — villas, a golf course, a hotel and restaurant, a statue, supercars —
  behind the golden gate.

### Living city systems

| System | What it does |
| --- | --- |
| **Day & night** | An 8-minute day. Morning opens the shops, midday fills the market, evening lights the lamps, night empties the streets and shuts the shutters. Sleep at home to skip to 07:00. |
| **Daily events** | A 10-day calendar: Market Day (bins pay 1.6×), Rain (umbrellas, empty streets), Street Festival (dancers), Blackout (lanterns only), Parade (the rich district marches, gate open). |
| **People who remember you** | Chat 3 / 6 / 10 times and a neighbour becomes an acquaintance, a friend, a close friend — they greet you by name, tip you Coins and pass on gossip. |
| **Reputation** | Dress, work and friendships add up: Nobody → Local face → Well known → Big cheese → City legend. Well known means shop discounts and a guard who waves you through after dark. |
| **Shift work** | Take the counter at any food cart: customers queue, order and pay. Serve 8 orders in 95 seconds for a bonus. |
| **Getting across town** | A bus that loops the road and pulls into three stops, and a taxi rank with three destinations. |
| **Your flat** | Buy furniture with Coins — rug, plant, lamp, shelf, TV, comfy bed, and a pet rat called Crumb who follows you and sniffs out loose change. Everything you own is drawn inside the flat. |
| **Rules of the road** | Traffic lights, crosswalks and a police officer who fines motor vehicles on the pavement (cyclists are left alone). |
| **Rides** | Bicycle, motorbike and sports car, parked wherever you leave them and saved between sessions. |

### Squeekchain

The **WHEELY9000** station and the onchain panel read live data from the public Squeekchain
API (`https://api.squeekchain.com/v1/...`) through the backend proxy — no mock data anywhere.
When the API is unreachable the UI says so instead of inventing numbers. Coins are in-game
points, never SQK tokens; connecting a wallet only links an address to your run (read-only,
the game never signs or spends anything).

---

## Controls

| Key | Action |
| --- | --- |
| `WASD` / arrows | Move |
| `E` | Interact — talk, shop, sit, work a shift, board the bus, **hold** at a pile to scavenge |
| `F` | Get on / get off your ride |
| `Space` | Stop the work timing bar (centre = ×1.5 pay) |
| `Esc` | Close dialogs and panels |
| Touch | On-screen d-pad plus `E` and `F` buttons |

The current interaction is always shown in the bar along the bottom edge of the screen, with
a colour-coded key badge, so nothing is ever drawn over the character.

---

## Run it locally

Requires **Bun** (or Node 20+ with npm) and, for the backend, a Surf API key.

```bash
# 1. Backend — progress, leaderboard, Squeekchain proxy
cd backend
bun install
cp .env.example .env          # then put your SURF_API_KEY in it
bun run dev                   # → http://localhost:3001

# 2. Frontend — the game
cd ../frontend
bun install
PORT=5173 BACKEND_PORT=3001 BASE_PATH=/ bun run dev   # → http://localhost:5173
```

The game itself runs without the backend: saving, the leaderboard and the onchain panel
degrade to honest offline states, and everything else plays normally.

---

## Project structure

```
frontend/                     Vite + React + Tailwind 4
  src/game/engine.ts          game loop, world state, all city systems
  src/game/world.ts           map, buildings, objects, NPCs, routes
  src/game/sprites.ts         every sprite, drawn procedurally
  src/game/data.ts            economy, jobs, gear, clock, events, furniture
  src/game/music.ts           WebAudio chiptune (4 district themes + SFX)
  src/components/game/        HUD, panels, modals, start/win screens
  src/lib/                    api helper, progress, wallet, share, branding
backend/                      Express + Surf SDK
  routes/progress.js          GET/POST player progress and achievements
  routes/leaderboard.js       top runs
  routes/squeekchain.js       cached proxy to the public Squeekchain API
  db/schema.js                Drizzle table definitions (players, achievements)
```

---

## Deploying

The frontend is a static build. The backend needs a host that keeps a process alive and
provides Postgres (it talks to the Surf platform), so it does not run on a static-only host.

### Frontend on any static host (Vercel, Netlify, imd.fun, …)

Build settings — **from the repository root** (the root `package.json` builds the frontend and
copies the result into `dist/`):

| Setting | Value |
| --- | --- |
| Root directory | `.` (repository root) |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | none needed |

*Alternative, if the host lets you pick a subdirectory: Root `frontend`, build `npm run build:client`,
output `dist/client`, environment `BASE_PATH=/`.*


The `/api/*` rewrite in both files points at a placeholder backend host — change it to your
own backend URL, or delete the rewrite to run the game standalone (the onchain panel and
leaderboard then show offline states).

**Deploying through imd.fun (The Buildoooooor)?** See [`IMD-DEPLOY.md`](./IMD-DEPLOY.md) for
the step-by-step flow, the ready-to-paste brief, and the cost note (0.5 IMD per request).

### Backend

`backend/` needs `BACKEND_PORT` and `SURF_API_KEY`. See [DEPLOY.md](./DEPLOY.md) for three
options: deploy the whole thing on the Surf platform (simplest, backend included), host the
backend on a long-running Node host and point the rewrite at it, or drop the backend and run
the frontend standalone.

---

## Pushing this folder to GitHub

```bash
./push-to-github.sh https://github.com/<your-user>/<your-repo>.git
```

Create the repository on GitHub first (empty — no README, no .gitignore). Step-by-step
instructions in Vietnamese: [GITHUB.md](./GITHUB.md).

---

## License

No licence file is included — add one (MIT is a common choice) before publishing if you want
others to reuse the code.
