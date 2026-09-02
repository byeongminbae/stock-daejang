<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# brokerage

## Purpose
Brokerage reference-data domain: maintains a read-only catalog of securities brokerages (code, name) used as a dimension in trades and owner-favorite preferences. Acts as a lookup table for trade entry validation and UI dropdowns.

## Key Files
| File | Description |
|------|--------------|
| `entity/Brokerage.kt` | Brokerage catalog entry (code, name); `code` is a 3-digit string stored as `CHAR` via `@JdbcTypeCode(SqlTypes.CHAR)` (allows leading zeros, e.g., "007") |
| `repository/BrokerageRepository.kt` | Spring Data repository; queries: `findAllByOrderByCodeAsc()`, `findByCode()` |
| `service/BrokerageService.kt` | `getList()` — returns all brokerages sorted by code |
| `controller/BrokerageController.kt` | REST: `GET /api/v1/brokerages` returns list of brokerage DTOs |
| `dto/BrokerageResponseDto.kt` | Output DTO (code, name); maps from `Brokerage` entity |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `controller/` | HTTP layer: returns brokerage list |
| `service/` | Business logic: lookup and formatting |
| `repository/` | Data access: Spring Data repository |
| `entity/` | JPA entity: `Brokerage` |
| `dto/` | Response DTO |

## For AI Agents

### Working In This Directory
- **Repository uses Spring Data derived queries**, consistent with the `owner` domain pattern. Simple code-based lookups are more maintainable than QueryDSL syntax for this reference-data domain.
- **`Brokerage.code` is stored as `CHAR(3)` for a reason**: many brokerage codes in Korea have leading zeros (e.g., "007" for Korea Securities). Storing as `VARCHAR` without the `@JdbcTypeCode` annotation would work but is semantically incorrect. Always preserve the `CHAR` type hint.
- **This domain is read-only from the application's perspective**: the catalog is loaded once at initialization (or periodically refreshed via admin tasks not shown here). No CREATE/UPDATE/DELETE endpoints exist. Treat `Brokerage` as immutable in business logic.
- `@Transactional(readOnly = true)` is appropriate for `BrokerageService.getList()` since only simple materialization occurs (no lazy loading).

### Testing Requirements
- No test directory currently exists for the brokerage domain — tests would live at `backend/src/test/kotlin/kr/byeongmin/stockdaejang/domain/brokerage/`.
- A repository test would verify `findByCode()` returns the correct brokerage or null.
- A service test would mock the repository and verify list ordering.

### Common Patterns
- **Code-based lookup**: `findByCode(code)` is the primary query method; used by `OwnerService.addFavoriteBrokerage()` to resolve a brokerage code into an entity before creating the junction record.
- **List ordering**: `findAllByOrderByCodeAsc()` sorts by code (as strings, so "007" < "032" < "240"); this ordering is stable across paginated UI requests.

## Dependencies

### Internal
- `domain/owner`: `OwnerFavoriteBrokerage` has a `@ManyToOne` reference to `Brokerage`; `OwnerService` calls `BrokerageRepository.findByCode()`.
- `domain/trade`: `Trade` entity has a `@ManyToOne` reference to `Brokerage`.
- `global/error/CommonError`: `RESOURCE_NOT_FOUND` when code is invalid.
- `global/response`: `SuccessDataResponse<T>`.
- `global/entity/Base`: extends to `Brokerage` for audit timestamps.

### External
- Spring Data JPA, springdoc-openapi (Swagger annotations), Jakarta Validation.

<!-- MANUAL: -->
