<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# external/naver

## Purpose
Naver Finance integration. Implements `domain/stock/provider`'s `MarketPriceProvider` and `StockSearchProvider` ports. Fetches live market prices and performs stock name search via Naver Finance's public API. Note: `external/` itself contains only `naver/`; this file documents `external/` as a whole.

## Key Files
| File | Description |
|------|--------------|
| `provider/NaverStockProvider.kt` | Implements MarketPriceProvider/StockSearchProvider; calls Naver API endpoints (`/search`, `/realTime/marketPrice`) |
| `config/NaverRestClientConfig.kt` | Configures RestClient bean with Naver's base URL from `application.yaml` |
| `dto/NaverMarketPriceResponseDto.kt` | Response shape from `/realTime/marketPrice` endpoint |
| `dto/NaverSearchResponseDto.kt` | Response shape from `/search` endpoint |
| `dto/StockSearchResultDto.kt` | Normalized search result (parsed from Naver's structure) |
| `dto/MarketPriceSnapshotDto.kt` | Normalized market price snapshot (parsed from Naver's structure) |

## For AI Agents

### Working In This Directory
- `NaverStockProvider` wraps Naver API calls (search, market prices) and turns non-success or exceptions into `BusinessException(CommonError.EXTERNAL_API_ERROR)`.
- `RestClient` is configured in `global.config.RestClientConfig` (handles timeouts, logging with redacted headers); `NaverRestClientConfig` wires it to this provider's base URL.
- DTOs in `dto/` are normalized shapes used by the service layer; they map Naver's response structures to domain concepts.

### Common Patterns
- `maxBatchSize: Int = 50` in `NaverStockProvider` — split large stock-code lists at this boundary before calling the API.
- Query parameters are built via `UriBuilder.path(...).queryParam(...).build()` fluent style.
- Error handling: any exception or non-2xx response triggers `BusinessException(CommonError.EXTERNAL_API_ERROR)` and is logged.

<!-- MANUAL: -->
