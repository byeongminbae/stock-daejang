<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# history

## Purpose
Provides paginated, filterable views of trade history and stock status. Encapsulates QueryDSL filtering logic and handles request parameter normalization via the two-DTO convention (raw request DTO → normalized service DTO).

## Key Files
| File | Description |
|------|--------------|
| `controller/TradeHistoryController.kt` | REST endpoint (GET /api/v1/history/trades) for trade history with filters and pagination |
| `controller/StockHistoryController.kt` | REST endpoint (GET /api/v1/history/stocks) for stock history and status queries |
| `service/TradeHistoryService.kt` | Handles pagination logic, delegates filtering to HistoryQuerydslRepository, maps Trade entities to response DTOs |
| `service/StockHistoryService.kt` | Fetches traded stocks and their status (last transaction details) |
| `dto/GetHistoryRequestDto.kt` | Request DTO with bound query parameters; validates and provides filter state helpers |
| `dto/TradeHistoryResponseDto.kt` | Response DTO: array of trade rows, count, totalCount, currentPage, totalPages, hasFilters flag |
| `dto/TradeHistoryRowResponseDto.kt` | Individual trade row in response: ID, executed at, side, quantity, unit price, amount, stock name/code, owner name, brokerage name/code, realized profit |
| `dto/StockStatusResponseDto.kt` | Individual stock status: name, code, market, last trade details (side, price, quantity, executed at) |
| `repository/HistoryQuerydslRepository.kt` | QueryDSL repository with `count()`, `findPage()`, and `findTradedStocks()` methods using `Predicate?` vararg pattern |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `controller/` | REST endpoints (TradeHistoryController, StockHistoryController) |
| `dto/` | Request/response DTOs |
| `repository/` | QueryDSL data access layer |
| `service/` | Business logic for pagination and filtering |

## For AI Agents

### Two-DTO Convention

`GetHistoryRequestDto` demonstrates the two-DTO pattern cited in CLAUDE.md:

1. **Binding DTO**: `GetHistoryRequestDto` is bound directly from `@ParameterObject` query parameters via Jakarta validation (`@Positive`, `@Size`, `@BrokerageCode`). Raw values are stored as-is (e.g., `stockNameOrCode` may be null or a 120-char string).

2. **Normalized fields**: The DTO itself exposes normalized values used by the service layer:
   - `side: TradeType` (bound from enum string)
   - `stockNameOrCode: String?` (trimmed, size-validated)
   - `from` / `to: OffsetDateTime?` (already parsed by Jackson; day-level user input is anchored to `Asia/Seoul`)
   - `ownerId: Long?` (positive or null)
   - `brokerageCode: String?` (@BrokerageCode-validated)
   - `page: Int` (positive, coerced to valid range in service)
   - `pageSize: Int` (positive, typically capped)

3. **No explicit to*Dto()**: Unlike trade/dashboard domains, history does not split into separate `Get*RequestDto` and `*FilterDto` classes — the single DTO serves both roles. The `hasFilters()` helper indicates whether any optional filters are set.

### Filtering with Predicate? Vararg Pattern

`HistoryQuerydslRepository.predicates(...)` returns `Array<Predicate?>`:

```kotlin
private fun predicates(...): Array<Predicate?> {
    return arrayOf(
        trade.side.eq(side),                              // always required
        stockNameOrCode?.let { ... },                     // null → skipped by QueryDSL
        from?.let { trade.executedAt.goe(it) },          // null → skipped
        to?.let { trade.executedAt.lt(it) },             // null → skipped
        ownerId?.let { owner.id.eq(it) },                // null → skipped
        brokerageCode?.let { brokerage.code.eq(it) },    // null → skipped
    )
}
```

This is cleaner than `BooleanBuilder` — QueryDSL's `.where(vararg)` automatically ignores `null` predicates, and each filter is a single, readable line.

### Pagination Logic

`TradeHistoryService.getTradeHistoryPages(...)`:

1. Calculate total pages: `ceil(filteredTradeCount / pageSize).toInt()`, minimum 1.
2. Coerce requested page to valid range: `page.coerceIn(1, totalPageCount)`.
3. Build `PageRequest.of(currentPage - 1, pageSize)` (Spring's 0-indexed pagination).
4. Query and return `PageImpl(content, pageable, totalCount)`.

### Eager Loading

Both `count()` and `findPage()` join `owner`, `stock`, `brokerage` explicitly:
- `count()` does NOT fetch (just counts).
- `findPage()` uses `.fetchJoin()` to avoid N+1 queries when building response DTOs.

### Working In This Directory

- **Filter construction**: Use `?.let { predicate }` to conditionally build filters — null-safe, concise.
- **Predicate array order**: Start with required filters (e.g., side), then optional ones. The order doesn't affect execution but improves readability.
- **Pagination coercion**: Always coerce the user's requested page to the valid range — invalid pages silently clamp rather than throw.
- **Response DTO assembly**: `TradeHistoryRowResponseDto.from(trade)` encapsulates entity-to-DTO mapping; the service layer never manually extracts nested fields.
- **Stock search**: `findTradedStocks(tradeType)` returns distinct stocks sorted by name then code — used for autocomplete or filter option lists.

### Testing Requirements

Tests live in `src/test/kotlin/kr/byeongmin/stockdaejang/domain/history/`.

- **Unit tests** (`*Test.kt`): Test DTO validation (e.g., `HistoryRequestDtoTest` for boundary cases on `@Positive`, `@Size`, page coercion).
- **Integration tests** (`*IntegrationTest.kt`): Use `@Testcontainers` with real Postgres. Test filtering combinations (stock name/code, date range, owner/brokerage) and pagination edge cases.
- Run with `./gradlew test --tests "*history*"` or `./gradlew test --tests "*.TradeHistoryServiceIntegrationTest"`.

### Common Patterns

- **Optional filter fields**: All search filters are nullable in the request DTO; service/repository handle null gracefully.
- **Date range semantics**: `from` (inclusive) + `to` (exclusive) define a half-open interval `[from, to)`, consistent with typical pagination patterns.
- **Sorting**: Trade history is always ordered by `executedAt DESC, id DESC` — newest first, with ID as tiebreaker for same-microsecond trades (rare but possible).
- **Filter flags**: `hasFilters()` returns true if any optional filter is set; used by the frontend to show/hide filter UI.
- **Distinct stocks**: `findTradedStocks()` uses `.distinct()` to dedup stocks with multiple trades; sorted by name, then code for UI consistency.

## Dependencies

### Internal
- `domain/trade`: Trade entity (read-only, via HistoryQuerydslRepository).
- `domain/stock`: Stock entity (read-only, for name/code/market display).
- `domain/owner`: Owner entity (read-only, for name display).
- `domain/brokerage`: Brokerage entity (read-only, for name/code display).
- `global/response`: SuccessDataResponse envelope.

### External
- Spring Data JPA (Pageable, PageImpl), QueryDSL (`JPAQueryFactory`, `Predicate`), Jakarta validation.

<!-- MANUAL: -->
