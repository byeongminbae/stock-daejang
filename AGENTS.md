<!-- Generated: 2026-09-02 -->

# stock-daejang

## Purpose
Family stock trading ledger. Users record BUY/SELL trades and the app maintains per-owner/brokerage/security positions and realized profit. Kotlin/Spring Boot backend (`backend/`) + Next.js frontend (`frontend/`), PostgreSQL-backed, run together via Docker Compose.

## Key Files
| File | Description |
|------|--------------|
| `CLAUDE.md` | Authoritative architecture/commands/conventions guide — read this first |
| `docker-compose.yml` | Prod-style stack: `db` + `backend` + `frontend`, pulls GHCR images by default |
| `docker-compose.dev.yml` | Dev override enabling local `build:` for `db`/`backend` (combined via `.env`'s `COMPOSE_FILE`) |
| `.env` | Sets `COMPOSE_FILE` to combine the two compose files |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `backend/` | Kotlin/Spring Boot API (see `backend/AGENTS.md`) |
| `frontend/` | Next.js app (see `frontend/AGENTS.md`) |

## For AI Agents

### Working In This Repository
- Read `CLAUDE.md` first — it documents the domain-per-package backend layout, the trade-ledger replay algorithm, and the frontend Server/Client Component split in more depth than this file does.
- Never edit an already-applied Flyway migration (`backend/src/main/resources/db/migration/`); add a new `V{n}__description.sql` instead.
- Commits are made by the repository owner only — do not run `git commit` unless explicitly asked to, and even then only when the owner requests it directly.
- The `frontend` Docker container observed in `docker compose ps` during a session may be externally managed/restarted outside agent control — avoid stopping/restarting it unless the user asks.

### Testing Requirements
- Backend: `./gradlew test` (needs Docker — Testcontainers spins up a real `postgres:17-alpine`).
- Frontend: `pnpm test` (vitest unit), `pnpm test:e2e` (Playwright, needs the app running).
- No local JDK is available in some environments — compile-check Kotlin via `docker run --rm -v backend:/workspace -w /workspace eclipse-temurin:25-jdk-alpine sh -c "./gradlew compileKotlin --no-daemon -q"`.

### Common Patterns
- Backend repositories are QueryDSL-based (`JPAQueryFactory`), not Spring Data derived queries, except the small `owner`/`brokerage` domains which use plain Spring Data repositories by established convention.
- Frontend Server Components fetch directly from the backend (`lib/server/stock-daejang-api.ts`); Client Components go through the catch-all relay at `app/api/v1/[...path]/route.ts` since they can't reach the internal backend URL from the browser.

## Dependencies

### External
- PostgreSQL 17 — the shared datastore for `backend`.
- Docker / Docker Compose — local orchestration of `db` + `backend` + `frontend`.

<!-- MANUAL: -->
