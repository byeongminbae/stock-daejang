<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# stock

## Purpose
Stock catalog and market-data integration: maintains a materialized `stocks` table (stock code, name, market, ETF flag) and integrates with external providers (currently Naver Finance) for stock search and live market prices. Market-session types (`MarketSession`, `DomesticMarketSession`) model intraday trading periods.

## Key Files
| File | Description |
|------|--------------|
| `entity/Stock.kt` | Stock catalog entry (stockCode, stockName, market, isEtf); `market` and `isEtf` are frozen at creation (see CLAUDE.md "Frozen catalog fields") |
| `entity/StockCatalogLock.kt` | Pessimistic-lock sentinel for catalog updates; uses enum-keyed primary key `StockCatalogLockName` |
| `repository/StockRepository.kt` | Spring Data repository; queries: `findByStockCode()`, `findAllByStockCodeIn()` |
| `repository/StockCatalogQuerydslRepository.kt` | QueryDSL repository for locking the catalog lock row with `PESSIMISTIC_WRITE` before bulk refresh |
| `provider/ExternalStockProvider.kt` | Port interface defining contract for external market-data providers; methods: `searchStock()`, `getMarketPrices()`, `maxBatchSize` property |
| `service/StockService.kt` | `searchStocks()` — delegates to external provider, filters domestic stocks, returns DTOs |
| `service/DomesticMarketPriceService.kt` | `getMarketPrices()` — chunks stock codes by provider batch size, aggregates prices into a map |
| `controller/StockController.kt` | REST: `GET /api/v1/stocks` with `@ParameterObject GetStockSearchRequestDto` |
| `types/MarketSession.kt` | Marker interface with `ordinal` property for market-session hierarchy |
| `types/DomesticMarketSession.kt` | Enum: `PREOPEN`, `PRE_MARKET`, `REGULAR_MARKET`, `AFTER_MARKET` |
| `types/StockCatalogLockName.kt` | Enum with single entry `CATALOG`; used as primary key of `StockCatalogLock` |
| DTOs: `GetStockSearchRequestDto.kt`, `StockSearchItemResponseDto.kt`, `MarketPriceDto.kt`, `MarketStockCodesDto.kt` | Request/response shapes for stock search and price lookups |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `controller/` | HTTP layer: bind query parameters, call service |
| `service/` | Business logic: search coordination, market-price fetching and chunking |
| `repository/` | Data access: Spring Data for stock catalog, QueryDSL for locking |
| `entity/` | JPA entities: stock catalog, internal lock sentinel |
| `provider/` | Port interface for external market-data integration |
| `dto/` | Request/response DTOs, internal price/search result shapes |
| `types/` | Enums and marker interfaces for market sessions and lock names |

## For AI Agents

### Working In This Directory
- **`Stock` entity fields are frozen at creation**: `market` and `isEtf` are set once and never updated by trade-entry or price-refresh requests. Validation that a trade's stock code matches the expected market/ETF-status happens at trade-creation time; catalog never auto-corrects based on live data.
- **`StockCatalogQuerydslRepository.lockByName()`** is used to acquire a `PESSIMISTIC_WRITE` lock on the catalog lock row before bulk refreshing stock metadata — this serializes concurrent refresh attempts and prevents lost-update races. The lock is held only for the duration of the refresh transaction.
- **`ExternalStockProvider` is the port**: `external/naver/NaverStockProvider` is the sole current implementation. New providers (e.g., Korea Investment & Securities API) would implement this interface and be registered as a Spring bean. The service layer is agnostic to the implementation.
- **`DomesticMarketPriceService.getMarketPrices()`** automatically chunks stock codes by `provider.maxBatchSize` to respect external API rate limits and request-size constraints.
- **Query-parameter DTOs follow the two-DTO convention**: `GetStockSearchRequestDto` (raw bound input, `@Valid`-checked at controller boundary) exposes a `toDto()` or fields accessed directly to normalize the value before passing to service layer.

### Testing Requirements
- Tests live at `backend/src/test/kotlin/kr/byeongmin/stockdaejang/domain/stock/`:
  - `controller/StockControllerTest.kt` — mocks `StockService`
  - `service/StockServiceTest.kt` — mocks `ExternalStockProvider`, validates filtering and DTO mapping
  - `service/DomesticMarketPriceServiceTest.kt` — tests chunking logic, empty-list handling, batch-size validation
- Integration tests for catalog refresh would test `StockRepository` and `StockCatalogQuerydslRepository` with `@Testcontainers`.
- Run with `./gradlew test --tests "kr.byeongmin.stockdaejang.domain.stock.*Test"`.

### Common Patterns
- **Search filtering**: `externalStockProvider.searchStock()` returns results from Naver; filter with `.filter { it.isDomesticStock() }` before mapping to response DTOs.
- **Batch price fetch**: chunk stock codes into groups of `provider.maxBatchSize`, call provider for each chunk, aggregate results into a single map keyed by stock code.
- **Sanity checks**: `DomesticMarketPriceService` validates that stock-code list is not empty and that `maxBatchSize > 0` before making external calls.

## Dependencies

### Internal
- `domain/common/validation`: `@StockCode` constraint (pattern `^[0-9A-Z]{6}$`) decorates stock-code fields.
- `global/error/CommonError`: `EXTERNAL_API_ERROR` for provider failures (mapped by `RestClientConfig`), `INTERNAL_SERVER_ERROR` for sanity-check failures.
- `global/response`: `SuccessDataResponse<T>`.
- `global/entity/Base`: extends to `Stock` for audit timestamps.

### External
- `external/naver/`: `NaverStockProvider` (implementation of `ExternalStockProvider`), DTOs for Naver API responses.
- Spring Data JPA, QueryDSL (`JPAQueryFactory`), Jakarta Validation, springdoc-openapi.
- External: Naver Finance API (via `RestClient` in `external/naver/config/NaverRestClientConfig.kt`).

<!-- MANUAL: -->
