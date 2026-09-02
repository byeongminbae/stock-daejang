<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# global

## Purpose
Cross-cutting infrastructure: error types and exception handling, response envelopes, base entity with audit timestamps, shared utility functions, and Spring Bean configurations.

## Key Files
| File | Description |
|------|--------------|
| `error/ErrorType.kt` | Interface for error types (statusCode, message, httpStatus) |
| `error/CommonError.kt` | Enum of common errors (INVALID_INPUT_VALUE, NULL_CASTING_ERROR, EXTERNAL_API_ERROR, etc.) |
| `exception/BusinessException.kt` | Thrown for business errors; carries an ErrorType and optional field errors |
| `exception/GlobalExceptionHandler.kt` | @RestControllerAdvice mapping BusinessException, bean-validation failures, type-mismatch, missing params → ErrorResponse |
| `entity/Base.kt` | MappedSuperclass with @CreatedDate/@LastModifiedDate audit columns (createdAt, updatedAt) |
| `response/Response.kt` | Interface: all responses carry `success` and `timestamp` |
| `response/SuccessDataResponse.kt` | Response<T> variant for successful data (carries payload) |
| `response/SuccessResponse.kt` | Response variant for successful non-data operations (e.g. DELETE) |
| `response/ErrorResponse.kt` | Response variant for errors (carries statusCode, message, optional field errors) |
| `util/GlobalExtensions.kt` | Functions: `ifNullThrow()` (null → BusinessException), `isNull()`, `isNotNull()`, `isZero()` (BigDecimal) |
| `util/SeoulZone.kt` | `Asia/Seoul` ZoneId constant for date conversions |
| `validation/PositiveIntegerString.kt` | Custom Jakarta validation annotation for positive integer strings |
| `config/JpaAuditingConfig.kt` | Enables @CreatedDate/@LastModifiedDate via AuditingEntityListener |
| `config/OpenApiConfig.kt` | springdoc-openapi configuration (Swagger UI) |
| `config/QueryDslConfig.kt` | Registers JPAQueryFactory as a Spring Bean |
| `config/RestClientConfig.kt` | Configures RestClient with timeout and error-response handling; turns non-2xx into BusinessException |
| `config/WebConfig.kt` | CORS configuration |
| `repository/BaseJpaRepository.kt` | Base interface for Spring Data repositories (no custom methods) |

## For AI Agents

### Working In This Directory
- Every domain error enum (e.g. `trade.error.TradeError`, `stock.error.StockError`) implements `ErrorType` and is thrown as `BusinessException(errorType)`.
- `GlobalExceptionHandler` is the single catch-all for all exceptions — maps to `ErrorResponse` shape with consistent field errors format.
- `SuccessDataResponse<T>` is the envelope for GET/POST/PUT returning data; `SuccessResponse` is for DELETE or operations with no payload.
- `Base` entity is the parent for all JPA entities — always extend it to get audit timestamps.
- Use `ifNullThrow()` only where an invariant violation (e.g. missing ID after persist) should surface as an error; don't use it for general null-checks.

### Common Patterns
- Query-parameter validation uses Jakarta annotations (@Valid on controller parameters); domain-layer exceptions use ErrorType enums for business-specific errors.
- RestClient is configured once in `RestClientConfig` and wired into domain services; `NaverRestClientConfig` re-wires it with Naver's base URL for the external provider.
- Timestamps in the database are `TIMESTAMPTZ` (UTC); audit columns are `OffsetDateTime`, and day-level user input is anchored to `Asia/Seoul` when converting to ranges.

<!-- MANUAL: -->
