<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# domain

## Purpose
Domain-per-package structure: each domain (trade, dashboard, history, stock, owner, brokerage, common) follows internal layering — `controller` → `service` → `repository` → `entity`, with request/response shapes in `dto`. Repositories use QueryDSL (`JPAQueryFactory`) for dynamic filtering except `owner` and `brokerage`, which use simple Spring Data derived-query repositories by established convention.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `trade/` | Trade CRUD, ledger replay (BUY/SELL creates/updates/deletes; computes realized profit via replay from an anchor point) (see `trade/AGENTS.md`) |
| `dashboard/` | Aggregated view: per-owner, per-brokerage, per-security positions and totals (computed from materialized `dashboard_positions` table) (see `dashboard/AGENTS.md`) |
| `history/` | Trade history queries with date/side/owner/brokerage filters (see `history/AGENTS.md`) |
| `stock/` | Catalog of securities and their market prices (searches via Naver Finance; prices are snapshots) (see `stock/AGENTS.md`) |
| `owner/` | Catalog of account holders (see `owner/AGENTS.md`) |
| `brokerage/` | Catalog of brokerages (see `brokerage/AGENTS.md`) |
| `common/` | Shared domain types: TradeSide (BUY/SELL), Market (KOSPI/KOSDAQ), etc. (see `common/AGENTS.md`) |

<!-- MANUAL: -->
