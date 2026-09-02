<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# src/lib

## Purpose
Shared utilities split into root-level files (API contracts, formatting, stock imagery) and server-only utilities (`server/` subfolder) for backend communication. Root files are usable from Client Components; `server/` files use `"use server"` or `"server-only"` guards and must never be imported by Client Components.

## Key Files
| File | Description |
|------|--------------|
| `api-contracts.ts` | Shared TypeScript interfaces: `Brokerage` (code, name), `Owner` (id, name), `MarketSession` enum |
| `format.ts` | Financial formatting (won, decimal, quantity, percent, datetime); used for display across all pages |
| `stock-image.ts` | Naver Finance stock logo URL builder; embeds the stock code into a Naver CDN URL |
| `server/stock-daejang-api.ts` | Server-only functions wrapping the backend API: `listBrokerages`, `listOwners`, `listTradeHistory`, `listPurchasedStocks`, `loadDashboard`, etc.; each returns a Zod-validated type |
| `server/api-gateway.ts` | Backend relay handler; used by `app/api/v1/[...path]/route.ts` to forward Client Component requests to the backend |
| `server/internal-api.ts` | Low-level HTTP client for the internal backend API; handles URL construction, Zod parsing of success envelopes, timeout/retry logic |

## For AI Agents

### Working In This Directory

**Root-level files** (`api-contracts.ts`, `format.ts`, `stock-image.ts`):
- Importable from any component (Client or Server).
- `format.ts` uses `decimal.js` to avoid JavaScript floating-point precision loss on large numbers (e.g. inherited positions with millions of won).
- `api-contracts.ts` holds only types; no validation logic.

**Server-only files** (`server/` subfolder):
- Marked with `"use server"` or `"server-only"` imports; strict isolation from browser code.
- `stock-daejang-api.ts` is the public API: each function calls `getInternalApiData` with a path and Zod schema, returns a parsed+validated result, and throws `InternalApiConfigurationError` if `INTERNAL_API_BASE_URL` is missing.
- `api-gateway.ts` forwards requests from the browser-side relay route; handles missing/misconfigured `INTERNAL_API_BASE_URL` with a 503 error.
- `internal-api.ts` is the foundation: `getInternalApiData` validates `INTERNAL_API_BASE_URL`, constructs the `/api/v1/{path}` URL, makes the request with `ky`, and parses the success envelope with `parseSuccessEnvelope`.

### Testing Requirements
- Unit tests cover `format.ts` (rounding, grouping, null handling), `api-gateway.ts` (URL construction, header forwarding), `internal-api.ts` (URL validation, envelope parsing).
- Run `pnpm test` (vitest) to verify formatting edge cases and gateway/internal-api logic.
- Integration tests in `tests/unit/` use mock Zod schemas to verify that `stock-daejang-api.ts` calls the right paths and applies the right transforms.

### Common Patterns
- Response transformation: `stock-daejang-api.ts` schemas often `.transform()` raw backend responses into frontend shapes (e.g. number IDs become strings, `tradeHistoryRowResponseDtos` becomes `rows`).
- Envelope parsing: all backend responses are wrapped in `{ success: true, data: {...}, timestamp: "..." }` and unwrapped by `parseSuccessEnvelope`.
- Client-side relay: when a Client Component needs to call the backend, it uses `ky` to hit `/api/v1/{path}`, which is forwarded by the relay route to `relayApiRequest`, which constructs the internal URL and forwards with timeout + selective header forwarding.

## Dependencies

### Internal
- No dependencies on `app/` routes or `components/`; used only by them.

### External
- `ky` — HTTP client (used in `api-gateway.ts` and `internal-api.ts` for both server and client relay)
- `zod` — Schema validation (all API responses Zod-validated)
- `decimal.js` — Arbitrary-precision decimal arithmetic (avoids floating-point loss on large numbers)
- `next/server` — `NextResponse` (used in `api-gateway.ts` error responses)

<!-- MANUAL: -->
