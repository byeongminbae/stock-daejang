<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# dashboard

## Purpose
Serves the materialized `dashboard_positions` table (quantity + total cost basis per owner/brokerage/stock) and assembles owner/brokerage/stock hierarchy views with market prices and profit/loss calculations. Dashboard positions are kept in sync by the trade domain's ledger-replay algorithm — never queried or computed on read.

## Key Files
| File | Description |
|------|--------------|
| `controller/DashboardController.kt` | Single REST endpoint (GET /api/v1/dashboard) for dashboard data |
| `service/DashboardService.kt` | Fetches materialized positions, resolves market prices, assembles owner/brokerage/stock DTOs |
| `entity/DashboardPosition.kt` | JPA entity for `dashboard_positions` table; has unique constraint on (owner_id, brokerage_id, stock_id) |
| `dto/DashboardResponseDto.kt` | Top-level response: stock count, owners array, quote fetched time, valuation session |
| `dto/DashboardOwnerResponseDto.kt` | Owner-level aggregation: name, brokerages array, totals |
| `dto/DashboardBrokerageResponseDto.kt` | Brokerage-level aggregation: name/code, stocks array, totals |
| `dto/DashboardStockResponseDto.kt` | Stock-level row: name, code, held quantity, average buy price, market price, evaluated amount, realized/unrealized P&L |
| `repository/DashboardPositionRepository.kt` | Spring Data JPA for basic CRUD (save, delete, saveAll, deleteAllInBatch) |
| `repository/DashboardPositionQuerydslRepository.kt` | QueryDSL for querying materialized positions: findAll (eager-load all relations), find (by replacement keys) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `controller/` | REST endpoint for dashboard data |
| `dto/` | Request/response DTOs (response only; no request DTOs for dashboard read) |
| `entity/` | DashboardPosition JPA entity |
| `repository/` | Data access: Spring Data (basic) + QueryDSL (queries) |
| `service/` | Business logic for assembling dashboard response |

## For AI Agents

### Materialized Positions Table

`DashboardPosition` is a denormalized, write-only table (from the perspective of DashboardService) maintained by `domain/trade` during trade create/update/delete. It stores the "final" state after ledger replay:

- **quantity**: Total shares held (sum of BUY - SELL)
- **totalBuyAmount**: Total cost basis (sum of BUY cost - SELL cost)
- **Unique constraint**: `(owner_id, brokerage_id, stock_id)` — one row per position

**Never update `dashboard_positions` directly.** The trade domain's replay algorithm is the sole writer via `DashboardPositionRepository.replace(...)` pattern (upsert if qty > 0, delete if qty == 0).

### Dashboard Assembly Pipeline

`DashboardService.getDashboard()`:

1. **Fetch materialized positions**: `findAll()` with eager-loaded `owner`, `brokerage`, `stock` relations.
2. **Collect stock codes** from positions, query external market prices: `domesticMarketPriceService.getMarketPrices(...)` returns map of `stockCode → MarketPriceDto`.
3. **Group by owner**: Separate positions into owner buckets.
4. **Assemble per-owner responses**:
   - For each owner, group positions by brokerage ID.
   - For each brokerage, compute totals (`sumOfDecimal { it.totalBuyAmount }`).
   - For each position, build `DashboardStockResponseDto` (joins position + market price).
   - Wrap in `DashboardBrokerageResponseDto`, then `DashboardOwnerResponseDto`.
5. **Compute quotation metadata**: Latest market price timestamp and session (session indicates Korean market opening hours: PRE-OPEN, REGULAR, AFTER-HOUR).

### P&L Calculations (in DashboardStockResponseDto.of)

For each stock position:
- **Evaluated amount** = quantity × market price
- **Unrealized P&L** = evaluated amount − total buy amount
- **Realized P&L** = sum of realized profits from SELL trades (computed during ledger replay)
- **Evaluated yield %** = unrealized P&L ÷ total buy amount

### Working In This Directory

- **Read-only design**: `DashboardService` only reads from `DashboardPosition` and market prices. Never write directly to `DashboardPosition` — the trade domain owns writes.
- **Eager loading**: `findAll()` uses `.fetchJoin()` for `owner`, `brokerage`, `stock` to avoid N+1 queries.
- **Null-safe**: Market price lookups may fail (e.g., delisted stock); `mapNotNull` skips those positions gracefully.
- **Grouping pattern**: Use `.groupBy { it.owner.id }` or `.groupBy { it.brokerage.id }` for hierarchical assembly, not string keys.
- **Sorting**: Brokerages are sorted by name, then code; stocks by name, then code.

### Testing Requirements

Tests live in `src/test/kotlin/kr/byeongmin/stockdaejang/domain/dashboard/`.

- **Integration tests** (`*IntegrationTest.kt`): Use `@Testcontainers` with real Postgres and mock market price service. Verify that dashboard assembly matches expected hierarchy and calculations.
- Run with `./gradlew test --tests "*dashboard*"`.

### Common Patterns

- **DTO of pattern**: `DashboardStockResponseDto.of(position, marketPrice, brokerageTotalBuyAmount)` — encapsulates response construction logic.
- **Distinct aggregation**: Use `.distinctBy { it.id }` to dedup owners (since multiple positions may belong to the same owner).
- **Null-coalescing**: `.orEmpty()` on map lookups to avoid NPE when a position has no corresponding market price.
- **Hierarchical structure**: Always assemble from finest grain (stock) upward (brokerage, owner) to enable per-level aggregation and sorting.

## Dependencies

### Internal
- `domain/trade`: Provides realized profit values on trades; dashboard positions are materialized during trade ledger replay.
- `domain/owner`: Owner entity (via DashboardPosition FK).
- `domain/brokerage`: Brokerage entity (via DashboardPosition FK).
- `domain/stock`: Stock entity (via DashboardPosition FK) and market price service (`DomesticMarketPriceService`).
- `global/response`: SuccessDataResponse envelope.
- `global/util`: sumOfDecimal, ifNullThrow.

### External
- Spring Data JPA, QueryDSL (`JPAQueryFactory`).

<!-- MANUAL: -->
