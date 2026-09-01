import { type CSSProperties, useCallback, useEffect, useId, useRef, useState } from "react";
import { type DateRange, DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import type { Brokerage, Owner } from "@/lib/api-contracts";
import { HistoryStockCombobox } from "./HistoryStockCombobox";
import { periodRange } from "./history-date-range";
import { type BASE_FILTER_KEYS, PERIOD_PRESETS } from "./history-filter-config";
import styles from "./history-filters.module.css";
import type { StockSelection, TradeSide } from "./types";

type FilterKey = (typeof BASE_FILTER_KEYS)[number];
type FilterValues = Readonly<Record<FilterKey, string>>;

interface HistoryFilterFieldsProps {
  readonly brokerages: readonly Brokerage[];
  readonly owners: readonly Owner[];
  readonly stocks: readonly StockSelection[];
  readonly values: FilterValues;
  readonly onFilterChange: (overrides: Readonly<Partial<Record<FilterKey, string>>>) => void;
  readonly side: TradeSide;
}

const PERIOD_MATCH_ORDER = ["1년", "1개월", "당월", "1주일", "당일"] as const;

function selectedPeriod(from: string, to: string): (typeof PERIOD_PRESETS)[number] | null {
  if (!from && !to) return null;
  if (!from || !to) return "기간선택";
  for (const preset of PERIOD_MATCH_ORDER) {
    const range = periodRange(preset);
    if (range.from === from && range.to === to) return preset;
  }
  return "기간선택";
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key: string): Date | undefined {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function HistoryDateRange({
  values,
  onFilterChange,
}: Pick<HistoryFilterFieldsProps, "values" | "onFilterChange">) {
  const [open, setOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);
  const anchorRef = useRef<HTMLDivElement>(null);
  const hasPickedOnceRef = useRef(false);
  const pendingRangeRef = useRef<DateRange | undefined>(undefined);
  const triggerId = useId();
  const activePreset = open ? "기간선택" : selectedPeriod(values.from, values.to);

  const committedRange: DateRange | undefined = values.from
    ? { from: fromDateKey(values.from), to: values.to ? fromDateKey(values.to) : undefined }
    : undefined;

  const rangeLabel =
    values.from || values.to
      ? `${values.from || "시작일"} ~ ${values.to || "종료일"}`
      : "날짜 선택";

  const commitRange = useCallback(
    (range: DateRange | undefined) => {
      onFilterChange({
        from: range?.from ? toDateKey(range.from) : "",
        to: range?.to ? toDateKey(range.to) : "",
      });
    },
    [onFilterChange],
  );

  const setPending = (range: DateRange | undefined) => {
    pendingRangeRef.current = range;
    setPendingRange(range);
  };

  const openCalendar = () => {
    hasPickedOnceRef.current = false;
    setPending(undefined);
    setOpen(true);
  };

  const closeCalendar = useCallback(() => {
    if (pendingRangeRef.current?.from) commitRange(pendingRangeRef.current);
    setOpen(false);
  }, [commitRange]);

  const applyPeriod = (preset: (typeof PERIOD_PRESETS)[number]) => {
    if (preset === "기간선택") {
      openCalendar();
      return;
    }
    const range = periodRange(preset);
    onFilterChange({ from: range.from, to: range.to });
  };

  const handleSelect = (range: DateRange | undefined) => {
    setPending(range);
    if (hasPickedOnceRef.current && range?.from && range?.to) {
      commitRange(range);
      setOpen(false);
      return;
    }
    hasPickedOnceRef.current = true;
  };

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) closeCalendar();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCalendar();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, closeCalendar]);

  return (
    <fieldset className={styles.dateRange}>
      <legend>기간</legend>
      <div className={styles.periodPresets}>
        {PERIOD_PRESETS.map((preset) => (
          <button
            className="button button--secondary"
            key={preset}
            type="button"
            aria-pressed={activePreset === preset}
            onClick={() => applyPeriod(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      <div className={styles.dateTrigger} ref={anchorRef}>
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          className="control"
          id={triggerId}
          onClick={() => (open ? closeCalendar() : openCalendar())}
          type="button"
        >
          {rangeLabel}
        </button>
        {open ? (
          <div aria-label="날짜 범위 선택" className={styles.calendarPopover} role="dialog">
            <DayPicker
              defaultMonth={committedRange?.from ?? committedRange?.to ?? new Date()}
              locale={ko}
              mode="range"
              onSelect={handleSelect}
              selected={pendingRange}
              style={
                {
                  "--rdp-accent-color": "var(--color-brand)",
                  "--rdp-accent-background-color": "var(--color-brand-soft)",
                  "--rdp-today-color": "var(--color-brand)",
                  "--rdp-day-height": "2.25rem",
                  "--rdp-day-width": "2.25rem",
                  "--rdp-day_button-height": "2rem",
                  "--rdp-day_button-width": "2rem",
                  "--rdp-nav-height": "2rem",
                  "--rdp-nav_button-height": "1.75rem",
                  "--rdp-nav_button-width": "1.75rem",
                } as CSSProperties
              }
            />
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

export function HistoryFilterFields({
  brokerages,
  onFilterChange,
  owners,
  side,
  stocks,
  values,
}: HistoryFilterFieldsProps) {
  return (
    <>
      <HistoryDateRange values={values} onFilterChange={onFilterChange} />
      <div className="field">
        <label className="field-label" htmlFor="filter-owner">
          소유주
        </label>
        <select
          id="filter-owner"
          className="control"
          name="ownerId"
          value={values.ownerId}
          onChange={(event) => onFilterChange({ ownerId: event.currentTarget.value })}
        >
          <option value="">전체</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="filter-brokerage">
          증권사
        </label>
        <select
          id="filter-brokerage"
          className="control"
          name="brokerageCode"
          value={values.brokerageCode}
          onChange={(event) => onFilterChange({ brokerageCode: event.currentTarget.value })}
        >
          <option value="">전체</option>
          {brokerages.map((brokerage) => (
            <option key={brokerage.code} value={brokerage.code}>
              {brokerage.name}
            </option>
          ))}
        </select>
      </div>
      <HistoryStockCombobox
        initialValue={values.stockNameOrCode}
        onChange={(value) => onFilterChange({ stockNameOrCode: value })}
        side={side}
        stocks={stocks}
      />
    </>
  );
}
