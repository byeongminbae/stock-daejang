# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A family stock trading ledger: a Kotlin/Spring Boot backend (`backend/`) and a Next.js frontend (`frontend/`), backed by PostgreSQL. Users record BUY/SELL trades and the backend maintains per-owner/brokerage/security positions and realized profit.

## Commands

### Backend (`backend/`)

```bash
./gradlew build                                  # compile + test
./gradlew test                                   # run all tests (needs Docker: Testcontainers spins up Postgres)
./gradlew test --tests "kr.byeongmin.stockdaejang.domain.history.HistoryRequestDtoTest"
./gradlew test --tests "*.HistoryRequestDtoTest.특정 테스트 이름*"
./gradlew bootRun                                # run locally against $SPRING_DATASOURCE_URL etc.
```

Integration tests (`*IntegrationTest.kt`) use `@Testcontainers` with a real `postgres:17-alpine` container, so Docker must be running. DB schema is managed entirely by Flyway migrations in `src/main/resources/db/migration/` — never edit an already-applied migration; add a new `V{n}__description.sql` instead.

### Frontend (`frontend/`)

```bash
pnpm dev                       # Next.js dev server
pnpm build && pnpm typecheck   # production build / tsc --noEmit
pnpm lint / pnpm format        # biome check / biome check --write
pnpm test                      # vitest run (tests/unit)
pnpm test:integration          # vitest run tests/integration
pnpm test:e2e                  # playwright test (tests/e2e) — needs the app running
```

### Full stack

`docker-compose.yml` at the repo root runs `db` + `backend` + `frontend` together (used for local/prod-like runs, not for iterating on a single service).

## Architecture

### Backend: domain-per-package

Each business area under `domain/` (`trade`, `dashboard`, `history`, `stock`, `owner`, `brokerage`) follows the same internal layering: `controller` → `service` → `repository` → `entity`, with request/response shapes in `dto`. Repositories are QueryDSL (`JPAQueryFactory`), not Spring Data repositories — dynamic filters are built either with `BooleanBuilder` or, preferably, by passing a `Predicate?` vararg to `.where(...)` (QueryDSL ignores `null` entries, so this avoids `BooleanBuilder` for simple AND-only filters).

Cross-cutting code lives in `global/`:
- `global.error.ErrorType` / per-domain `*Error` enums (e.g. `trade.error.TradeError`) carry a status code, message, and `HttpStatus`; thrown as `BusinessException(errorType)`.
- `global.exception.GlobalExceptionHandler` (`@RestControllerAdvice`) maps `BusinessException`, bean-validation failures (`MethodArgumentNotValidException`, `ConstraintViolationException`), type-mismatch (`MethodArgumentTypeMismatchException`), and missing params into a single `ErrorResponse` shape.
- Every endpoint returns `Response` — `SuccessDataResponse<T>` or `SuccessResponse`, both carrying `success`/`timestamp`.
- `global.util.ifNullThrow()` — turns an unexpected null into `BusinessException(CommonError.NULL_CASTING_ERROR)`; used at points where a value *must* be present by invariant (e.g. an ID after persist) rather than doing a manual null-check-and-throw.

Query-parameter DTOs bound via `@ParameterObject` (springdoc) generally follow a two-DTO convention: a `Get*RequestDto` holds the raw bound values (validated with Jakarta annotations at the controller boundary via `@Valid`) and exposes a `to*Dto()` that trims/defaults/converts into a second, fully-normalized DTO used by the service layer and echoed in the response. See `domain/history` for the current example.

### Trade ledger replay (the non-obvious part)

`dashboard_positions` is a materialized table (quantity + total cost basis per owner/brokerage/security) — it is **not** computed on read. Whenever a trade is created/updated/deleted, `TradeService` resolves which `(ownerId, brokerageId, itemCode)` ledgers are affected, takes a `PESSIMISTIC_WRITE` lock on the corresponding `securities` rows (sorted, via `TradeLedgerRepository.lock`, to avoid deadlocks across concurrent requests), and calls `TradeLedgerManager.replay(key, updateFrom)`:

1. `LedgerStateCalculator` folds all trades *before* `updateFrom` into a starting `LedgerState` (held quantity, remaining cost) using weighted-average cost accounting: BUY adds `qty*price` to cost; SELL removes `qty*price - realizedProfit` (the cost basis of the shares sold).
2. `LedgerReplayCalculator` replays every trade *from* `updateFrom` onward against that starting state, recomputing `realizedProfit` for each SELL trade and writing it back onto the `Trade` entities.
3. The final `LedgerState` is written into `dashboard_positions` via `DashboardPositionRepository.replace(...)` (upsert-or-delete-if-zero-quantity).

An update/delete can affect two ledgers (old + new key for an edited trade) — `TradeService.earliestByLedger` collapses these to the earliest `updateFrom` per ledger key before replaying. `V7__persist_dashboard_positions.sql` backfills this table from `trades` using the same `qty*price - realizedProfit` formula, so the migration and `LedgerStateCalculator` must stay in sync.

### External market data

`domain/stock/provider/{MarketPriceProvider,StockSearchProvider}` are the ports; `external/naver/NaverStockProvider` is the only current implementation (Naver Finance, via `RestClient`). `RestClientConfig` turns any non-2xx response into `BusinessException(CommonError.EXTERNAL_API_ERROR)` and logs request/response with sensitive headers redacted.

### Dates

Postgres columns are `TIMESTAMPTZ`; entities and query boundaries use `OffsetDateTime` (or `Instant`), not `LocalDateTime` — `TIMESTAMPTZ` is already UTC-normalized internally, so `LocalDateTime` would silently discard the offset the column actually carries. Day-level user input (e.g. history date filters) is anchored to `Asia/Seoul` when converting to an instant range.

### Frontend

Server Components (`app/*/page.tsx`) fetch data directly from the backend through `lib/server/stock-daejang-api.ts` (server-only, each response parsed with a Zod schema — `INTERNAL_API_BASE_URL` env var). Client Components that need to call the API themselves (e.g. autocomplete) go through the catch-all relay at `app/api/v1/[...path]/route.ts` (`lib/server/api-gateway.ts`), since they can't reach `INTERNAL_API_BASE_URL` directly from the browser.

## Codex config detected

This machine has an OpenAI Codex config at `~/.codex/`. If you want to import anything importable from it (MCP servers, slash commands, subagents, skills, instructions) into Claude Code, reply `/import` to scan it.
