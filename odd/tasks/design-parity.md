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
- [ ] D2 Data layer: AppError statusCode + code + technical line; compound letters mapping (backend stays as is).
- [ ] D3 Atoms: Button, CompoundBadge, Stepper.
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

## Next step
User reviews D1; then D2 data layer.
