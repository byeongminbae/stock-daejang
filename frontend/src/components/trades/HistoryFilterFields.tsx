"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ko } from "date-fns/locale";

import type { Brokerage, Owner } from "@/lib/api-contracts";

import { BrokerageCombobox } from "./BrokerageCombobox";
import { HistoryStockCombobox } from "./HistoryStockCombobox";
import { periodRange } from "./history-date-range";
import { type BASE_FILTER_KEYS, PERIOD_PRESETS } from "./history-filter-config";
import { OwnerCombobox } from "./OwnerCombobox";
import type { StockSelection, TradeSide } from "./types";

type FilterKey = (typeof BASE_FILTER_KEYS)[number];
type FilterValues = Readonly<Record<FilterKey, string>>;

interface HistoryFilterFieldsProps {
  readonly brokerages: readonly Brokerage[];
  readonly favoriteBrokeragesByOwner?: Readonly<Record<string, readonly Brokerage[]>> | undefined;
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

function fromDateKey(key: string): Date | null {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function HistoryDateRange({
  values,
  onFilterChange,
}: Pick<HistoryFilterFieldsProps, "values" | "onFilterChange">) {
  const activePreset = selectedPeriod(values.from, values.to);

  const applyPeriod = (preset: (typeof PERIOD_PRESETS)[number]) => {
    if (preset === "기간선택") return;
    const range = periodRange(preset);
    onFilterChange({ from: range.from, to: range.to });
  };

  return (
    <Box>
      <Typography sx={{ mb: 1.5, fontWeight: 700 }} variant="body2">
        기간
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, mb: 3 }}>
        {PERIOD_PRESETS.filter((preset) => preset !== "기간선택").map((preset) => (
          <Chip
            aria-pressed={activePreset === preset}
            clickable
            color={activePreset === preset ? "primary" : "default"}
            key={preset}
            label={preset}
            onClick={() => applyPeriod(preset)}
            variant={activePreset === preset ? "filled" : "outlined"}
          />
        ))}
      </Stack>
      <LocalizationProvider adapterLocale={ko} dateAdapter={AdapterDateFns}>
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
          <DatePicker
            format="yyyy-MM-dd"
            label="시작일"
            onChange={(date) => onFilterChange({ from: date ? toDateKey(date) : "" })}
            slotProps={{ textField: { fullWidth: true } }}
            value={values.from ? fromDateKey(values.from) : null}
          />
          <DatePicker
            format="yyyy-MM-dd"
            label="종료일"
            onChange={(date) => onFilterChange({ to: date ? toDateKey(date) : "" })}
            slotProps={{ textField: { fullWidth: true } }}
            value={values.to ? fromDateKey(values.to) : null}
          />
        </Stack>
      </LocalizationProvider>
    </Box>
  );
}

export function HistoryFilterFields({
  brokerages,
  favoriteBrokeragesByOwner = {},
  onFilterChange,
  owners,
  side,
  stocks,
  values,
}: HistoryFilterFieldsProps) {
  return (
    <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
      <Box sx={{ gridColumn: "1 / -1" }}>
        <HistoryDateRange values={values} onFilterChange={onFilterChange} />
      </Box>
      <OwnerCombobox
        allowEmpty
        onChange={(id) => onFilterChange({ ownerId: id })}
        owners={owners}
        value={values.ownerId}
      />
      <BrokerageCombobox
        allowEmpty
        brokerages={brokerages}
        favoriteBrokerages={favoriteBrokeragesByOwner[values.ownerId] ?? []}
        onChange={(code) => onFilterChange({ brokerageCode: code })}
        value={values.brokerageCode}
      />
      <Box sx={{ gridColumn: "1 / -1" }}>
        <HistoryStockCombobox
          initialValue={values.stockNameOrCode}
          onChange={(value) => onFilterChange({ stockNameOrCode: value })}
          side={side}
          stocks={stocks}
        />
      </Box>
    </Box>
  );
}
