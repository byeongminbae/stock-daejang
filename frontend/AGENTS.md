<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# frontend

## Purpose
Next.js (App Router) frontend for the stock ledger. Server Components fetch directly from the backend; Client Components that need to call the API go through a catch-all relay, since they can't reach the internal backend URL from the browser.

## Key Files
| File | Description |
|------|--------------|
| `package.json` | Scripts: `dev`, `build`, `typecheck`, `lint`/`format` (biome), `test` (vitest), `test:e2e` (playwright) |
| `next.config.ts` | Next.js configuration |
| `biome.json` | Lint/format rules (biome, not eslint/prettier) |
| `playwright.config.ts` | E2E test config |
| `vitest.config.ts` | Unit/integration test config |
| `DESIGN.md` | Design notes |
| `Dockerfile` | Production container build |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/app/` | App Router pages and the API relay route (see `src/app/AGENTS.md`) |
| `src/components/` | React components (see `src/components/AGENTS.md`) |
| `src/lib/` | Shared client/server utilities and API contracts (see `src/lib/AGENTS.md`) |
| `tests/` | Vitest unit/integration specs and Playwright e2e specs |

## For AI Agents

### Working In This Directory
- CSS Modules throughout; reuse existing `*.module.css` files/classnames instead of duplicating styles across similar components.
- Client Components that call the backend go through `app/api/v1/[...path]/route.ts` (`lib/server/api-gateway.ts`); Server Components use `lib/server/stock-daejang-api.ts` directly (server-only, each response Zod-validated) via `INTERNAL_API_BASE_URL`.
- `ky` is the HTTP client used client-side, typically with `throwHttpErrors: false` plus a manually Zod-parsed `z.discriminatedUnion("success", [...])` response schema to distinguish success/error envelopes.
- Combobox-style inputs (`BrokerageCombobox`, `OwnerCombobox`, `StockCombobox`, `HistoryStockCombobox`) share a hand-rolled controlled-combobox pattern (typeahead input + popover listbox, `role="combobox"`, keyboard nav, `onMouseDown preventDefault` on the popover container to avoid premature input blur while interacting with it — including its scrollbar). Prefer extending this pattern over introducing a new one.

### Testing Requirements
- `pnpm build && pnpm typecheck` before considering a change done; `rm -rf .next` first if a concurrently running `pnpm dev` has left stale `.next/dev/types` vs `.next/types` artifacts (a common false-positive "Duplicate identifier" error).
- `pnpm test` (vitest) — a small number of pre-existing failures may be present; don't chase unrelated ones already known to the project owner.
- `pnpm dev` + an ad-hoc Playwright script (or `pnpm test:e2e` with `PLAYWRIGHT_BASE_URL` set) for live verification of UI changes against the real backend (via `docker compose up -d db backend`).
- `pnpm exec biome check <files>` for lint on just the files touched.

### Common Patterns
- `useId()`-scoped element ids for accessible label/description wiring in custom form controls.
- Real-time commit UX (no explicit "save" button) for list-editing screens like Settings — mutate immediately, roll back optimistically on failure.

## Dependencies

### External
- Next.js (App Router), React, `ky` (HTTP client), `zod` (schema validation), `react-day-picker` (calendar UI), `@playwright/test`, `vitest`, `biome` (lint/format).

<!-- MANUAL: -->
