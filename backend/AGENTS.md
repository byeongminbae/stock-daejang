<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# backend

## Purpose
Kotlin/Spring Boot API for the stock ledger. Domain-per-package structure under `src/main/kotlin/kr/byeongmin/stockdaejang/domain/`, each following `controller` → `service` → `repository` → `entity`, with request/response shapes in `dto`. Cross-cutting code lives in `global/`. External market-data integration lives in `external/`.

## Key Files
| File | Description |
|------|--------------|
| `build.gradle.kts` | Gradle build config, dependencies (Spring Boot, QueryDSL, Testcontainers, springdoc) |
| `settings.gradle.kts` | Gradle project settings |
| `src/main/kotlin/kr/byeongmin/stockdaejang/StockDaejangApplication.kt` | Spring Boot entrypoint |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/main/kotlin/kr/byeongmin/stockdaejang/domain/` | Business domains: `trade`, `dashboard`, `history`, `stock`, `owner`, `brokerage` (see per-domain `AGENTS.md`) |
| `src/main/kotlin/kr/byeongmin/stockdaejang/global/` | Cross-cutting: error types, exception handling, response envelopes, base entity, shared utils |
| `src/main/kotlin/kr/byeongmin/stockdaejang/external/naver/` | Naver Finance integration (`MarketPriceProvider`/`StockSearchProvider` implementation) |
| `src/main/resources/db/migration/` | Flyway migrations (`V1`...`Vn`, sequential, never edit an applied one) |
| `src/test/kotlin/kr/byeongmin/stockdaejang/` | Tests, mirroring the main package structure; integration tests use `@Testcontainers` |

## For AI Agents

### Working In This Directory
- Repositories are QueryDSL (`JPAQueryFactory`), not Spring Data derived repositories — dynamic filters use `BooleanBuilder` or, preferably, a `Predicate?` vararg passed to `.where(...)` (QueryDSL ignores `null` entries). The `owner` and `brokerage` domains are established exceptions using simple Spring Data derived-query repositories.
- Entities extend `global.entity.Base` (adds `createdAt`/`updatedAt`) and use `@ManyToOne(fetch = FetchType.LAZY, optional = false)` + `@JoinColumn` for relations — not raw foreign-key `Long` fields.
- Throw `BusinessException(errorType)` for business errors; `global.exception.GlobalExceptionHandler` maps it (and bean-validation/type-mismatch failures) to a single `ErrorResponse` shape.
- Every endpoint returns `Response` — `SuccessDataResponse<T>` or `SuccessResponse`.
- `@Transactional` is required whenever a service method accesses a lazy-loaded association after the initiating query returns (else `LazyInitializationException`); it's optional for a single trivial repository call with no lazy relations, but conventionally kept on multi-step write methods.
- Postgres columns are `TIMESTAMPTZ`; use `OffsetDateTime`/`Instant`, not `LocalDateTime`. Day-level user input (e.g. history date filters) is anchored to `Asia/Seoul` when converting to an instant range.

### Testing Requirements
- `./gradlew test` runs everything; integration tests (`*IntegrationTest.kt`) need Docker (Testcontainers spins up `postgres:17-alpine`).
- `./gradlew test --tests "kr.byeongmin.stockdaejang.domain.history.HistoryRequestDtoTest"` to run a single class.
- `./gradlew compileKotlin --no-daemon -q` to compile-check without running tests (useful when no local JDK is available — run inside a `eclipse-temurin:25-jdk-alpine` container).

### Common Patterns
- Query-parameter DTOs bound via `@ParameterObject` follow a two-DTO convention: a `Get*RequestDto` holds raw bound values (`@Valid` at the controller boundary) and exposes a `to*Dto()` that trims/defaults/converts into a fully-normalized DTO used by the service layer. See `domain/history` for the reference example.
- `global.util.ifNullThrow()` turns an unexpected null into `BusinessException(CommonError.NULL_CASTING_ERROR)` — used where a value must be present by invariant (e.g. an ID after persist), not as a general null-check-and-throw.

## Dependencies

### Internal
- `domain/trade` is the most structurally involved domain — see `domain/trade/AGENTS.md` for the ledger-replay algorithm.

### External
- Spring Boot, Spring Data JPA, QueryDSL (`JPAQueryFactory`), Flyway, springdoc-openapi, Testcontainers (test scope), Naver Finance (via `RestClient`, external market data).

<!-- MANUAL: -->
