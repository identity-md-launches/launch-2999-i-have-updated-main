# Static-export revision validation — 2026-11-05

Restored upstream Vite base handling and rebuilt the static game. The production build
and typecheck pass. `dist/index.html` and all 47 supporting files remain present and
byte-identical to the accepted export. Full acceptance is not claimed: the protected
root build script still selects `./`, the preservation brief prevents the six confirmed
UI corrections, and a new public HTTPS URL awaits the submission publisher.

## Scope and conflicting requirements

Retrieved GitHub main through the public commit API and archive, without changing Git
metadata. Main remains
[`73a22ca2f54ad545d57540b7060286c91f4f0a1b`](https://github.com/vinhphamdev/squeek-life/commit/73a22ca2f54ad545d57540b7060286c91f4f0a1b).
All 72 `frontend/src/` files match that main and the accepted checkout. Vite now also
matches main exactly: its callback no longer special-cases production, and
`frontend/vite.config.ts:9` is `const base = process.env.BASE_PATH || './'`.

The overriding rules prohibit changing `package.json`, dependencies and lockfiles, and
the brief says, “Do not change gameplay, UI, artwork, audio, or game source.” The later
general authorization for build configuration permits the Vite correction; it does not
remove the explicit protected-manifest rule. Accordingly, the root script remains
`BASE_PATH=./`. Applying upstream's `BASE_PATH=/` root script needs the requester to
remove that restriction. Keeping the delivered export relative also meets the separate
static-subpath acceptance criterion. No build-time rewriting disguises either behavior.

Each review finding is answered in [`.imd-responses.json`](../.imd-responses.json).
“Disputed” identifies an authorization conflict, not a claim that the reported defect
failed to reproduce. The permitted Vite portion of the high finding is fixed.

## Current commands and results

To avoid writes to protected dependency paths, build/typecheck ran at the repository
root of a disposable `test/scratch/build/` mirror with identical source, manifests and
existing lockfile. `npm_config_package_lock=false` prevented lockfile generation;
npm's cache and installations stayed in scratch. Other checks used the delivered root
`dist/`. Node 24.21.0, npm 11.19.0 and Vite 6.4.2 were used.

| Command / check | Actual result |
| --- | --- |
| `npm run build` in mirror root | Exit 0; 302 packages installed, 2227 Vite modules, 10.90s build phase. Root `dist/` created by the existing script. All 48 SHA-256 values match the delivered export. |
| `npm run type-check` in mirror root | Exit 0; `tsc --noEmit --incremental`. |
| `BASE_PATH=/ npm run build:client -- --outDir ../absolute-check` in mirror frontend | Exit 0; 10.99s Vite phase. Generated module `/assets/index-BI4RFt-t.js` and stylesheet `/assets/index-CHSencgf.css`. This temporary check export is not delivered. |
| Final-export metadata/asset check: `node scripts/validate-static.mjs` | Exit 0. Title, favicon, description, OG title/image, exact Squeekchain project tag and local relative HTML assets all present. |
| `PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node scripts/validate-static.mjs test/scratch/browser-deps/node_modules/playwright/index.mjs` | Exit 1: 17 Chromium checks pass, one Menu pointer check fails, WebKit unavailable. |
| `IMD_PLAYWRIGHT="$PWD/test/scratch/browser-deps/node_modules/playwright/index.mjs" PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | Exit 0; probe completed, 9/16 checks pass. Seven findings remain; completion exit is not an all-pass verdict. |
| Disposable revision reproducer: `PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node test/scratch/reproduce.mjs` | Exit 0. Confirmed all six advisory defects against the production export, including axe-core 4.11.1 audits. Used real static-server HTML 404s, without invented API data. Results retained below; scratch scaffolding is not submitted. |

The production build retains Vite's existing large ECharts chunk warning (1,056.97 kB).
No required runtime asset was removed. Package-manager option/install-script warnings
did not prevent the build. The supplied MCP browser failed during Chromium startup
because its socket path was too long; disposable Playwright 1.61.0 Chromium headless
shell supplied the rendered checks. WebKit 26.5 could not launch due to missing shared
libraries, including GTK 4; Safari remains unverified.

## Primary interactions and first screen

The existing interaction script rechecked the actual export under `/preview/`, blocking
external services. Keyboard New game, all three E-driven introduction steps, ArrowRight,
pointer-driven mobile movement, mute, wallet-unavailable feedback, share/thread/clipboard,
quests, home, rankings, Squeekchain error and Escape all behaved as previously recorded.
No real wallet connection, signature or external post was attempted.

At 390×844 the product H1 is at x52/y40 and New game is at x38/y478.875, 314×34px:
both fit on the first screen. Entry checks also pass at 320×700, 768×900 and 1440×900
with zero horizontal overflow. Both local game fonts load. No page JavaScript exceptions
or missing local runtime assets were observed; optional API 404s are expected. The
leaderboard test in the existing script checks the inherited empty fallback, which is
documented as a defect, not a correct offline state.

Viewed fresh mobile screenshots:
[entry](./revision-menu-390.png) and [gameplay](./revision-game-390.png).
The title, character preview, name input and primary action are visible; gameplay still
has the inherited HUD and badge overlaps. The center Menu pointer click fails at
1200×630, while focus plus Enter exits. A separate plain-static-server reproduction
verified loss of run state on Menu and reload.

## Findings and disposition

| Source | Fresh evidence | Disposition |
| --- | --- | --- |
| `frontend/vite.config.ts:9`; `package.json:7` | Earlier production expression forced `./`; upstream root script selects `/`. Restored Vite now emits `/assets/` when supplied `/`, and relative assets when supplied `./`. | Vite fixed and rechecked. Root-script portion disputed under overriding protected-path rule. |
| `frontend/index.html:42` | Menu click times out after 5000ms; hit testing at (1148.5,601) identifies the badge SVG. Probe confirms progress-caption coverage at 390. | Reproduced; removing badge is a frozen UI change. Keyboard exit works. |
| `frontend/src/components/game/Hud.tsx:109` and `:211` | At 390, energy group x84/y14.25/w194/h35 intersects four toolbar buttons at y12/h29. Gameplay screenshot confirms obstruction. | Reproduced; stacking/relocating HUD requires UI authorization. |
| `frontend/src/components/game/Hud.tsx:102`, `:280`; `StoryModals.tsx:25` | Axe button-name violation: six unnamed nodes during mobile intro. | Reproduced; valid aria-label correction requires permission to edit frozen game UI source. |
| `frontend/src/components/game/StartScreen.tsx:120`, `:201` | Probe 2.81:1 and 2.95:1; axe resolves #5f5880 over #141220 and #0d0c16, at 11px and 10px. | Reproduced below 4.5:1; color correction requires UI authorization. |
| `frontend/src/components/game/StartScreen.tsx:197`; `frontend/src/lib/progress.ts:47` | Save requests return 404. Real movement changes (144,659) to (212,659); Menu and reload each show no Continue. Local storage has name/key only in this reproduction. | Reproduced; README warns of offline data loss. No persistence or in-game copy change under source freeze. |
| `frontend/src/components/game/SidePanels.tsx:101` | Four failed HTML-404 leaderboard requests, followed by “Nobody on the board yet — you could be the first.” | Reproduced; missing error branch/copy requires game UI authorization. No fabricated rankings supplied. |

## Better Interface review coverage

Read the pinned workflow and all six domain core sections; used the documentation
method to recheck `DESIGN.md`. Existing colors, typography, components and responsive
behavior stay authoritative. Fixes were limited to the permitted Vite configuration;
the guide does not authorize changing the preserved game.

| Domain | Checked this revision | Remaining limitations |
| --- | --- | --- |
| Accessibility | Native controls/labels in source, keyboard start/intro/movement/Escape/Menu, focus screenshot, axe menu/intro, probe targets. | Six unnamed buttons and caption contrast remain. No screen-reader, forced-colors or exhaustive focus-management audit. |
| Layout | Source anchors/breakpoints, entry measurements at 320/390/768/1440, rendered 390 game and toolbar rectangles, badge hit testing. | HUD/badge collisions remain. No native 200% zoom, RTL, translation or physical-device testing. |
| Writing | Entry/control vocabulary, actual absent-backend saving and leaderboard state, README limitations. | In-game autosave/empty-board copy still overpromises; frozen UI. |
| Typography | Existing imports/type constants, loaded local fonts, entry wrapping/screenshots and five-size probe result. | Dense small game type retained; iOS input zoom and Safari rendering unverified. |
| Colors | Existing palette/source values and fresh probe/axe resolved contrast pairs. | Two failing captions retained. Canvas, translucent backgrounds and all later game states not exhaustively measured. |
| UI details | Button/panel declarations, loading/empty/error states, mute/clipboard feedback, keyboard close paths and touch movement. | Inherited panel chrome retained. No 10%-speed animation-panel audit or full-game ending test. |

The probe passes render, targets, eyebrows, type sizes, type faces, slogans, repetition,
CSS motion and share; layout, contrast, casing, tracking, glyphs, prose budget and chrome
report findings. Retro capitalization and visual density are the preserved design.
The CSS-motion pass does not verify canvas reduced-motion support; the accepted-round
report's continuing-canvas-animation limitation remains.

## Evidence and delivery

[`revision-results.json`](./revision-results.json) contains current base-mode output,
17/18 interaction outcomes, the fresh probe, axe nodes, geometry and static-only API
observations. Existing [`export-manifest.json`](./export-manifest.json) still matches
every delivered file; no runtime byte changed. The two new screenshots are fresh
Chromium observations, not screen-reader or physical-device evidence.

No package, lockfile or game source changed. Dependencies, downloaded archives and browser
binaries are confined to disposable scratch. Packaging verification also found generated
tool caches outside scratch; `.gitignore` now excludes `.cache/` and `.npm/` recursively,
with an explicit **zero-byte submission budget** for both paths. No cache contents are
delivered. The inherited runtime/evidence budgets remain `/dist/**` ≤4 MiB and
`/artifacts/**` ≤1 MiB; the entire candidate tree remains below 8 MiB.

Static build/export complete for the permitted preservation scope; unresolved acceptance
items are stated above. There is no deployment/account tool in this worker session and
no newly issued public HTTPS URL. The submission publisher must pin the committed export
and provide that address. The older README host has not been redeployed or presented as
this revision's URL. No blocker file was created: useful permitted work is complete and
each scope conflict has a review response.
