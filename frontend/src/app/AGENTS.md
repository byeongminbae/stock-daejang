<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# src/app

## Purpose
Next.js App Router pages and the backend API relay route. All route files are Server Components that fetch data directly from the backend via `lib/server/stock-daejang-api.ts`. Client Components that need to call the API go through the catch-all relay at `api/v1/[...path]/` since they cannot reach `INTERNAL_API_BASE_URL` from the browser.

## Key Files
| File | Description |
|------|--------------|
| `layout.tsx` | Root layout with `<html>`, `<body>`, `AppHeader`, metadata, and viewport config; includes development tools (react-scan, react-grab) in dev mode |
| `page.tsx` | Dashboard (home route `/`): fetches `DashboardView`, respects `SHOW_BROKERAGE_TOTALS_COOKIE` for broker-totals toggle, includes dev preview at `/?preview=components` |
| `error.tsx` | Error boundary (Client Component) for dashboard load failures; offers a retry button |
| `loading.tsx` | Loading skeleton for dashboard, spans multiple owner rows with skeleton placeholders |
| `globals.css` | Global styles for the app (page frame, button, status messages, etc.) |
| `api/v1/[...path]/route.ts` | Catch-all relay route; forwards `GET`/`POST`/`PUT`/`PATCH`/`DELETE` to backend via `lib/server/api-gateway.ts` |

## Subdirectories
| Route | Path | Purpose |
|-------|------|---------|
| Dashboard | `/` | Portfolio holdings by owner/brokerage/security; shows cash positions, unrealized gains/losses |
| Record | `/record` | Dual-form entry: BUY and SELL trade inputs side-by-side; creates trades and resets forms post-submit |
| Buy History | `/buy-history` | Filterable list of BUY trades by date range, stock, owner, brokerage; paginated results |
| Sell History | `/sell-history` | Filterable list of SELL trades by date range, stock, owner, brokerage; paginated results; includes realized profit |
| Settings | `/settings` | Favorite brokerages per owner; real-time commit UX (optimistic mutations, rollback on failure) |

## For AI Agents

### Working In This Directory
- Every page is a Server Component that calls `lib/server/stock-daejang-api.ts` directly; avoid `useEffect` data-fetching patterns.
- Search parameter access: use `searchParams: Promise<Record<...>>` in page props and `await searchParams` before reading.
- Use `export const dynamic = "force-dynamic"` and `export const fetchCache = "force-no-store"` on pages that need fresh data on every request (history filters, record form, settings).
- The relay route in `api/v1/[...path]/` accepts any method and forwards request headers (`accept`, `content-type`) and search params to the backend; used by Client Components that cannot import server-only code.

### Testing Requirements
- History and record pages rely on `listTradeHistory`, `listBrokerages`, `listOwners`, and `listPurchasedStocks` to be available and well-formed (Zod-validated in `lib/server/stock-daejang-api.ts`).
- Dashboard requires `loadDashboard` and cookie reading to work; test with `docker compose up -d db backend` running.
- E2E tests (Playwright) verify form entry, autocomplete, filtering, deletion flows across all routes; run with `PLAYWRIGHT_BASE_URL` set and `pnpm test:e2e`.

### Common Patterns
- Loading states: use `<Suspense>` with fallback elements for filter components and pagination controls; avoid loading skeletons for form inputs (they are instant).
- Pagination: `HistoryPagination` is Suspense-wrapped to allow fast paint of the history list before pagination controls arrive.
- Combobox inputs (`StockCombobox`, `BrokerageCombobox`, `OwnerCombobox`) are Client Components wrapped in Server Component pages; they fetch via the relay route.

## Dependencies

### Internal
- `lib/server/stock-daejang-api.ts` — Server-only functions to fetch brokerages, owners, history, dashboard data
- `lib/server/api-gateway.ts` — Backend relay (used by the relay route)
- `components/` — All page content (dashboard, trades, settings views)

### External
- Next.js App Router, React `Suspense`

<!-- MANUAL: -->
