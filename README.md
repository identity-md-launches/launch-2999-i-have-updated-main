# Squeek Life — From Rags to Riches

A pixel rags-to-riches life sim that runs entirely in the browser. Squeek wakes up in the
slums with torn rags and zero Coins, scavenges the bins for a living, works his way up the
office ladder, and — if he dresses the part and makes a name for himself — walks through the
golden gate into the rich district.

**Previously recorded hosted version:** https://finish-product-322f7d.surf.computer/

This delivery contains the production static export in [`dist/`](./dist/), ready for the
contributor network publisher. The address above predates this delivery; no new public
deployment URL has been issued in this worker session.

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

## Install, build and preview

Requires **Node 20+ and npm**. The static game needs no environment variables, credentials,
backend, wallet or server-side rendering.

Run these commands from the repository root:

```bash
# Install the existing frontend dependencies.
npm --prefix frontend install --no-audit --no-fund

# Production build; installs dependencies again if needed, then copies the client export.
npm run build

# TypeScript check.
npm run type-check

# Serve the exact finished export, with no backend or SPA fallback.
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173/`. Rebuild after source changes with `npm run build`, then reload
the preview. The build produces `frontend/dist/client/` and copies its complete contents to
root `dist/`, including **`dist/index.html`**, JavaScript, CSS, local game fonts, favicon,
font licenses and the social preview image. Serve over HTTP(S); opening HTML with `file://`
does not support its ES modules correctly.

For development, `npm --prefix frontend run dev` starts Vite. The optional API requires its
own setup; see `DEPLOY.md`. The tested static deployment leaves it offline.

`frontend/bun.lock` and `backend/bun.lock` are the existing tracked lockfiles and remain
unchanged, as do both package manifests. The npm build uses the manifest's versions/ranges;
it does not consume the Bun lockfile. No new runtime dependencies were added.

### Offline behavior

The city, controls, intro, quests, home panel and soundtrack run without the API. Name,
player identifier and mute preference are stored locally. **Run state is saved to the
optional backend, not to local storage:** without it, progress does not survive Menu or
reload and Continue is unavailable. Keep the tab open to keep playing.

The Squeekchain panel shows its existing error and retry control when the API is unavailable.
The existing leaderboard falls back to an empty-board message, which does not distinguish
an offline API from a genuinely empty board. Neither panel supplies invented live data.
The title screen's save/live-data claims are original UI and depend on the optional backend.

### Validation of this export

The production build and `npm run type-check` passed. A separate `BASE_PATH=/` client build
also passed and produced the same files with relative asset URLs. To preserve protected
paths during this assignment, builds ran from the repository root of a disposable copy
under `test/scratch/`; its source files matched this repository, and its client output was
copied byte for byte into `dist/`.

Chromium interaction checks: **17 passed, 1 failed**. The failure is existing scaffold
chrome: the fixed “Made by Surf” badge intercepts the Menu button's central pointer target.
Focusing Menu with the keyboard and pressing Enter works. Tests exercised name entry, New
game, all three intro steps, keyboard and simulated touch movement, mute, optional-wallet
fallback, sharing and clipboard, quests, home, leaderboard, Squeekchain errors, and exit.
There were no script errors or failed local runtime assets; API 404s were expected.

The pinned design probe scored **9/16**. It confirmed the first-screen title and New game
at 390px, no horizontal scrolling at 320/390/1440, and complete metadata. Remaining findings
include original low-contrast captions, badge overlap, compact/unnamed game controls and
motion preferences. Gameplay, UI, art, audio and all `frontend/src/` files are unchanged.
WebKit could not launch because required system libraries were unavailable; Safari is not
verified. Physical devices, assistive technologies and the full game ending were not tested.

Read [`artifacts/validation.md`](./artifacts/validation.md) for commands, six-domain review,
source locations, screenshots and limitations; [`DESIGN.md`](./DESIGN.md) describes the
implemented design. These are worker observations, not an independent certification.

The dependency-free integrity check can be rerun with:

```bash
node scripts/validate-static.mjs
```

To repeat browser checks without adding a project dependency:

```bash
npm install --prefix test/scratch/browser-deps --no-audit --no-fund playwright@1.61.0
PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node test/scratch/browser-deps/node_modules/playwright/cli.js install chromium --only-shell webkit
PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node scripts/validate-static.mjs test/scratch/browser-deps/node_modules/playwright/index.mjs
```

The browser test manages and closes its own HTTP server at a directory prefix (`/preview/`),
blocks external requests and returns 404 for the absent API. It never submits a post, signs,
or connects a real wallet. Outputs stay under `test/scratch/`, outside the delivery. Its
exit code remains nonzero for the known Menu pointer failure; missing engines are recorded
separately, never reported as tested.

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


For a static-only host, serve the committed `dist/` directory directly; no API rewrite or
backend process is needed. Existing optional platform configuration is not needed to serve
this export. See the offline behavior above for the resulting feature limitations.

Production Vite builds normalize the base to `./`, including when invoked with `BASE_PATH=/`,
so the same export works at a root domain or gateway subpath. Development still honors
`BASE_PATH`. The static head preserves the `squeekchain-project` tag and includes the game
title, description, pixel-mouse favicon and a 1200×630 screenshot for Open Graph. The game
source, artwork generator and audio engine are unchanged. The `.gitignore` exception has an
explicit **4 MiB budget for `/dist/**`** and **1 MiB for `/artifacts/**`** (validation and
screenshots only); nested dependency/cache directories remain ignored.

This worker has prepared the static deployment artifact. Public pinning/domain assignment
happens after submission; it has not obtained a new HTTPS URL or updated the earlier host.

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
