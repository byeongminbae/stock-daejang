<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# common

## Purpose
Shared validation annotations and utility functions used across domains: custom Jakarta validation constraints (`@BrokerageCode`, `@StockCode`) and `BigDecimal` arithmetic helpers with consistent rounding semantics for financial calculations.

## Key Files
| File | Description |
|------|--------------|
| `validation/BrokerageCode.kt` | Jakarta validation constraint for 3-digit brokerage codes; pattern `^[0-9]{3}$` |
| `validation/StockCode.kt` | Jakarta validation constraint for 6-character stock codes; pattern `^[0-9A-Z]{6}$` |
| `util/BigDecimalExtensions.kt` | Extension functions for precise decimal arithmetic: `sumOfDecimal()`, `multiplyRounded()`, `subtractRounded()`, `divideRounded()`, `divideRoundHalfUp()`, `zeroOr()` |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `validation/` | Custom Jakarta `@Constraint` annotations for domain-specific input validation |
| `util/` | Extension functions and constants for shared business logic |

## For AI Agents

### Working In This Directory
- **Validation annotations are declarative**: `@BrokerageCode` and `@StockCode` use `@Pattern` under the hood. Apply them to entity and DTO fields; Jakarta's `@Valid` at the controller boundary automatically enforces them. No custom `Validator` class is needed.
- **`MONEY_MATH_CONTEXT`** is a shared `MathContext(40, RoundingMode.HALF_UP)` for all financial calculations. This ensures consistent precision and rounding across the ledger-replay algorithm, position calculations, and cost-basis adjustments. **Never use bare `BigDecimal` arithmetic**; always call the extension functions (e.g., `multiplyRounded()`, `divideRoundHalfUp()`).
- **`divideRoundHalfUp()` guards against division by zero**: throws `BusinessException(CommonError.INTERNAL_SERVER_ERROR)` if divisor is non-positive; use it for weighted-average cost calculations where the denominator must be strictly positive.
- **`zeroOr(value)`** is a conditional helper: returns `BigDecimal.ZERO` if the receiver is zero, else returns the provided value. Used to simplify cost-basis logic in `LedgerReplayCalculator`.
- **`sumOfDecimal()` with selector** replaces manual fold loops for aggregating decimal fields from a collection, ensuring rounding consistency across all additions.

### Testing Requirements
- No test directory currently exists for the common domain — unit tests would live at `backend/src/test/kotlin/kr/byeongmin/stockdaejang/domain/common/`.
- Validation annotation tests would apply them to a test DTO and use `@SpringBootTest` or plain Jakarta validation testing to verify pattern matching.
- Extension-function tests would verify rounding behavior (e.g., `3.3 * 2 = 6.6`, not `6.6000...` or truncation), zero-handling, and division-by-zero guards.

### Common Patterns
- **In entity/DTO fields**: decorate brokerage-code strings with `@BrokerageCode`, stock-code strings with `@StockCode` to ensure they match their expected patterns at bind time.
- **In ledger calculations**: use `qty.multiplyRounded(price)` for cost, `totalCost.divideRoundHalfUp(remainingQty)` for weighted-average cost per share.
- **Summing costs or quantities**: prefer `ledgerEntries.sumOfDecimal { it.costBasis }` over explicit `fold()` to keep the rounding context consistent.

## Dependencies

### Internal
- `global/error/CommonError`: validation annotations and extension functions do not directly depend on error types, but `divideRoundHalfUp()` and error-checking logic throw `BusinessException(CommonError.INTERNAL_SERVER_ERROR)`.
- `global/exception/BusinessException`: thrown by error-checking extension functions.
- Used by: `domain/trade` (ledger calculations), `domain/history` (response DTOs), `domain/dashboard` (position aggregation), `domain/stock` (stock-code patterns).

### External
- Jakarta Validation API (`@Constraint`, `@Pattern`).
- Java `java.math.BigDecimal`, `java.math.MathContext`, `java.math.RoundingMode`.

<!-- MANUAL: -->
