"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
    <Card component="section" variant="outlined">
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 4 }}
        >
          <Typography sx={{ fontWeight: 700 }}>
            필터{" "}
            <Typography component="span" color="textSecondary">
              {activeFilters.length}개 적용
            </Typography>
          </Typography>
        </Stack>
        <Box aria-busy={isPending}>
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
          <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 4 }}>
            <Button
              disabled={isPending || activeFilters.length === 0}
              onClick={clearAll}
              variant="outlined"
            >
              조건 초기화
            </Button>
          </Stack>
        </Box>
        {error ? (
          <Alert role="alert" severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        ) : null}
        {activeFilters.length > 0 ? (
          <Stack
            aria-label="적용된 필터"
            component="fieldset"
            direction="row"
            sx={{ flexWrap: "wrap", gap: 1.5, mt: 4, p: 0, border: 0 }}
          >
            {activeFilters.map(({ key, value }) => (
              <Chip
                key={key}
                label={`${key === "period" ? "기간" : FILTER_LABELS[key]}: ${
                  key === "ownerId"
                    ? ownerFilterName(owners, value)
                    : key === "brokerageCode"
                      ? brokerageFilterName(brokerages, value)
                      : key === "stockNameOrCode"
                        ? (stocks.find((stock) => stock.code === value)?.name ?? value)
                        : value
                }`}
                onDelete={() => removeFilter(key)}
              />
            ))}
          </Stack>
        ) : null}
        <Typography
          aria-live="polite"
          component="p"
          role="status"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
          }}
        >
          {isPending ? `${side === "BUY" ? "매수" : "매도"} 검색 결과 갱신 중` : ""}
        </Typography>
      </CardContent>
    </Card>
  );
}
