<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# components

## Purpose
Reusable React components used throughout the Next.js frontend. Server Components live in `app/`, while client-side components are organized here by feature area (dashboard, trades, settings) and shared UI primitives.

## Key Files
| File | Description |
|------|--------------|
| `app-header.tsx` | Global navigation header with brand logo and links to main routes (dashboard, record/buy-history/sell-history, settings) |
| `primitive-showcase.tsx` | Development harness showing Button, Field, StatusMessage, Surface primitives in different states (busy, error, success) for design verification |

## Subdirectories

### `dashboard/`
Portfolio dashboard view and supporting components.

| File | Purpose |
|------|---------|
| `dashboard-view.tsx` | Main dashboard page component — renders summary strip, empty state, and per-owner sections with position cards/tables |
| `owner-section.tsx` | One owner's position group, optionally showing brokerage subtotals |
| `position-cards.tsx` | Card layout of positions (mobile-friendly) |
| `position-table.tsx` | Table layout of positions (desktop) |
| `summary-strip.tsx` | Total gains/losses and portfolio value at top; includes refresh button with transition handling |
| `brokerage-totals-cookie.ts` | Manages client-side cookie for dashboard toggle state |
| `dashboard.module.css` | Shared layout styles |

### `settings/`
Settings management screens, currently focused on favorite brokerages per owner.

| File | Purpose |
|------|---------|
| `FavoriteBrokeragesSettings.tsx` | Real-time add/remove of favorite brokerages per owner; reuses BrokerageCombobox from trades for consistency; optimistic updates with rollback on failure |
| `favorite-brokerages-settings.module.css` | Layout styles for owner rows, combobox slot, and chip buttons |

### `ui/`
Low-level UI primitives with no business logic.

| File | Purpose |
|------|---------|
| `button.tsx` | Reusable Button component with variants (primary, secondary, ghost, danger) and busy state |
| `field.tsx` | Wrapper for form labels, inputs, hints, and error messages with consistent spacing |
| `status-message.tsx` | Colored alert/info/success/warning toasts |
| `surface.tsx` | Card/panel wrapper with padding and border |
| `class-names.ts` | Utility for conditional className concatenation |

### `trades/`
Trade entry, history filtering, and record management. See `trades/AGENTS.md` for detailed documentation — this directory is substantial enough to warrant its own file.

## For AI Agents

### Working In This Directory
- All UI components use CSS Modules for scoped styling; reuse existing `*.module.css` classnames rather than creating new ones.
- The combobox pattern (found in `BrokerageCombobox`, `OwnerCombobox`, `StockCombobox`, `HistoryStockCombobox`) is hand-rolled and shared across the app — extend this pattern rather than introducing a new one.
- Optimistic updates are used in real-time commit scenarios (e.g., FavoriteBrokeragesSettings): mutate immediately, roll back on error, show error message.
- All form inputs bound via `@ParameterObject` or client-side `ky` go through Zod schema validation before use.

### Testing Requirements
- `pnpm build && pnpm typecheck` before considering a change complete.
- `pnpm test` (vitest) for unit/integration tests.
- `pnpm dev` + manual browser testing for UI changes (especially interactive patterns like comboboxes and dialogs).

### Common Patterns
- `useId()`-scoped element ids for accessible label/description wiring (e.g., `${baseId}-field`, `${baseId}-error`).
- Controlled components with `value`/`onChange` props for form fields.
- Async search with debounce (300ms) and request sequence tracking to avoid race conditions (StockCombobox).

## Dependencies

### Internal
- `lib/api-contracts` — shared type definitions for API responses (Owner, Brokerage, StockSelection).
- `lib/stock-image` — helper to generate stock logo URLs (SVG fallback).

### External
- React, Next.js (useRouter, useTransition, useId, next/image, next/link).
- `ky` — HTTP client for client-side API calls (with Zod schema parsing).
- `react-day-picker` — calendar component for date picking in forms and filters.

<!-- MANUAL: -->
