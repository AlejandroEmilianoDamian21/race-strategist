# F1 Race Strategist

## Objective
Full-stack web app (NestJS backend + React/Vite frontend) where a user picks an F1 race, builds a tyre strategy, runs a simulation and understands the result. Technical challenge deliverable; the user must be able to defend every decision in an interview.

## Scope
- Backend: lightweight hexagonal (domain / application / infrastructure), NestJS, consumes `https://tech-challenge101.onrender.com`, in-memory cache, no DB.
- Endpoints: `GET /api/races`, `GET /api/races/:id/overview`, `POST /api/simulate`.
- Simulation (per lap): `baseLapTime + tyre.pace + tyre.degradation * circuit.tyreWear * stintAge - fuelEffectPerLap * (lap - 1) + driverDelta + rainPenalty`; pit lap adds `pitStopLoss + tyreChangeTime`.
  - `driverDelta = ((1 - team.carPerformance) + (1 - driver.pace)) * 10` (from Claude Design).
  - `rainPenalty`: above band `(r - band.max) * 20 * (1 - wetPerformance)`, below band `(band.min - r) * 6`, else 0.
  - Out of scope: safety car, lap time variance/noise, driver consistency, overtaking.
- Frontend: follows Claude Design system (https://claude.ai/artifact/Q7LP1FGU292WjJoYtXAPMR), Tailwind, i18n ES/EN with language switcher.

## Constraints
- Node 24 (`.nvmrc`, `engines`), TypeScript strict, npm workspaces, single root `npm run dev`.
- No comments in source code (user decision 2026-10-28; `/// <reference>` directives are allowed because they are compiler directives).
- Every commit is approved by the user first; commits grouped by use case; Conventional Commits, no AI attribution.
- TDD: strict (source: user global config). Runners: Vitest in both (backend switched from Jest: NestJS 12 generates ESM + Vitest; constructor injection by abstract-class token verified working under Vitest).
- Delivery (GitFlow, user decision 2026-10-28): `main` (production) and `develop` (integration). Each task branch `feature/<name>` starts from `develop`; PR feature → develop, later PR develop → main. Commits per use case, approved by the user.

## Tasks
- [x] T0 Scaffolding: root workspace, `.nvmrc`, `.gitignore`, `.env.example`, Nest app, Vite app, Tailwind tokens, i18n base, root `dev`/`test` scripts. Route: delegated (writer trigger, many files).
- [x] T1 Domain: models, `validateStrategy`, `simulateRace` (driver + rain) with unit tests.
- [ ] T2 F1 API adapter: fetch client (timeout ~75s, 1 retry), in-memory cache, raw→domain mappers, upstream error mapping, liveness warm-up on init; tests with mocked fetch.
- [ ] T3 Use case ListRaces + `GET /api/races`.
- [ ] T4 Use case GetRaceOverview + `GET /api/races/:id/overview`.
- [ ] T5 Use case SimulateStrategy + `POST /api/simulate`, DTOs, global exception filter, e2e test with fake port.
- [ ] T6 Frontend shared: api client + AppError, i18n ES/EN + switcher, UI primitives, layout/stepper, StatusPanel (wake/api-error/invalid/empty/sim-loading).
- [ ] T7 Frontend race picker + race info (circuit, weather, tyres, drivers by team).
- [ ] T8 Frontend strategy builder + live validation (+ Vitest test).
- [ ] T9 Frontend simulate + result (summary, stint timeline, breakdown table, pit stops, lap chart, compare).
- [ ] T10 README + CLAUDE.md.

## Acceptance criteria
- Runs from a clean checkout following the README.
- User can pick a race, build a strategy and read the result; all error states visible with Retry.
- Backend 400 returns readable, translatable reasons (`code` + `params`).

## Progress
- Phase 0 analysis done and confirmed (2026-10-28).
- T0 implemented (delegated writer). Checks: typecheck ok, lint (oxlint) ok, build ok, test ok (FE 1/1, BE none yet), smoke backend /api 404 JSON + frontend 200. Stack: NestJS 12.3, Vite 8.3, React 19.3, Tailwind 4.3, Vitest 4.1, i18next 26. Commit 8798fdb on main (approved by user), pushed to private repo github.com/AlejandroEmilianoDamian21/race-strategist. Review: unassessable (root commit, no base); 8798fdb is the first reviewed boundary.

- T1 implemented (delegated writer, writer trigger: 22 files). TDD: RED = 3 spec files failing on missing modules; GREEN = 30/30; REFACTOR = pit loss computed once (30/30 still green). Comments removed per user rule, prettier applied. typecheck/lint/build ok. Commit approved by user; PR feature/domain-simulation → develop.

## Next step
T2 F1 API adapter on feature branch from develop.
