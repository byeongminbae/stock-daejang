<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# trade

## Purpose
Core domain managing buy/sell trade records and the ledger-replay algorithm that maintains materialized `dashboard_positions` and computes realized profit on each SELL trade. Every trade creation/update/delete triggers a replay of affected ledgers to ensure positions and profit calculations stay consistent.

## Key Files
| File | Description |
|------|--------------|
| `controller/TradeController.kt` | REST endpoints for create/update/delete trades and preview (POST, PUT, DELETE, POST /preview) |
| `controller/PositionController.kt` | REST endpoints for current position queries (average buy price, held quantity) |
| `service/TradeService.kt` | Core business logic: upsert stock catalog, replay trades, update dashboard positions |
| `service/PositionService.kt` | Position averaging and snapshot queries |
| `entity/Trade.kt` | Persisted trade entity with realized profit + remaining quantity/cost snapshots |
| `dto/CreateTradeRequestDto.kt` | Request DTO for creating a trade (owner, brokerage, stock, side, quantity, unit price, executedAt) |
| `dto/UpdateTradeRequestDto.kt` | Request DTO for updating a trade |
| `dto/DeleteTradesRequestDto.kt` | Request DTO for batch deleting trades by ID |
| `dto/TradePreviewRequestDto.kt` | Request DTO for previewing expected profit before committing a trade |
| `dto/TradePreviewResponseDto.kt` | Response DTO showing amount, held quantity, average buy price, expected profit |
| `dto/PositionEntityDto.kt` | Internal DTO combining owner/brokerage/stock entity references |
| `dto/PositionKeyDto.kt` | Composite key: ownerId + brokerageId + stockCode (used for grouping ledgers) |
| `dto/PositionKeyAtDto.kt` | PositionKeyDto + executedAt (marks replay boundary) |
| `dto/PositionSnapshot.kt` | Immutable state: remaining quantity + remaining cost basis (used during replay) |
| `dto/PositionAverageResponseDto.kt` | Response DTO for current average buy price and held quantity |
| `repository/TradeRepository.kt` | Spring Data JPA for basic CRUD |
| `repository/TradeQuerydslRepository.kt` | QueryDSL for complex filtering: lock trades/stocks, find trades by position key before/from timestamp |
| `types/TradeType.kt` | Enum (BUY/SELL) with `apply(trade, snapshot) → PositionSnapshot` logic |
| `types/TradeErrorType.kt` | Business error codes (INSUFFICIENT_HOLDING) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `controller/` | REST endpoints (TradeController, PositionController) |
| `dto/` | Request/response DTOs + internal data shapes (PositionSnapshot, PositionKeyDto, etc.) |
| `entity/` | JPA entity (Trade) with replay/snapshot fields |
| `repository/` | Data access: Spring Data (TradeRepository) + QueryDSL (TradeQuerydslRepository) |
| `service/` | Business logic (TradeService for ledger replay, PositionService for snapshots) |
| `types/` | Enums and error codes (TradeType, TradeErrorType) |

## For AI Agents

### Ledger-Replay Algorithm

When a trade is created/updated/deleted, `TradeService.replayTrades(positionKeyAtDtos)` executes this sequence:

1. **Lock Phase**: `TradeQuerydslRepository.lockAllStockByStockCodes(...)` acquires `PESSIMISTIC_WRITE` locks on affected securities rows (sorted by stock code to prevent circular deadlocks).

2. **Base State**: `findPositionTradesBefore(positionKeyAtDtos)` fetches all trades *before* `executedAt` for each affected position key. `PositionSnapshot.from(trade)` reads the latest trade's `remainingQuantitySnapshot`/`remainingCostSnapshot` fields directly — no need to recalculate earlier trades.

