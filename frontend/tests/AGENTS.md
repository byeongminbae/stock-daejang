<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# tests

## Purpose
Unit tests (vitest) and end-to-end tests (Playwright) covering utility logic, data transformation, API relay, and full UI flows. A small number of E2E specs predate a UI refactor and are known to be stale/broken.

## Key Files
| File | Description |
|------|--------------|
| `unit/format.test.ts` | Vitest: large number formatting, rounding, null handling, profit labeling |
| `unit/dashboard-*.test.ts` | Vitest: dashboard-specific logic (sorting, summary, brokerage layout, owner contracts) |
| `unit/internal-api.test.ts` | Vitest: URL validation, envelope parsing, success/error handling |
| `unit/api-gateway.test.ts` | Vitest: relay URL construction, header forwarding, timeout behavior |
| `unit/owners.test.ts` | Vitest: owner-specific utilities |
| `e2e/dashboard-*.spec.ts` | Playwright: dashboard rendering, owner colors, profit colors |
| `e2e/history-filters.spec.ts` | Playwright: history page filtering, pagination, search param binding |
| `e2e/trade-entry-reset.spec.ts` | Playwright: record form entry, post-submit reset |
| `e2e/autocomplete.spec.ts` | Playwright: stock/brokerage/owner combobox typeahead and selection |
| `e2e/delete-confirmation.spec.ts` | Playwright: trade deletion with confirmation dialog |
| `e2e/profit-colors.spec.ts` | Playwright: profit/loss color coding on dashboard and history |
| `e2e/trade-edit.spec.ts` | **STALE** — Predates native `<select>` → custom combobox refactor; currently broken due to UI changes, not a fresh regression |
| `e2e/journal.spec.ts` | **STALE** — Predates native `<select>` → custom combobox refactor; currently broken due to UI changes, not a fresh regression |
| `e2e/helpers/trade-deletion.ts` | Playwright utility: `openDeletionConfirmation`, `submitDeletionConfirmation` (confirm text + click delete) |
| `e2e/helpers/date-time-field.ts` | Playwright utility: `fillExecutedAt`, `expectExecutedAt` (interact with custom date/time picker segments) |
| `test-results/` | Playwright output artifact directory (gitignored, not source); disposable after runs |

## Subdirectories
| Directory | Contents |
|-----------|----------|
| `unit/` | Vitest unit/integration specs for utilities, formatting, API contracts |
| `e2e/` | Playwright end-to-end specs for UI flows; helpers subfolder with reusable Playwright utilities |
| `e2e/helpers/` | Shared Playwright helper functions for common UI interactions (deletion, date entry) |
| `test-results/` | Playwright test run artifacts (screenshots, traces, JSON reports); auto-generated, gitignored, safe to delete |

## For AI Agents

### Working In This Directory

**Unit tests** (vitest):
- Run via `pnpm test`; no server required.
- Test data transformations in `stock-daejang-api.ts` (Zod schemas), formatting in `format.ts`, URL construction in `api-gateway.ts`.
- Use `describe` / `it` blocks; mock data is inlined.

**E2E tests** (Playwright):
- Run via `pnpm test:e2e` with `PLAYWRIGHT_BASE_URL` env var pointing to `localhost:3000` (or override).
- Requires `docker compose up -d db backend` and `pnpm dev` running.
- Each spec is independent; test data (trades) is created within the spec and cleaned up in `afterAll` or via explicit teardown.
- Specs use `page.waitForResponse()` to verify API calls and capture created trade IDs for cleanup.

**E2E helpers** (`helpers/`):
- `trade-deletion.ts` wraps deletion UI: click trigger → expect dialog → fill confirmation text → click delete.
- `date-time-field.ts` fills/verifies custom date-time picker fields (year, month, day, meridiem, hour, minute segments).

### Testing Requirements
- `pnpm test` (vitest unit tests) — small pre-existing failures are okay; don't chase unrelated ones.
- `pnpm build && pnpm typecheck` — must pass before committing; clear `.next/` if seeing "Duplicate identifier" errors from stale artifacts.
- `pnpm test:e2e` — only run with isolated `PLAYWRIGHT_BASE_URL` and cleanup of test data afterward.
- **Known issue**: `trade-edit.spec.ts` and `journal.spec.ts` fail due to UI refactor (native `<select>` replaced with custom combobox), not due to fresh regressions. This is safe to ignore when encountered unless the user specifically asks to fix them.

### Common Patterns
- Zod validation in unit tests: mock API responses and verify that schemas parse correctly and apply the right transforms.
- Playwright response interception: use `page.waitForResponse()` to grab API response bodies and extract created resource IDs.
- Combobox interaction: fill input, await option visibility, press Enter to select (or click option).
- Form helpers: `fillExecutedAt` and `submitDeletionConfirmation` encapsulate multi-step UI interactions for reuse across specs.

## Dependencies

### Internal
- `lib/` utilities (format, api-contracts)
- `components/` UI (implicitly tested via E2E)

### External
- `vitest` — Unit test framework
- `@playwright/test` — E2E test framework
- No external test data or fixtures; test data is generated within each spec

<!-- MANUAL: -->
