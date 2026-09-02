<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# trades

## Purpose
Trade entry forms, history views, filtering, and deletion workflows. This is the largest component subtree, handling both BUY and SELL sides of the ledger with full real-time preview, combobox filtering, custom date/time input, and modal dialogs for editing/deleting trades.

## Key Files

### Form Components
| File | Description |
|------|--------------|
| `TradeEntryForm.tsx` | Public wrapper that wires up useTradeEntryForm hook to TradeEntryFields; renders title and description |
| `TradeEntryFields.tsx` | Shared form fields (owner, brokerage, stock, quantity, price, datetime); used by both create form and edit dialog; shows amount/expected-profit summary and validation errors |
| `useTradeEntryForm.ts` | Form state hook — manages field values, errors, preview calculation, submit logic; calls POST/PUT `/api/v1/trades` and preview endpoint; Zod validation |

### Combobox Components
| File | Description |
|------|--------------|
| `BrokerageCombobox.tsx` | Hand-rolled controlled typeahead combobox for brokerages; supports favorite-brokerage filtering; shows code as secondary text; uses stock-combobox.module.css |
| `OwnerCombobox.tsx` | Same pattern as BrokerageCombobox but for owners (by id); no secondary text; reuses stock-combobox.module.css |
| `StockCombobox.tsx` | Remote API search (2+ chars, 300ms debounce) with retry button on error; shows market and ETF status; selection display with deselect button; state tracking (loading/refreshing/ready/error); uses stock-combobox.module.css |
| `HistoryStockCombobox.tsx` | Local filtered list (not remote) for history filter sidebar; matches by name or code (case-insensitive); uses history-filters.module.css for styling |

### History & Filtering
| File | Description |
|------|--------------|
| `HistoryFilters.tsx` | Top-level filter container managing URL search params; renders HistoryFilterFields and active filter chips; handles apply/remove/clearAll navigation |
| `HistoryFilterFields.tsx` | Fieldset containing HistoryDateRange (inline), OwnerCombobox, BrokerageCombobox, HistoryStockCombobox; calls parent's onFilterChange to apply filters |
| `history-filter-config.ts` | Constants: filter keys, period presets ("당일", "당월", "1주일", "1개월", "1년"), filter labels, helper functions to resolve owner/brokerage names from filter values |
| `history-date-range.ts` | Date range calculation logic (toDateKey, fromDateKey, periodRange for presets); supports open-ended ranges (from-only or to-only) |
| `HistoryPagination.tsx` | Simple pagination controls for trade history tables |

### History Display & Management
| File | Description |
|------|--------------|
| `TradeHistory.tsx` | Top-level history view composing TradeHistoryTable/TradeHistoryCards with the delete-confirmation and edit dialogs, and the `useTradeDeletion` hook |
| `TradeHistoryRows.tsx` | Dual-layout export: TradeHistoryTable (desktop table) and TradeHistoryCards (mobile card layout); both share row data, selection mode, edit/delete handlers |
| `TradeDeleteConfirmationDialog.tsx` | Modal dialog showing list of trades to delete; requires user to type "삭제" for confirmation; resets on cancel |
| `useTradeDeletion.ts` | Hook managing deletion workflow: selection mode toggle, selected IDs set, confirmation state, DELETE endpoint call; shows per-trade-count success/error messages; calls router.refresh() on success |
| `TradeEditDialog.tsx` | Modal wrapper around TradeEditForm (which composes TradeEntryFields); populates initial values from a TradeHistoryRow; PUT endpoint call |

### Date/Time Input
| File | Description |
|------|--------------|
| `DateTimeInput.tsx` | Fully custom (no native browser widgets) date/time entry component; a "달력" button opens react-day-picker single-date popover; paired with inline segment inputs for 년/월/일/오전-오후/시/분; uses local-edit-tracking ref to avoid clobbering in-progress typing when parent's controlled value round-trips back down; validates per-segment (e.g., month <= 12, day <= 31) |

### Utilities & Types
| File | Description |
|------|--------------|
| `types.ts` | Shared types: TradeSide ("BUY" \| "SELL"), StockSelection, TradeHistoryRow, sideLabel utility |
| `format.ts` | Formatting utilities: formatWon, formatInteger, formatSeoulDateTime, seoulDateTimeLocalNow, isoInstantToSeoulDateTimeLocal, numericSign |
| `history-date-range.ts` | Date range helpers (moved to its own file but listed in History & Filtering above) |
| `integer-input.ts` | Input validation helper for integer-only fields (used by quantity/price inputs and date segment inputs) |
| `index.ts` | Barrel export of all public components |

### Styling
| File | Description |
|------|--------------|
| `stock-combobox.module.css` | Shared popover/option/list styles used by BrokerageCombobox, OwnerCombobox, StockCombobox; defines `.field`, `.anchor`, `.popover`, `.option`, `.message`, `.status`, `.selection` |
| `history-filters.module.css` | Styles for filter layout, period presets, date-range trigger, active-filter chips, shared `.stockField`, `.stockAnchor`, `.stockPopover`, `.stockOption`, `.stockMessage` for HistoryStockCombobox |
| `calendar-popover.module.css` | Shared popover anchor positioning (used by both DateTimeInput and HistoryFilterFields for date-range calendar); defines `.anchor` and `.popover` |
| `date-time-input.module.css` | Segment input layout (grid of year/month/day/meridiem/hour/minute inputs with labels) |
| `trade-entry-form.module.css` | Form layout, summary output display, button actions, alert/success message styling; defines `.compactForm` for edit dialog variant |
| `trade-history.module.css` | Table and card layouts for history display, stock identity (logo + name), profit coloring, row actions, dialog content styling for edit/delete dialogs |

## For AI Agents

### Working In This Directory