3. **Replay Loop**: `findPositionTradesFrom(positionKeyAtDtos)` fetches trades from `executedAt` onward. For each trade:
   - Call `trade.replay(accumulatedSnapshot)` which delegates to `TradeType.apply(trade, snapshot)`.
   - **BUY**: adds `quantity × unitPrice` to remaining cost, adds quantity to remaining quantity.
   - **SELL**: calls `trade.updateSellTrade(accumulatedSnapshot)` to compute `realizedProfit = soldAmount - weightedAverageCost`, then reduces both quantity and cost by the sold amount.
   - Update trade's `remainingQuantitySnapshot` and `remainingCostSnapshot` fields.

4. **Dashboard Update**: `DashboardPositionReplacement` records the final position state (quantity + totalBuyAmount). `updateDashboardPositions(...)` performs upsert-or-delete: if quantity is zero, delete the position; if it exists, update quantity/totalBuyAmount; if new, insert.

### Weighted-Average Cost Accounting

When selling shares, the cost basis of the sold quantity is computed as:
```
boughtCostFor(quantity) = remainingCostSnapshot × (quantity / remainingQuantitySnapshot)
```

This assumes all buys are pooled and shares are indivisible by source — FIFO would require tracking individual buy batches, which the current design avoids.

### Update/Delete Edge Cases

- **Update**: Builds `PositionEntityDto` for both the old position key (before) and new position key (after). `getEarliestByPositionKey(...)` collapses these: if the same position is affected twice, uses the earliest `executedAt` to replay from.
- **Delete**: Determines affected position keys from deleted trades, then replays each ledger from the earliest trade's `executedAt`.

### Working In This Directory

- **Trade.replay(snapshot)**: Delegates to `TradeType.apply(...)` — never call `updateSellTrade` directly, it's internal to SELL.
- **Locks**: Always lock stocks before querying/updating trades. Order locks by stock code (ascending) to prevent deadlocks across concurrent transactions.
- **Snapshots**: `PositionSnapshot` is immutable; always construct a new one when accumulating state.
- **Test predicates**: Favor `Predicate?` vararg in repository methods over `BooleanBuilder` — cleaner code, QueryDSL ignores `null`.

### Testing Requirements

Tests live in `src/test/kotlin/kr/byeongmin/stockdaejang/domain/trade/`.

- **Unit tests** (`*Test.kt`): Fast, in-memory, test DTOs/enums/logic.
- **Integration tests** (`*IntegrationTest.kt`): Use `@Testcontainers` with real Postgres; test the replay algorithm end-to-end (create trade → verify dashboard position → verify realized profit on SELL).

Run with `./gradlew test --tests "*trade*"` or `./gradlew test --tests "*.TradeServiceIntegrationTest"`.

### Common Patterns

- **PositionEntityDto**: Groups owner + brokerage + stock + executedAt as a transient data structure.
- **PositionKeyDto**: Composite key (ownerId, brokerageId, stockCode) used for grouping/matching ledgers.
- **PositionKeyAtDto**: PositionKeyDto + executedAt; marks the replay boundary when multiple changes affect the same position.
- **Position snapshot reading**: Always read snapshots from the latest trade's `remainingQuantitySnapshot`/`remainingCostSnapshot` fields — never recompute by folding older trades.
- **Batch operations**: When multiple trades are affected (e.g., update to a different position key), use `getEarliestByPositionKey(...)` to fold into a single replay per position.

## Dependencies

### Internal
- `domain/brokerage`: Brokerage entity and repository (to resolve brokerage by code).
- `domain/owner`: Owner entity and repository (to validate owner ID).
- `domain/stock`: Stock catalog (read-only via StockCatalogQuerydslRepository); `market`/`isEtf` set at creation and frozen (never updated by trade create/update).
- `domain/dashboard`: DashboardPosition entity/repository — trade replay writes materialized positions here.
- `global/error`: CommonError, BusinessException, and per-domain TradeErrorType.
- `global/response`: SuccessDataResponse/SuccessResponse envelopes.
- `global/util`: ifNullThrow, isZero, etc.

### External
- Spring Data JPA, QueryDSL (`JPAQueryFactory`), Jakarta Persistence annotations.

<!-- MANUAL: -->
