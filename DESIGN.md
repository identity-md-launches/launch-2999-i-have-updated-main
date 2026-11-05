# Squeek Life: implemented design

## Overview

Squeek Life is an existing pixel-art life simulation. A dark purple interface frames a
procedurally drawn city; gold marks Coins and the main action, pink marks progression and
interaction, and cyan marks vehicle/live-data cues. The title screen leads directly to
character naming and New game, followed by optional wallet and sharing controls.

This deployment preserves the finished game. All 72 files in `frontend/src/`, including
gameplay, UI, sprite drawing and WebAudio music, are unchanged. This document describes
their implementation rather than proposing a new design. Build configuration and static
head metadata are the only frontend code changes. Findings remain in
[`artifacts/validation.md`](./artifacts/validation.md). The revision rechecked the same
tokens, components and mobile layouts in Chromium; no visual source changed. Current
reproductions and build-base behavior are recorded in
[`artifacts/revision-validation.md`](./artifacts/revision-validation.md).

## Colors

The game uses literal hex colors through Tailwind arbitrary values and inline canvas
styles. Its reusable UI constants are in `frontend/src/components/game/ui.ts`; it does
not expose a separate set of semantic game CSS variables.

| Value | Existing role and source |
| --- | --- |
| `#0d0c16` | Page/game background; StartScreen and GameShell |
| `#141221` at 95% | Shared panels (`panelClass`), on top of the page/canvas |
| `#191527` | Inputs, preview floor and recessed content |
| `#1c1830` / `#272141` | Neutral button background / hover |
| `#37305a` | Two-pixel panel, button and input borders |
| `#f2f0fa` / `#cfc9e8` | Main / secondary interface text |
| `#9f98c4` / `#8f88b5` | Descriptions and small labels |
| `#5f5880` | Existing subdued captions; fails normal-text contrast (see validation) |
| `#e8b23a` / `#ffd977` | Gold border and translucent fill / gold label (`btnGold`) |
| `#ff2882` / `#ffa8cb` | Pink border and translucent fill / pink label (`btnPrimary`) |
| `#ff8ab8` | Pixel subtitle and progression accents |
| `#7fe8ff` / `#bff2ff` | Vehicle and live-data highlights |
| `#43d17a` / `#8fe8b0` | Energy, completed requirements and connected state |
| `#c94f4f` / `#ffb3b3` | Warning/error borders and text |

`frontend/src/index.css` also retains the scaffold's light `:root` and `.dark` semantic
variables, neutral/brand/status palettes and Tailwind mappings. `frontend/index.html`
applies `.dark` before boot. The game overrides these with its hex palette; there is no
user-facing light/dark switch. The badge uses scaffold `--bg-menu` / `--fg-base`.

Measured caption contrast is 2.81:1 over the panel and 2.95:1 over the page, below 4.5:1.
These are reported existing defects, not approved combinations for new copy. Canvas and
translucent overlays require separate background-dependent contrast evaluation.

## Typography

`frontend/src/App.tsx` imports local Fontsource assets. The complete generated subsets and
fallback formats stay in `dist/assets/`; their OFL notices are in `dist/licenses/`.

| Constant/family | Use and implemented styles |
| --- | --- |
| `PIXEL`: `'Press Start 2P', monospace` | Title, chapter headings, some Coins and key badges; imported weight 400 |
| `VN`: `'Be Vietnam Pro', system-ui, sans-serif` | Game copy, controls, panels and inputs; imported weights 400, 500, 700, 800 |
| `Lato`, system/sans fallbacks | Existing scaffold body and Surf badge; remote Google Fonts import remains in index.css |

The title screen uses 26px for its pixel H1, 13px for the description/input, 12px for
buttons, 11px for labels/subtitle/captions, and 10px for chips/footer. The description is
`leading-relaxed` (1.625); the H1 is `leading-tight` (1.25). The subtitle uses
`tracking-widest` (0.1em). Dense game panels also use 9–16px text. Body text starts at
weight 400; buttons request semibold 600, although an exact 600 font file is not imported.
The browser resolves that request against the supplied faces; this document does not
claim that 600 was loaded.

The entry menu measured five sizes, three families including the badge, and three
requested weights. Game type is intentionally compact and does not promise a six-size
scale across every panel. HUD counters sometimes use `tabular-nums`; pixel Coins and
clock typography retain their existing styles. Inputs are 13px on mobile, so iOS input
zoom remains a known untested concern. Neither copy nor capitalization was rewritten.

## Layout

`StartScreen.tsx` uses a full-width, vertically scrollable `min-h-screen` page with 16px
horizontal padding, 40px vertical padding and a centered maximum width of 620px. The
description/footer are capped at 470px. Main sections use 20/24px spacing; controls
generally use 6/8/12/16px gaps and padding from Tailwind's four-pixel spacing system.
The costume preview is a 180×130 CSS-pixel canvas with capped device pixel scaling.

The original game button stack becomes a row at `sm` (640px). Wallet controls retain a
flex row and wrap text. At 390×844 the title, preview, name input and New game all fit on
the first screen; the button starts at approximately y=479 and is 34px tall. At 320×700
the button starts at approximately y=517. No horizontal overflow was observed on the
entry screen at 320, 390, 768 or 1440px.