#### The Hand-Rolled Combobox Pattern
All combobox components (Brokerage, Owner, Stock, HistoryStock) follow the same controlled pattern:

1. **Input management**: Controlled `<input role="combobox">` with `aria-autocomplete="list"` and composition-event handling (for IME support).
2. **Popover rendering**: Conditionally render `<div role="listbox">` with `onMouseDown preventDefault` on the popover container itself (not just option buttons) — this keeps the input focused even when the user interacts with the popover scrollbar.
3. **Keyboard navigation**: Arrow Up/Down cycle through items (wrapping), Enter selects the active item, Escape closes the list.
4. **Blur handling**: setTimeout-wrapped blur handler to allow onClick to fire before list closes.
5. **Active/selected state**: Track `activeIndex` separately from the selected value; use `aria-activedescendant` and `aria-selected` for accessibility.

When adding a new combobox, extend this pattern rather than introducing a new one. See `BrokerageCombobox` as the reference implementation.

#### DateTimeInput Local Edit Tracking
DateTimeInput uses an `isLocalEditRef` to prevent parent-controlled-value updates from clobbering in-progress user typing:

1. When user edits a segment, increment `isLocalEditRef.current = true` before calling `onChange`.
2. In the `useEffect` watching `value`, check `isLocalEditRef.current` first — if true, skip re-parsing and reset the flag.
3. This allows the component to remain responsive while external value updates (from parent re-renders) don't interrupt the user.

#### TradeEntryForm + useTradeEntryForm Pattern
- `TradeEntryForm` is a thin wrapper that creates the hook and renders `TradeEntryFields`.
- `useTradeEntryForm` manages all state: field values, errors, preview calculation, submission, message display.
- The hook validates with Zod and calls POST/PUT endpoints; discriminated-union response parsing distinguishes success from error.
- `TradeEntryFields` is reused by both the create form (in TradeEntryForm) and the edit form (in TradeEditDialog).

#### HistoryFilters URL-Driven Pattern
- `HistoryFilters` reads/writes URL search params directly (no Redux or context).
- `BASE_FILTER_KEYS` define the canonical set of query parameters (from, to, stockNameOrCode, ownerId, brokerageCode).
- `applyFilter` merges overrides into current values, validates from <= to, then navigates with merged params.
- Each filter-field component calls `onFilterChange({ key: value })` immediately; no "apply" button — changes are live via `useTransition`.

### Testing Requirements
- `pnpm test` (vitest) for component unit tests; note that trade-related tests may mock the ky HTTP client.
- `pnpm dev` + manual browser testing for combobox keyboard nav (arrow keys, Enter, Escape, composition events).
- Test date-time input with both mouse clicks (calendar popover) and keyboard segment input.
- Verify filter URL params update correctly on filter change.
- Test deletion workflow: selection mode, confirmation dialog with typed confirmation, optimistic rollback on error.

### Common Patterns
- **Composition event tracking** (combobox): `composingRef.current` tracks IME composition state; prevent Enter key during composition.
- **Request sequence tracking** (StockCombobox): `requestSequenceRef` avoids race conditions when rapid search queries are typed.
- **Request cancellation** (StockCombobox, DateTimeInput): Use AbortController to cancel in-flight requests on unmount or when a new request starts.
- **Decimal input validation**: `isIntegerDraft` utility returns true only for strings that are empty or contain only digits (no leading zeros after the first digit).
- **Seoul timezone handling**: All date/time values are stored as ISO strings (UTC-normalized); `seoulDateTimeLocalNow()` anchors to Asia/Seoul when converting to a local-edit representation.

## Dependencies

### Internal
- `lib/api-contracts` — Owner, Brokerage, related request/response types.
- `lib/stock-image` — Stock logo URL helper.
- `lib/server/api-gateway.ts` — Catch-all relay for client-side API calls (frontend can't reach INTERNAL_API_BASE_URL directly).
- `components/ui` — Button, Field, StatusMessage primitives.

### External
- React (useId, useState, useEffect, useRef, useTransition, useRouter, FormEvent, CompositionEvent, KeyboardEvent, etc.).
- Next.js (useRouter, useSearchParams, usePathname, useTransition).
- `ky` — HTTP client with `.post()`, `.put()`, `.delete()` methods; always pass `throwHttpErrors: false` and handle response status manually.
- `zod` — Schema validation for all API requests/responses; use `z.discriminatedUnion("success", [...])` to distinguish success/error envelopes.
- `react-day-picker` — Calendar UI for single-date (DateTimeInput) and date-range (HistoryFilters) pickers; locale set to `ko` (Korean).

## Architecture Notes

### CSS Module Sharing
Several CSS modules are deliberately shared across components for visual consistency:
- `stock-combobox.module.css` — imported by BrokerageCombobox, OwnerCombobox, StockCombobox (same popover/option styling).
- `calendar-popover.module.css` — imported by DateTimeInput and HistoryFilterFields (consistent popover positioning and styling).
- `history-filters.module.css` — used for HistoryStockCombobox and overall filter panel layout.

When making style changes (e.g., to combobox option hover color), update the module once; all importers pick up the change.

### Form Validation Strategy
- Zod validation happens at two points:
  1. **Client-side (useTradeEntryForm)**: Client-side Zod schemas validate structure before sending to server.
  2. **Server-side error mapping**: If the server returns field errors, `normalizeField` maps backend field names to frontend field names (e.g., "stockCode", "stockName", "market", "isEtf" all map to "stock").

### State Isolation
Each trade-entry form instance maintains its own state via `useTradeEntryForm`. If multiple forms are rendered (create + edit dialog), they each have independent state; form resets on successful save (except for edits, which trigger router.refresh and dialog close).

<!-- MANUAL: -->
