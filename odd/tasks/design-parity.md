# Design Parity (Claude Design handoff)

## Objective
Make the frontend match the Claude Design handoff in `frontend/race-strategist-design/design/` exactly, phase by phase, following `HANDOFF.md`.

## Problem
The frontend works but diverges visually from the design (missing components, copy, layout details, rain scale, builder interactions).

## Scope
- Visual and interaction parity for every step, both widths (1280 and 390), all states.
- Backend stays the only gateway, unchanged (user decision 2026-10-28): no new endpoints. Step 2 keeps one overview request, so per-card failure is a documented deviation; the wake state keeps using the races request timing.

## Constraints
- Tokens only from `design/tokens.css`; Tailwind `@theme` maps to those variables.
- Exact Spanish copy from `reference/bundle.js`; English via i18next.
- No comments in code; strict TDD for logic (runner: Vitest, source: user global config); Conventional Commits approved by the user.
- After each phase: Playwright screenshots at 1280 and 390 (`npm run shots`), compare with `design/reference/screenshots/`, fix differences, mark the HANDOFF checklist, stop for user review.
- Branches `feature/design-<phase>` (first one based on feature/strategy-builder until PR #9 merges).

## Tasks
- [x] D1 Base: tokens.css as single source, Google fonts weights, globals (bg, focus ring), stroke icons from bundle.js, reduced motion, Playwright shots script.
- [x] D2 Data layer: AppError statusCode + code + technical line; compound letters mapping (backend stays as is).
- [x] D3 Atoms: Button, CompoundBadge, Stepper.
- [ ] D4 Step 1: RacePicker + skeleton + wake/api-error.
- [ ] D5 Step 2: CircuitCard, TyreCompounds, WeatherTimeline, DriverGrid.
- [ ] D6 Step 3: StintBuilder (weather band, draggable handles, rows, live validation, SIMULAR states).
- [ ] D7 Step 5: ResultSummary, PitStops, StintTimeline, BreakdownTable, LapTimeChart, compare.
- [ ] D8 Screen: fixed header with scroll-following stepper, single page, mobile CTA.
- [ ] D9 Final pass: all states at 1280 and 390 against the screenshots.

## Notes
- WIP from the stopped T8.4 writer is in `git stash` ("wip T8.4 design parity (stopped writer)"); reuse per phase.

## Progress
- D1 implemented (delegated writer). tokens.css copied verbatim to src/shared/design and mapped via `@theme inline` (utilities resolve to var(--token)); fonts with exact weights; globals (bg, :focus-visible shadow-focus, .num, .skeleton shimmer + reduced motion); 10 icons ported from bundle.js; Playwright 1.64.1 (cached chromium 1248, no download) + `npm run shots`. RED icons 10/25 failing -> GREEN; FE 233; lint/typecheck/build/prettier clean; design folder ignored by oxlint. Shots compared: base colors, surfaces, brand bar and header match; reference PNGs were rendered with fallback fonts (no Barlow), so font shapes differ by design of the capture, not ours. Decision: type styles come from tokens.css classes (.heading-1, .eyebrow, .data...) used directly by components in D3+; the duplicated --text-* in @theme get removed as components migrate. Spacing uses Tailwind's 4px scale (numerically equal to --space-*). HANDOFF: reduced-motion item checked.

- D1 review (reliability): approved; R3 warning accepted -> tokens.css imported with layer(components), .num/.skeleton in @layer components (verified in built CSS: now inside components layer, before utilities), Skeleton contract tests, shots script checks the dev server and waits for fonts. Commit dca60d1.
- D2 implemented (delegated writer). AppError carries method, path, statusCode, backend code + message; request() fills them for HTTP, network, timeout and non-JSON errors; technicalLine() = `GET /api/races → 502 · UPSTREAM_UNAVAILABLE · <message>` (reference format), `→ network` / `→ timeout` (no reference string exists), emptyListLine() `GET /api/races → 200 · races = [] (0 elementos)` (used in D4); api-error panel uses technicalLine. Compounds unified in shared/domain/compounds.ts (order, S/M/H/I/W, i18n name key). RED 5 files/7 tests -> GREEN FE 244; lint/typecheck/build/prettier clean. No visual change in this phase (shots unchanged). HANDOFF "Errores mapeados" items stay open until the StatusPanel is verified visually in D4.
- D3 implemented (delegated writer, route: delegated direct, 2+ non-trivial files). Button: 1px tracking, disabled hint with 16px danger error icon, ghost padding via size map; typography decided by the user = what the reference renders (`.rs button { font: inherit }` beats `.rs-btn`): Barlow 400 15/22 uppercase via `.body`, same for lg; local Button README updated to say so. CompoundBadge: sm 20/2px/11px, base 28/3px/15px, lg 44/5px/22px, extrabold; TyreChip added and used by TyreCompounds. Stepper: steps are buttons scrolling to #step-<key>, mobile "Paso N de 5 · X" with bold parts (stepper.compactRich), no check on done steps. shots.mjs gained --ref <Name> and --flow. RED 6 tests (+1 ghost padding) -> GREEN; typography RED 1 -> GREEN; FE 255; lint/typecheck/build/prettier clean. Computed SIMULAR style app vs preview identical (Barlow 15px 400 22px 1px 52px). Pending: mid-width stepper labels sr-only vs reference ellipsis (kept), steps 4/5 have no section until D8, scroll-following in D8. No HANDOFF checklist item closes in D3 (global items need the full screen).

## Next step
User reviews D3 and approves the commit; then D4 Step 1 (RacePicker, wake/api-error, empty list, 404).