`GameShell.tsx` is a fixed-height viewport (`h-screen`) with an absolutely positioned
canvas. The engine renders a 68×44 tile world, using 32px tiles, and disables image
smoothing. A ResizeObserver passes the canvas dimensions to the existing engine, with
minimum internal dimensions of 360×280 and pixel ratio capped at two.

`Hud.tsx` anchors resources at the top left, panel navigation at the top right, prompts
near the bottom center and controls at the bottom. Labels/chapter detail appear at
`sm`; the touch pad is shown below `md` (768px), while keyboard instructions appear at
`md`. The music text appears at `lg` (1024px). Existing mobile HUD groups overlap at
390px; this is recorded rather than described as fully responsive. Touch movement
itself worked. Drawers fill the height and cap at 400px; smaller screens use their
available width. The share panel caps at 560px and 88vh with an internal scroll region.

## Elevation & Depth

`panelClass` combines a 2px `#37305a` border, 95% purple background, a small backdrop blur
and `0 16px 50px rgba(0,0,0,0.65)` shadow. Modal scrims use black at roughly 40–70%
opacity. The existing UI deliberately combines outlines and shadows, including nested
wallet content; these were not replaced in this hosting task.

Stacking uses game controls around z-20, dialogs around z-30, drawers at z-40 and sharing
at z-50. The scaffold badge uses z-index 2147483647. Its overlap with Menu and mobile
copy is an existing defect, not a layering convention to reuse.

## Shapes

Panels use `rounded-lg` (8px with the default 16px root); controls use `rounded-md`
(6px), chips `rounded` (4px), and touch actions `rounded-full`. Most game borders are
2px; chips use 1px. The sprite/city geometry stays rectangular on the canvas. The
favicon is the exact existing 32×32 pixel-mouse SVG from `lib/branding.ts`, extracted
into a static asset so it exists before JavaScript runs.

## Components

| Source / component | Existing behavior and reuse point |
| --- | --- |
| `game/ui.ts`: `btnGold`, `btnPrimary`, `btnGhost` | Gold main action, pink progression action, neutral utilities. Shared inline icon/text layout, transition-colors, opacity/cursor for disabled states. |
| `game/ui.ts`: `panelClass`, `chipClass` | Purple outlined/shadowed panel; compact outlined status chip. |
| `StartScreen.tsx` | Controlled name input (16-character limit, implicit label), New game, conditional Continue, optional wallet notice, sharing, automatic-progress loading text. |
| `Hud.tsx`: `Hud`, `PromptRow`, `TouchControls` | Resource/status display, panel controls, E/F prompts and pointer-driven directional/action controls. Touch directions are 44×44px and E/F 56×56px. Mobile icon-only panel buttons lack accessible names. |
| `SidePanels.tsx`: drawer pattern | Quests, flat, rankings, wallet, chain views; scrolling body, close control, backdrop click; GameShell handles Escape for an open panel. Focus trapping/restoration is not implemented. |
| `StoryModals.tsx`: `DialogModal` | Three opening story steps; E/Enter/Space advance, Escape closes; mouse Continue/Done controls also exist. |
| `ShareModal.tsx` | Single/thread selection, five thread posts, clipboard feedback and X intent action. No post is sent without the visitor using the external intent. No modal focus trap or Escape handler. |
| `SqueekLive.tsx` | Loading, live response and error/retry states. Static-only deployment uses the error state. |
| `lib/branding.ts` / `index.html` | Runtime tab/chapter identity plus static title/description/OG metadata and project tag. Social artwork is a 1200×630 screenshot of this unchanged game, not a replacement for its canvas. |

The source includes native buttons and input semantics. The name input has a pink focus
border. Other game controls rely on native focus behavior and are not claimed to have
uniform verified custom focus rings. Existing drawers/dialogs do not mark the background
inert. The canvas preview keeps animating under reduced motion even though taste@1's
CSS-motion check passes. See the validation report before treating any pattern as an
accessibility reference.

## Do's and Don'ts

- Reuse the constants in `game/ui.ts` and the existing palette when making a separately
  authorized game extension. Use gold for the next game action and the existing neutral
  style for utilities.
- Start a related page from the centered 620px menu container, then compose existing
  button/panel patterns with a heading, short description and directly reachable action.
  Add real labels, meaningful mobile names and an explicit focus treatment rather than
  reproducing the known accessibility gaps.
- Keep artwork and music in their existing procedural engines. Preserve the separation
  between in-game Coins and optional wallet/chain data.
- Keep exported URLs relative and preserve the project meta tag. Static sharing metadata
  lives in `frontend/index.html`; deploy assets belong in `frontend/public/`.
- Do not infer successful persistence, live data, or an empty real leaderboard from an
  absent backend. Do not cover controls with high-z-index site chrome.

Design-review method: Jakub Krehel's Better Interface (MIT) and Paul Bakaus's Impeccable
documentation method (Apache-2.0), pinned versions and attribution in
[`docs/interface-guidance-NOTICE.md`](./docs/interface-guidance-NOTICE.md).
