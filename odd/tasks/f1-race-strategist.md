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
- [x] T2 F1 API adapter: fetch client (timeout ~75s, 1 retry), in-memory cache, raw→domain mappers, upstream error mapping, liveness warm-up on init; tests with mocked fetch.
- [x] T3 Use case ListRaces + `GET /api/races` (+ global error filter moved here from T5, so the first endpoint already returns 502 on upstream failure).
- [x] T4 Use case GetRaceOverview + `GET /api/races/:id/overview`.
- [x] T5 Use case SimulateStrategy + `POST /api/simulate`, DTOs, global exception filter, e2e test with fake port.
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

- T1 review (reliability lens): approved; follow-ups for T5: label result with ctx.race.id/ctx.driver.id (ids unchecked), forecast-gap fallback documented as assumption.
- T2 implemented (delegated writer, writer trigger: 13 files) on feature/f1-api-adapter. TDD: RED = 4 new spec files failing on missing modules; GREEN = 60/60. typecheck/lint/build ok; no comments; smoke: server started before warm-up, log `F1 API warm-up succeeded`. Commit approved by user; PR #2 merged to develop.
- T2 review (reliability): approved with advisories. Fixed on fix/f1-adapter-error-mapping (inline, 2 files): list endpoints leaked F1ApiHttpError (non-5xx) through the port; race-scoped payloads were cached before validation. TDD: RED 2 failing (429 leak, malformed payload cached), plus 2 coverage tests; GREEN 64/64; checks ok. Commit 9abf384, PR #3. Fix review approved with 2 suggestions, applied as 2nd commit (approved by user): async restored on race-scoped methods (sync URIError), non-object detail payload test. RED 2 failing, GREEN 68/68.

- T3 implemented (delegated writer, 13 files) on feature/list-races. Filter + ValidationPipe registered via APP_FILTER/APP_PIPE; configureApp() shared by main and e2e; FakeF1DataPort in backend/test/support. TDD: RED 2 unit spec files + e2e failing on missing modules; GREEN unit 84/84, e2e 4/4, FE 1/1. Smoke real API: GET /api/races joined+sorted, GET /api/nope 404 ErrorResponse. Commit a9ac077, PR #4. T3 review (reliability): approved; fixed inline (2 files): 5xx HttpException now logged + generic message; non-error throw test; logger spy restored in afterEach. RED 1 failing (503 leak), GREEN unit 86, e2e 4. Deferred to T5: e2e proving ValidationPipe active. Fix commit approved by user (2nd commit in PR #4); its review approved (R3-001 not applicable: array branch guarded by status 400).
- T4 implemented (delegated writer, 7 files) on feature/race-overview. Promise.all over 6 port calls; teams in upstream order, empty teams omitted, drivers by number, tyres in TYRE_COMPOUNDS order; orphan driver -> 502 invalid-response; unknown race -> 404 via adapter. TDD: RED spec missing module + 3 e2e 404; GREEN unit 95, e2e 7, lint/typecheck/prettier clean. Smoke real API: race-01 overview 6 keys, 10 teams; /races/nope/overview 404 RACE_NOT_FOUND. Commit 598ffb5, PR #5. T4 review (reliability): approved; R3-001 accepted: Promise.all made 404 vs 502 timing-dependent -> allPreferringRaceNotFound (allSettled, RaceNotFoundError wins, else first failure in call order). RED 1 failing (weather timeout won), GREEN unit 96, e2e 7. R3-002 rejected: adapter already rejects unknown compounds. Fix review approved: S1 latency trade-off accepted (allSettled waits for the slowest call; documented here, no code comments per user rule); S2 added tie-break test (earliest call's failure wins), mutation check (last failure wins) turns it red. Unit 97, e2e 7. Fix commit fe97687 approved; PR #5 merged.
- T5 implemented (delegated writer, 11 files) on feature/simulate-strategy. allPreferringRaceNotFound moved to shared application helper; SimulateStrategy loads 6 datasets, DriverNotFoundError for unknown driver, orphan team -> 502 invalid-response, domain InvalidStrategyError propagates; result ids labeled from ctx (T1 follow-up). DTO structural only (class-validator nested), business rules stay in domain. Presenter rounds times to 3 decimals. TDD: RED 3 unit specs missing modules + 8 e2e 404; GREEN unit 108, e2e 15 (ValidationPipe proven active: malformed body + unknown property -> 400 VALIDATION_FAILED). Smoke real API: race-01 MEDIUM 20 + HARD 37 = 5231.128s, 1 pit stop lap 20; SOFT 57 -> 400 NOT_ENOUGH_PIT_STOPS; laps 'ten' -> VALIDATION_FAILED; unknown driver/race -> 404. Awaiting commit approval.

## Next step
Commit T5 (after user approval), PR to develop; then T6 frontend base (api client, AppError, i18n switcher, StatusPanel).
