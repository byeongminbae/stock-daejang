"use client";

import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  type ChangeEvent,
  type CompositionEvent,
  type FocusEvent,
  type KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { ComboboxPopover } from "./combobox-popover";
import { type StockSelection, sideLabel, type TradeSide } from "./types";

interface HistoryStockComboboxProps {
  readonly stocks: readonly StockSelection[];
  readonly initialValue: string;
  readonly onChange: (value: string) => void;
  readonly side: TradeSide;
}

function matches(stock: StockSelection, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  return normalized.length === 0
    ? true
    : stock.name.toLocaleLowerCase("ko-KR").includes(normalized) ||
        stock.code.toLocaleUpperCase("en-US").includes(query.trim().toLocaleUpperCase("en-US"));
}

export function HistoryStockCombobox({
  stocks,
  initialValue,
  onChange,
  side,
}: HistoryStockComboboxProps) {
  const label = sideLabel(side);
  const baseId = useId();
  const inputId = `${baseId}-history-stock`;
  const listId = `${baseId}-history-stock-list`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const initialStock = stocks.find(
    (stock) => stock.code === initialValue || stock.name === initialValue,
  );
  const [query, setQuery] = useState(initialStock?.name ?? initialValue);
  const [selected, setSelected] = useState<StockSelection | null>(initialStock ?? null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const composing = useRef(false);
  const items = useMemo(
    () => stocks.filter((stock) => matches(stock, showAll ? "" : query)),
    [query, showAll, stocks],
  );
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  const openList = () => {
    window.clearTimeout(closeTimer.current);
    setShowAll(true);
    setOpen(true);
    setActiveIndex(stocks.length > 0 ? 0 : -1);
  };

  const choose = (stock: StockSelection) => {
    setSelected(stock);
    setQuery(stock.name);
    setOpen(false);
    setActiveIndex(-1);
    onChange(stock.code);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelected(null);
    setQuery(event.currentTarget.value);
    setShowAll(false);
    setOpen(true);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (composing.current || event.nativeEvent.isComposing) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (items.length === 0 ? -1 : (index + 1) % items.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        items.length === 0 ? -1 : index <= 0 ? items.length - 1 : index - 1,
      );
      return;
    }
    if (event.key === "Enter" && open && activeItem !== undefined) {
      event.preventDefault();
      choose(activeItem);
    }
  };

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
    onChange(selected?.code ?? query.trim());
  };

  const handleComposition = (event: CompositionEvent<HTMLInputElement>) => {
    composing.current = event.type !== "compositionend";
  };

  return (
    <Box ref={anchorRef} sx={{ minWidth: 0 }}>
      <TextField
        aria-activedescendant={
          open && activeItem !== undefined ? `${baseId}-option-${activeItem.code}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        autoComplete="off"
        fullWidth
        id={inputId}
        label="종목명 또는 종목코드"
        onBlur={handleBlur}
        onChange={handleChange}
        onClick={openList}
        onCompositionEnd={handleComposition}
        onCompositionStart={handleComposition}
        onFocus={(event) => {
          event.currentTarget.select();
          openList();
        }}
        onKeyDown={handleKeyDown}
        placeholder={`${label}한 종목 선택`}
        role="combobox"
        value={query}
        variant="outlined"
      />
      {open ? (
        <ComboboxPopover anchorEl={anchorRef.current} id={listId} open={open} role="listbox">
          {items.length === 0 ? (
            <Typography color="textSecondary" sx={{ px: 3, py: 2 }} variant="body2">
              {stocks.length === 0
                ? `${label}한 종목이 없습니다.`
                : `일치하는 ${label} 종목이 없습니다.`}
            </Typography>
          ) : (
            items.map((stock, index) => (
              <ListItemButton
                aria-selected={index === activeIndex}
                id={`${baseId}-option-${stock.code}`}
                key={stock.code}
                onClick={() => choose(stock)}
                role="option"
                selected={index === activeIndex}
              >
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 3 }}
                >
                  <span>{stock.name}</span>
                  <Typography color="textSecondary" variant="body2">
                    {stock.code}
                  </Typography>
                </Box>
              </ListItemButton>
            ))
          )}
        </ComboboxPopover>
      ) : null}
    </Box>
  );
}
