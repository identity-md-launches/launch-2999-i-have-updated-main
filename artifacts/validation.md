# Static deployment validation — 2026-11-05

**Accepted-round historical report.** The revision restores upstream Vite base handling;
its explicit `BASE_PATH=/` build now emits absolute asset paths. Read
[`revision-validation.md`](./revision-validation.md) for current results and the scope
decisions for all seven review findings. Statements below about forced relative Vite
builds describe the earlier implementation, not the delivered configuration.

The production export is present and playable. Build and typecheck passed. The review is
not a clean accessibility/responsiveness verdict: the unchanged game has the defects
below, one interaction check fails, and WebKit was unavailable. Public HTTPS publication
has not occurred in this worker session; the submission publisher must provide its URL.

## Scope and source integrity

- Retrieved GitHub main at
  [`73a22ca2f54ad545d57540b7060286c91f4f0a1b`](https://github.com/vinhphamdev/squeek-life/commit/73a22ca2f54ad545d57540b7060286c91f4f0a1b)
  through the public API/archive, without modifying Git metadata.
- Upstream changed only `frontend/vite.config.ts` and root `package.json` relative to
  the supplied checkout. Applied the Vulcan import/plugin removal. Retained the protected
  package manifest: its build already installs/builds the frontend and copies to `dist/`,
  using `BASE_PATH=./`. Production Vite now normalizes the base to `./` even when
  `BASE_PATH=/` is passed. No dependency or lockfile changes were made.
- Confirmed all **72 `frontend/src/` files are byte-identical to retrieved main**. Also
  checked manifests, existing Bun lockfiles, backend and TypeScript configuration against
  the original checkout with `git diff --exit-code`: pass. No gameplay, UI, art or music
  changes, no chain deployment, no real wallet, and no backend configuration.
- Changed only the Vite build configuration, HTML head metadata, static branding/license
  files, root export inclusion, validation script and documentation/evidence. Static
  favicon is the exact SVG already in `lib/branding.ts`; the OG image is a screenshot of
  the unchanged game at 1200×630. Existing badge/body markup is preserved.
- Dependencies and browser tooling were installed only in disposable `test/scratch/`
  copies. The actual builds ran at that copy's repository root to avoid modifying
  protected installation paths. No `node_modules`, cache, dependency archive or submodule
  is in the submission. `.gitignore` grants a **4 MiB path budget to `/dist/**`** and
  **1 MiB to `/artifacts/**`** for validation/screenshots; dependency and Vite cache
  exclusions remain in force at all depths.
- Only the static frontend is delivered. Optional API endpoints were allowed to return
  404 during checks; no leaderboard, wallet, chain or save responses were fabricated.

## Acceptance coverage

| Requirement | Result |
| --- | --- |
| Fetch latest main and retry production build | Retrieved pinned commit; build fix applied; root build passed in disposable repository mirror. Protected root manifest retained per assignment rules. |
| `dist/index.html` and complete assets | Present, with JavaScript, CSS, all bundled game font subsets, favicon, OG image and OFL notices. File sizes and SHA-256 values are in `export-manifest.json`. |
| Source and lockfiles alongside export | Existing complete source and Bun lockfiles retained; root export unignored and included in submission tree. No Git commit/push command was run because Git metadata is protected. |
| Relative URLs/static hosting | HTML asset links, Vite chunks and CSS font URLs are relative; actual game tested at `/preview/`. No SSR or SPA rewrites required. |
| Usable website and responsive primary action | Name entry and New game work. Title and action fit at 320, 390, 768, 1440; no entry-page horizontal overflow. Existing in-game mobile HUD and Menu issues remain. |
| Preserve Squeekchain meta tag | Exact `e8f5e568-69c8-4f8f-af6c-fcc13af273c0` value verified in source and exported HTML. |
| Static title, favicon, description, OG title/image | All present before JavaScript executes; real local image and favicon files exist. |
| Production build/typecheck/interaction validation | Build/typecheck pass; 17 Chromium checks pass, 1 fails; WebKit not run. Actual details below. |
| Better Interface/six-domain review | Applied to build/head corrections; six domains reviewed with source and Chromium evidence. Existing UI findings retained because the brief expressly forbids UI changes. |
| `DESIGN.md` and README | Source-based design document and install/preview/rebuild/verification instructions included. |
| Static-only deployment | Export ready for publisher. Optional backend remains offline. |
| New public HTTPS URL | After submission: no deployment/pinning tool or new hosted address was available in this worker session. Prior README URL is not presented as this deployment. |

Visual idea: a dense purple-and-gold pixel-game interface frames a living, procedurally
drawn city and a direct rags-to-riches play loop.

## Commands and actual outcomes

Commands ran with Node 24.21.0, npm 11.19.0 and Vite 6.4.2. Build/typecheck commands used
the disposable source mirror described above; other commands ran from the delivered
repository root. Package manifests in that mirror matched the protected delivered
manifests. npm package-lock generation was disabled for build runs.

| Command | Actual result |
| --- | --- |
| `npm --prefix test/scratch/build/frontend install --no-audit --no-fund --package-lock=false` | Exit 0. Existing frontend dependencies installed in scratch only. |
| `npm run build` (mirror repository root) | Exit 0, final build 2227 modules, 8.60s Vite phase; client output copied to root `dist/`. No Vulcan dependency remains. |
| `npm run type-check` (mirror repository root) | Exit 0; invokes `tsc --noEmit --incremental`. |
| `BASE_PATH=/ npm run build:client` (mirror frontend) | Exit 0. Byte-identical runtime output to the relative-base build; portability rule works. Font license files were added afterward as static text only; final root build includes them. |
| `node scripts/validate-static.mjs` | Exit 0 on final export. Static identity/project metadata, relative HTML references and actual OG-image file pass. |
| `PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node scripts/validate-static.mjs test/scratch/browser-deps/node_modules/playwright/index.mjs` | Exit 1: **17 pass, 1 fail, 1 engine unavailable**. Failure is the original Menu pointer target obstruction. Keyboard Menu succeeds. |
| `IMD_PLAYWRIGHT="$PWD/test/scratch/browser-deps/node_modules/playwright/index.mjs" PLAYWRIGHT_BROWSERS_PATH="$PWD/test/scratch/playwright-browsers" node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | Exit 0, **9/16 checks pass**, 7 report findings. Exit 0 means measured successfully, not all checks passed. Original probe was not edited. |
| Disposable axe-core 4.11.1/Playwright audit at 390×844 | Completed: entry menu has 1 rule violation (color contrast, 2 nodes); game intro has 1 rule violation (button names, 6 nodes). Game bypass/contrast checks marked incomplete by axe. No full accessibility compliance claim. |
| `git diff --exit-code -- package.json frontend/package.json frontend/bun.lock backend frontend/src frontend/tsconfig.json` | Exit 0. Protected/source integrity also compared directly with upstream main. |
| `git diff --check` | Exit 0. |

The final packaging build adds only the OFL notice files to the earlier browser-tested
export; HTML/JS/CSS/fonts/favicon/social image remain byte-identical. Exact final file
integrity was rechecked after copying. Vite warns about the existing lazy ECharts chunk
(1,056.97 kB uncompressed). It was retained intact; no runtime asset was removed to meet
the size limit. npm also emitted existing environment-option and install-script warnings;
they did not prevent production build or typecheck.

Chromium tested the actual export at `/preview/`, blocking all external requests. The
game fonts loaded locally. It observed zero JavaScript exceptions and zero missing local
runtime files. API 404s were expected. The existing Google Fonts request for scaffold
fonts was blocked, and the game remained playable. No secrets or environment variables
were needed by the game.

The supplied MCP browser failed at launch. A separately installed Playwright 1.61.0
Chromium headless shell provided the screenshots and interactions. WebKit 26.5 was
downloaded but could not launch because required shared libraries (including GTK 4) were
absent. That is an unavailable check, not a Safari pass.

## Primary interactions

`interaction-results.json` records actual outcomes. Assertions checked real controls and
the real engine's save-request payloads; they did not inject a game object, change state,
seed Coins, invent an account or substitute a canvas image.

- At 390×844: H1 at x=52/y=40; New game at x=38/y≈479, width 314, height 34; no horizontal
  overflow. At 320×700: New game at y≈517; at 768 and 1440 it remains on the first screen.
- Entered a character name, activated New game using Enter, advanced all three intro
  lines with E, and observed the real city canvas.
- ArrowRight changed saved position from (144,659) to (215,659). Holding the mobile
  directional control with pointer input changed (215,659) to (283,659). These are
  observed positions from that run, not a timing guarantee.
- Toggled music off and observed the mute label and local preference change. WebAudio
  playback was not assessed by listening.
- Opened quests, flat, leaderboard and Squeekchain drawers; Escape closed them. Observed
  the chain API error with Try again and the leaderboard's existing empty fallback.
- Opened sharing, selected the five-post thread, copied the link and observed clipboard
  success. No X intent or external post was sent. Optional Connect wallet showed the
  existing no-wallet message; no wallet session or signature was attempted.
- A central pointer click on Menu failed because the badge intercepts it. Keyboard
  focus plus Enter returned to the title screen. The 404 progress lookup completed;
  Continue was absent, confirming that this deployment does not persist offline runs.

## Six-domain Better Interface review

The pinned workflow and every domain's core principles were read before implementation.
Applicable corrections were restricted to build/static metadata; the request says,
“Do not change gameplay, UI, artwork, audio, or game source.” That prevents resolving
the existing UI findings through a redesign or silent build-time stylesheet patch.

| Domain | Checked coverage | Limitations / findings |
| --- | --- | --- |
| Accessibility | Source/native semantics and labels; keyboard New game/intro/movement/Escape/Menu; axe menu/intro audit; actual focus screenshot; 24px entry targets from probe; reduced-motion canvas sampling. | Existing unnamed mobile buttons, missing dialog focus management, low contrast. No screen-reader session, full focus-ring verification, forced colors or native browser zoom. |
| Layout | DOM order and breakpoints from source; entry screenshots and bounding boxes at 320/390/768/1440; 390 gameplay screenshot; actual drawer interactions. | Entry fits without horizontal scroll. Game HUD overlaps and badge obstructs Menu. RTL, translations, physical devices and browser-native 200% zoom not reviewed. |
| Writing | All entry copy, primary controls, share tabs and reached API/error/empty/save states read in source and browser. Static metadata uses the game's existing vocabulary. | Original save/live-data claims depend on backend; offline leaderboard text is ambiguous. No game copy changed. |
| Typography | Read Fontsource imports, shared font constants, size/weight/line-height classes; verified both game fonts loaded with external requests blocked; reviewed real wrapping and five entry sizes. | 13px mobile input may trigger iOS zoom; many small in-game labels. Exact semibold 600 face not imported. No Safari typography test. |
| Colors | Read active game palette/scaffold theme roles; measured probe ratios and axe resolved foreground/background pairs. | Two captions fail 4.5:1. Canvas, alpha overlays and every game state were not exhaustively measured. No light variant is offered by the game. |
| UI details | Shared buttons/panels, loading/empty/error states, hover/active declarations, mute feedback, clipboard feedback, pointer movement and overlay close paths. | Existing border+shadow/nested panel styling retained. CSS-motion probe misses ongoing canvas RAF. No 10%-speed animation-panel inspection or all shop/endgame states. |

The probe passes render, targets, eyebrows, type-sizes, type-faces, slogans, repetition,
motion and share. It reports layout, contrast, casing, tracking, glyphs, copy-budget and
chrome. `design-probe.json` preserves its exact check outputs. CSS-motion passing is not
evidence of reduced-motion support for the canvas: a separate sample confirmed that the
costume-preview canvas continues updating under `prefers-reduced-motion: reduce`.

## Findings, fixes and remaining constraints

1. **Fixed — build: absent Vulcan reporter prevents production output.**
   `frontend/vite.config.ts:1`, former `viteErrorReporter` import/plugin. Applied the
   upstream removal and set portable production base at line 11. Recheck: production
   build and explicit `BASE_PATH=/` build both pass; exported asset URLs are relative.
2. **Fixed — static identity/share head was missing or invalid before boot.**
   `frontend/index.html:6`: former `/favicon.ico` and `<title>App</title>`. Added the real
   game title, description, OG metadata, relative static favicon and screenshot. Exact
   project meta remains at line 18. Recheck: final static verifier and probe share pass;
   favicon/OG files exist locally. No body/game UI change.
3. **High, existing — badge obstructs content and Menu.**
   `frontend/index.html:42`, `#surf-badge{position:fixed;bottom:16px;right:16px;z-index:2147483647}`;
   `frontend/src/components/game/GameShell.tsx:245`, Menu at bottom right. Now: badge
   covers the progress chip at 390 and intercepts Menu's center at 1200×630. Candidate
   change: relocate/remove host chrome in a separately authorized UI revision. Why:
   controls must be operable. Reproduction: New game, dismiss intro, click Menu center.
   Evidence: failed interaction assertion and `screenshots/game-390.png`. Retained
   under no-UI-change constraint; keyboard activation is verified.
4. **High, existing — mobile HUD groups overlap.**
   `frontend/src/components/game/Hud.tsx:109` left resource group and line 211 right
   navigation group. Now: at 390 the top-right buttons cross the energy display.
   Candidate change: wrap/stack the two groups at a content-driven breakpoint. Why:
   controls/status must remain readable. Reproduction: start at 390; screenshot
   `game-390.png`. Retained under the explicit UI preservation request.
5. **High, existing — mobile controls have no accessible names; dialogs lack focus management.**
   `frontend/src/components/game/Hud.tsx:102`, hidden nav labels; line 280, hidden wallet
   label; `frontend/src/components/game/StoryModals.tsx:25`, unnamed icon close button;
   `frontend/src/components/game/SidePanels.tsx:17`, untrapped drawer pattern. Now:
   axe reports six unnamed buttons in the mobile intro; source overlays do not move,
   trap or restore focus. Candidate change: persistent aria-labels and semantic modal
   focus handling in an authorized UI revision. Why: assistive/keyboard access.
   Evidence: `accessibility-results.json`; retained, not represented as compliant.
6. **Medium, existing — two caption colors fail contrast.**
   `frontend/src/components/game/StartScreen.tsx:120` and line 201 use `text-[#5f5880]`.
   Now: measured 2.81:1 and 2.95:1, required 4.5:1. Candidate change: use a brighter
   existing text color and remeasure in an authorized UI revision. Why: text readability.
   Evidence: probe contrast/axe outputs and menu screenshots. No color changes made.
7. **Medium, existing — reduced-motion preference does not stop preview animation.**
   `frontend/src/components/game/StartScreen.tsx:38`, recursive requestAnimationFrame.
   Now: canvas samples differ 600ms apart with reduced motion enabled. Candidate
   change: render a still preview when reduction is requested. Why: motion preferences.
   Retained because the requester prohibits artwork/UI changes. CSS probe alone missed it.
8. **Medium limitation, existing — offline progress/leaderboard copy overpromises.**
   `frontend/src/components/game/StartScreen.tsx:197`, “Progress saves automatically”;
   `frontend/src/lib/progress.ts:47`, remote-only save; `SidePanels.tsx:101`, error also
   falls into empty rows. Now: 404 backend means no Continue and no durable run state,
   despite original title claims. Candidate UI change: explicit offline save/board
   status when a future revision permits it. For this task, README documents the actual
   behavior; the optional backend remains off. No fake persistence/data was introduced.
9. **Retained style differences — retro casing/tracking, prose budget and panel chrome.**
   `StartScreen.tsx:105`, 108, 113, 159 and `game/ui.ts:5`. Probe: uppercase pixel
   title/subtitle, subtitle tracking +0.1em, original em dash, 76 first-screen prose
   words (60-word house bar), border+shadow and a nested wallet panel. These are existing
   art direction/copy, not authority to restyle the finished game. No speculative fix.
10. **Source limitation — sharing may lose a gateway subpath.**
    `frontend/src/lib/share.ts:12`: `new URL(base, window.location.origin)` resolves
    `./` from the origin rather than the gateway path. Source inference only: local
    tests use the existing public-URL fallback, and a real IPFS deployment URL was not
    available. No share helper change under the game-source freeze. Use the browser's
    address when sharing a gateway deployment until a separately authorized fix.

## Evidence and completion

Screenshots were actually rendered and inspected: `screenshots/menu-390.png` (390×844
CSS pixels, DPR 2), `menu-1440.png`, `menu-320.png`, `game-390.png`,
`squeekchain-offline.png`, and `keyboard-focus.png`. The source social PNG is a separate
1200×630 gameplay capture. Screenshot evidence is not a screen-reader or physical-device
test. Detailed measurements are in `design-probe.json`, `interaction-results.json` and
`accessibility-results.json`; the export manifest pins every delivered runtime byte.

**Static build/export complete for the requested preservation scope. Full acceptance is
not claimed:** unchanged UI defects remain, Safari and several accessibility checks are
unverified, and a new public HTTPS deployment URL is pending publication. No build,
deployment or interaction was reported successful solely from source inspection. The
existing public URL was neither redeployed nor passed off as a new result.
