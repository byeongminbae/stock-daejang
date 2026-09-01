"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { Brokerage, Owner } from "@/lib/api-contracts";
import { HistoryFilterFields } from "./HistoryFilterFields";
import {
  BASE_FILTER_KEYS,
  brokerageFilterName,
  FILTER_LABELS,
  ownerFilterName,
} from "./history-filter-config";
import styles from "./history-filters.module.css";
import type { StockSelection, TradeSide } from "./types";

interface HistoryFiltersProps {
  readonly brokerages: readonly Brokerage[];
  readonly favoriteBrokeragesByOwner?: Readonly<Record<string, readonly Brokerage[]>> | undefined;
  readonly owners: readonly Owner[];
  readonly stocks: readonly StockSelection[];
  readonly side: TradeSide;
}

interface ActiveFilter {
  readonly key: string;
  readonly value: string;
}

export function HistoryFilters({
  brokerages,
  favoriteBrokeragesByOwner,
  owners,
  stocks,
  side,
}: HistoryFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const values = Object.fromEntries(
    BASE_FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""]),
  ) as Readonly<Record<(typeof BASE_FILTER_KEYS)[number], string>>;
  const active: ActiveFilter[] = [];
  for (const key of BASE_FILTER_KEYS) {
    if (key === "from" || key === "to") continue;
    const value = searchParams.get(key);
    if (value) active.push({ key, value });
  }
  const period =
    values.from || values.to
      ? [
          {
            key: "period",
            value: `${values.from || "시작일"} ~ ${values.to || "종료일"}`,
          },
        ]
      : [];
  const activeFilters: readonly ActiveFilter[] = [...period, ...active];

  const navigate = (params: URLSearchParams) => {
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  };

  const applyFilter = (overrides: Readonly<Partial<Record<string, string>>>) => {
    const merged = { ...values, ...overrides };
    if (merged.from && merged.to && merged.from > merged.to) {
      setError("시작일은 종료일보다 늦을 수 없습니다.");
      return;
    }
    const next = new URLSearchParams();
    for (const filterKey of BASE_FILTER_KEYS) {
      const filterValue = merged[filterKey].trim();
      if (filterValue) next.set(filterKey, filterValue);
    }
    setError("");
    navigate(next);
  };

  const removeFilter = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (key === "period") {
      next.delete("from");
      next.delete("to");
    } else {
      next.delete(key);
    }
    next.delete("page");
    navigate(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    setError("");
    navigate(next);
  };

  return (
    <section className={`panel ${styles.filters}`}>
      <p className={styles.filtersHeading}>
        필터 <span className={styles.count}>{activeFilters.length}개 적용</span>
      </p>
      <div className={styles.form} aria-busy={isPending}>
        <HistoryFilterFields
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          key={searchParams.toString()}
          onFilterChange={applyFilter}
          owners={owners}
          side={side}
          stocks={stocks}
          values={values}
        />
        <div className={styles.actions}>
          <button
            className="button button--secondary"
            type="button"
            onClick={clearAll}
            disabled={isPending || activeFilters.length === 0}
          >
            조건 초기화
          </button>
        </div>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {activeFilters.length > 0 ? (
        <fieldset className={styles.chips}>
          <legend className="sr-only">적용된 필터</legend>
          {activeFilters.map(({ key, value }) => (
            <button
              key={key}
              className={styles.chip}
              type="button"
              onClick={() => removeFilter(key)}
            >
              {key === "period" ? "기간" : FILTER_LABELS[key]}:{" "}
              {key === "ownerId"
                ? ownerFilterName(owners, value)
                : key === "brokerageCode"
                  ? brokerageFilterName(brokerages, value)
                  : key === "stockNameOrCode"
                    ? (stocks.find((stock) => stock.code === value)?.name ?? value)
                    : value}{" "}
              <span aria-hidden="true">×</span>
              <span className="sr-only"> 필터 제거</span>
            </button>
          ))}
        </fieldset>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {isPending ? `${side === "BUY" ? "매수" : "매도"} 검색 결과 갱신 중` : ""}
      </p>
    </section>
  );
}
