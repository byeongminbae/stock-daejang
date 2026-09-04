"use client";

import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemButton from "@mui/material/ListItemButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ky from "ky";
import {
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import { ComboboxPopover } from "./combobox-popover";
import type { StockSelection } from "./types";

const searchResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  data: z.array(
    z.object({
      code: z.string().regex(/^[0-9A-Z]{6}$/),
      name: z.string().min(1),
      market: z.string().min(1),
      isEtf: z.boolean(),
    }),
  ),
});

interface StockComboboxProps {
  readonly value: StockSelection | null;
  readonly onChange: (stock: StockSelection | null) => void;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
}

export function StockCombobox({ value, onChange, error, disabled = false }: StockComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-stock`;
  const listId = `${baseId}-list`;
  const statusId = `${baseId}-status`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly StockSelection[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "refreshing" | "ready" | "error">("idle");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    if (value !== null || trimmed.length < 2) {
      setItems([]);
      setActiveIndex(-1);
      setOpen(false);
      setState("idle");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setState(retryKey > 0 ? "refreshing" : "loading");
      try {
        const payload: unknown = await ky
          .get("/api/v1/stocks", {
            searchParams: { stockName: trimmed },
            signal: controller.signal,
            timeout: 8_000,
          })
          .json();
        if (controller.signal.aborted || requestId !== requestSequenceRef.current) return;
        const parsed = searchResponseSchema.parse(payload);
        setItems(parsed.data);
        setActiveIndex(parsed.data.length > 0 ? 0 : -1);
        setOpen(true);
        setState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!(error instanceof Error)) throw error;
        setItems([]);
        setState("error");
        setOpen(true);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, retryKey, value]);

  const choose = (stock: StockSelection) => {
    onChange(stock);
    setQuery("");
    setOpen(false);
    setItems([]);
    setState("idle");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setRetryKey(0);
    if (value !== null) {
      onChange(null);
    }
    setItems([]);
    setActiveIndex(-1);
    setOpen(nextQuery.trim().length >= 2);
    setState(nextQuery.trim().length >= 2 ? "loading" : "idle");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const isComposing = composingRef.current || event.nativeEvent.isComposing;
    if (isComposing) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      const selected = items[activeIndex] ?? items[0];
      if (selected !== undefined) choose(selected);
      return;
    }
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    }
  };

  const handleComposition = (event: CompositionEvent<HTMLInputElement>) => {
    composingRef.current = event.type !== "compositionend";
    if (event.type === "compositionend") setQuery(event.currentTarget.value);
  };

  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const describedBy = [error ? `${inputId}-helper-text` : null, statusId].filter(Boolean).join(" ");
  const searchStatus =
    state === "error"
      ? "종목 검색에 실패했습니다. 다시 시도해 주세요."
      : state === "ready"
        ? `검색 결과 ${items.length}건`
        : "";

  return (
    <Box ref={anchorRef} sx={{ minWidth: 0 }}>
      <TextField
        aria-activedescendant={
          open && activeItem ? `${baseId}-option-${activeItem.code}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-describedby={describedBy || undefined}
        aria-expanded={open}
        autoComplete="off"
        disabled={disabled}
        error={Boolean(error)}
        fullWidth
        helperText={error}
        id={inputId}
        label="종목명"
        onChange={handleInput}
        onCompositionEnd={handleComposition}
        onCompositionStart={handleComposition}
        onKeyDown={handleKeyDown}
        placeholder="두 글자 이상 검색"
        role="combobox"
        slotProps={{
          input: {
            endAdornment:
              state === "loading" || state === "refreshing" ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : undefined,
          },
          formHelperText: { role: "alert" },
        }}
        value={value?.name ?? query}
        variant="outlined"
      />
      <Box
        aria-live="polite"
        id={statusId}
        role="status"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
        }}
      >
        {searchStatus}
      </Box>
      {value ? (
        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">
            선택: <strong>{value.name}</strong> <code>{value.code}</code>
          </Typography>
          <Button
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            size="small"
            startIcon={<ClearIcon fontSize="small" />}
          >
            선택 해제
          </Button>
        </Box>
      ) : null}
      {open ? (
        <ComboboxPopover anchorEl={anchorRef.current} id={listId} open={open} role="listbox">
          {state === "loading" || state === "refreshing" ? (
            <Typography color="textSecondary" sx={{ px: 3, py: 2 }} variant="body2">
              {state === "refreshing" ? "종목 다시 검색 중" : "종목 검색 중"}
            </Typography>
          ) : null}
          {state === "ready" && items.length === 0 ? (
            <Typography color="textSecondary" sx={{ px: 3, py: 2 }} variant="body2">
              검색 결과가 없습니다.
            </Typography>
          ) : null}
          {state === "error" ? (
            <Box sx={{ px: 3, py: 2 }}>
              <Typography color="textSecondary" variant="body2">
                종목을 불러오지 못했습니다.
              </Typography>
              <Button onClick={() => setRetryKey((key) => key + 1)} size="small" sx={{ mt: 1 }}>
                다시 시도
              </Button>
            </Box>
          ) : null}
          {items.map((item, index) => (
            <ListItemButton
              aria-selected={index === activeIndex}
              id={`${baseId}-option-${item.code}`}
              key={item.code}
              onClick={() => choose(item)}
              role="option"
              selected={index === activeIndex}
              tabIndex={-1}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 3 }}>
                <span>{item.name}</span>
                <Typography color="textSecondary" variant="body2">
                  {item.code} · {item.market}
                  {item.isEtf ? " · ETF" : ""}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </ComboboxPopover>
      ) : null}
    </Box>
  );
}
