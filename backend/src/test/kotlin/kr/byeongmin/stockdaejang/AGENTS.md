<!-- Parent: ../../../../../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# Tests

## Purpose
Comprehensive test suite for the backend. Integration tests use `@Testcontainers` with a real `postgres:17-alpine` container (requires Docker). Test structure mirrors the main package.

## Key Test Files
| Test Class | Type | Purpose |
|-----------|------|---------|
| `StockDaejangApplicationTests.kt` | Integration | Verifies all public API endpoints are documented in OpenAPI (Swagger) with examples and descriptions; asserts schema contracts (e.g. field names, types, nullability) |
| `FlywayLegacyMigrationTest.kt` | Integration | Validates Flyway migration versioning and idempotency |
| `support/QueryDslTestData.kt` | Utility | Shared test data builders for QueryDSL assertions |
| `domain/trade/service/TradeServiceIntegrationTest.kt` | Integration | Trade CRUD, ledger replay, concurrent writes with pessimistic locking |
| `domain/trade/service/TradeLedgerManagerTest.kt` | Unit | Ledger state calculation and replay logic |
| `domain/trade/service/LedgerReplayCalculatorTest.kt` | Unit | Replay calculator for realized-profit computation |
| `domain/dashboard/service/DashboardServiceTest.kt` | Unit | Dashboard aggregation service |
| `domain/dashboard/controller/DashboardControllerTest.kt` | Integration | Dashboard endpoint contracts |
| `domain/history/GetHistoryRequestDtoTest.kt` | Unit | Query-parameter DTO validation and normalization |
| `domain/history/repository/HistoryQuerydslRepositoryIntegrationTest.kt` | Integration | Trade history queries with filters |
| `domain/stock/service/StockServiceTest.kt` | Unit | Stock catalog service |
| `domain/stock/service/DomesticMarketPriceServiceTest.kt` | Unit | Market price fetching and snapshot updates |
| `domain/stock/controller/StockControllerTest.kt` | Integration | Stock search and detail endpoints |
| `external/naver/NaverStockProviderTest.kt` | Unit | Naver API provider (search, market prices) |
| `global/exception/GlobalExceptionHandlerTest.kt` | Unit | Exception mapping to ErrorResponse |
| `global/config/OpenApiConfigTest.kt` | Unit | OpenAPI (Swagger) configuration |
| `global/config/RestClientConfigTest.kt` | Unit | RestClient error handling |
| `global/util/GlobalExtensionsTest.kt` | Unit | Global utility functions (ifNullThrow, isNull, etc.) |

## For AI Agents

### Running Tests
- `./gradlew test` — run all tests (integration tests need Docker and Testcontainers).
- `./gradlew test --tests "kr.byeongmin.stockdaejang.domain.history.GetHistoryRequestDtoTest"` — run a single class.
- `./gradlew test --tests "*.HistoryRequestDtoTest.*"` — run tests matching a pattern (use with caution; pattern matching can be unintuitive).

### Integration Test Setup
- Integration tests are annotated with `@Testcontainers` and `@SpringBootTest`.
- `StockDaejangApplicationTests.kt` declares a static `@Container @ServiceConnection PostgreSQLContainer("postgres:17-alpine")`.
- Flyway migrations run automatically before each integration test (via `spring.flyway.enabled: true`).
- Database state is not cleaned between tests — write `INSERT` and `DELETE` statements (or use `@Transactional` with `ROLLBACK` isolation) for test isolation if needed.

### Common Patterns
- Mock `RestClient` for external provider tests using Mockito/MockK.
- Use `QueryDslTestData` to build test fixtures for QueryDSL repository tests.
- `StockDaejangApplicationTests` verifies API contracts (OpenAPI schema completeness, field presence, nullable/non-nullable consistency) — this is the source of truth for public API shape.

<!-- MANUAL: -->
