# CLAUDE.md

Guidance for AI coding agents working in this repository. See `README.md` for how to run it and the simulation assumptions.

## Setup

Node 24 or newer (`.nvmrc`). With nvm: `source ~/.nvm/nvm.sh && nvm use 24`.

## Commands

Run from the repository root.

| Command             | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `npm install`       | Install both workspaces                       |
| `npm run dev`       | Backend (:3000) and frontend (:5173) together |
| `npm run build`     | Build both workspaces                         |
| `npm run lint`      | oxlint                                        |
| `npm run typecheck` | TypeScript check                              |
| `npm test`          | Unit tests (both workspaces) then backend e2e |
| `npm run test:e2e`  | Backend e2e only                              |

Before finishing a task: `npm run lint && npm run typecheck && npm test && npm run build`.

## Architecture rules

- Monorepo with npm workspaces: `backend` (NestJS) and `frontend` (React 19, Vite, Tailwind 4, TanStack Query, i18next).
- Backend is hexagonal: `src/domain` (pure, no framework imports) <- `src/application` (use cases, `F1DataPort`) <- `src/infrastructure` (F1 API adapter, HTTP controllers/DTOs/filters). `src/config` holds env config. Dependencies only point inward.
- The backend is the only gateway to `tech-challenge101.onrender.com`. The frontend calls `/api/...` only and never the upstream host. Do not add direct upstream calls from the frontend.
- Business rules (strategy validation, simulation) live in `domain`. DTOs validate structure only.
- Errors share one body: `{ statusCode, code, message, details? }`. Strategy violations carry `code`, `field`, `params`, `message`; the frontend translates by `code` using `params`.
- Frontend is organized by feature under `frontend/src/features/*` (`races`, `strategy`, `result`). Cross-feature code goes in `frontend/src/shared/*` (`api`, `i18n`, `design`, `ui`, `layout`, `hooks`, `domain`, `lib`). Features do not import from each other's internals.

## Conventions

- No comments in code. The only exception is compiler directives such as `/// <reference ... />`.
- Strict TDD: write a failing test first (Vitest in both workspaces), then the implementation, then refactor. Tests and docs ship in the same commit as the behavior.
- Code, identifiers and i18n keys are in English. Every UI string must exist in both `es` and `en` (`frontend/src/shared/i18n/locales/`).
- Design tokens come from `frontend/src/shared/design/tokens.css`. Do not hardcode colors, fonts or spacing that a token covers.
- Git: GitFlow. Branch `feature/<name>` from `develop`, PR into `develop`; `main` is production.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), grouped by work unit. No AI attribution or `Co-Authored-By` lines.
- Do not commit, push or open PRs unless the user asks.
- Do not touch `.env` files. Use `backend/.env.example` as the reference for variables.
