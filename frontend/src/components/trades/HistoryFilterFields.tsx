import { useRef } from "react";
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

function selectedPeriod(from: string, to: string): (typeof PERIOD_PRESETS)[number] | null {
  if (!from && !to) return null;
  if (!from || !to) return "기간선택";
  for (const preset of PERIOD_PRESETS) {
    if (preset === "기간선택") continue;
    const range = periodRange(preset);
    if (range.from === from && range.to === to) return preset;
  }
  return "기간선택";
}

function HistoryDateRange({
  values,
  onFilterChange,
}: Pick<HistoryFilterFieldsProps, "values" | "onFilterChange">) {
  const fromInput = useRef<HTMLInputElement>(null);
  const activePreset = selectedPeriod(values.from, values.to);

  const applyPeriod = (preset: (typeof PERIOD_PRESETS)[number]) => {
    if (preset === "기간선택") {
      fromInput.current?.focus();
      return;
    }
    const range = periodRange(preset);
    onFilterChange({ from: range.from, to: range.to });
  };

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
      <div className={styles.dateInputs}>
        <label className={styles.dateInput} htmlFor="filter-from">
          <span className="sr-only">시작일</span>
          <input
            className="control"
            id="filter-from"
            name="from"
            ref={fromInput}
            lang="ko-KR"
            type="date"
            value={values.from}
            onChange={(event) => onFilterChange({ from: event.currentTarget.value })}
          />
        </label>
        <span aria-hidden="true">~</span>
        <label className={styles.dateInput} htmlFor="filter-to">
          <span className="sr-only">종료일</span>
          <input
            className="control"
            id="filter-to"
            name="to"
            lang="ko-KR"
            type="date"
            value={values.to}
            onChange={(event) => onFilterChange({ to: event.currentTarget.value })}
          />
        </label>
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
      <HistoryStockCombobox
        initialValue={values.stockNameOrCode}
        onChange={(value) => onFilterChange({ stockNameOrCode: value })}
        side={side}
        stocks={stocks}
      />
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
    </>
  );
}
