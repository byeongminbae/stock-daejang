"use client";

import ClearIcon from "@mui/icons-material/Clear";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemButton from "@mui/material/ListItemButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Brokerage } from "@/lib/api-contracts";

import { ComboboxPopover } from "./combobox-popover";

interface BrokerageComboboxProps {
  readonly brokerages: readonly Brokerage[];
  readonly favoriteBrokerages: readonly Brokerage[];
  readonly value: string;
  readonly onChange: (code: string) => void;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
  readonly allowEmpty?: boolean;
  readonly hideLabel?: boolean;
  readonly placeholder?: string;
}

function matches(brokerage: Brokerage, query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length === 0) return true;
  return (
    brokerage.name.toLocaleLowerCase("ko-KR").includes(trimmed.toLocaleLowerCase("ko-KR")) ||
    brokerage.code.includes(trimmed)
  );
}

export function BrokerageCombobox({
  brokerages,
  favoriteBrokerages,
  value,
  onChange,
  error,
  disabled = false,
  allowEmpty = false,
  hideLabel = false,
  placeholder = "증권사 선택",
}: BrokerageComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-brokerage`;
  const listId = `${baseId}-brokerage-list`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [showDefault, setShowDefault] = useState(true);
  const composingRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value === "") {
      setQuery(allowEmpty ? "전체" : "");
      return;
    }
    const selected = brokerages.find((brokerage) => brokerage.code === value);
    setQuery(selected?.name ?? "");
  }, [value, brokerages, allowEmpty]);

  const defaultItems = favoriteBrokerages.length > 0 ? favoriteBrokerages : brokerages;
  const items = useMemo(
    () =>
      showDefault ? defaultItems : brokerages.filter((brokerage) => matches(brokerage, query)),
    [showDefault, defaultItems, brokerages, query],
  );
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  const openList = () => {
    window.clearTimeout(closeTimerRef.current);
    setShowDefault(true);
    setOpen(true);
    setActiveIndex(allowEmpty && value === "" ? -1 : items.length > 0 ? 0 : -1);
  };

  const choose = (brokerage: Brokerage) => {
    setQuery(brokerage.name);
    setOpen(false);
    setActiveIndex(-1);
    onChange(brokerage.code);
  };

  const clear = () => {
    setQuery("전체");
    setOpen(false);
    setActiveIndex(-1);
    onChange("");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.currentTarget.value;
    setQuery(nextQuery);
    setShowDefault(nextQuery.trim().length === 0);
    setOpen(true);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current || event.nativeEvent.isComposing) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % items.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      if (activeItem !== undefined) {
        choose(activeItem);
      } else if (allowEmpty && activeIndex === -1) {
        clear();
      }
    }
  };

  const handleBlur = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      if (value === "") {
        setQuery(allowEmpty ? "전체" : "");
        return;
      }
      const selected = brokerages.find((brokerage) => brokerage.code === value);
      setQuery(selected?.name ?? "");
    }, 150);
  };

  const handleComposition = (event: CompositionEvent<HTMLInputElement>) => {
    composingRef.current = event.type !== "compositionend";
  };

  return (
    <Box ref={anchorRef} sx={{ minWidth: 0 }}>
      <TextField
        aria-activedescendant={
          open && activeItem ? `${baseId}-brokerage-option-${activeItem.code}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        autoComplete="off"
        disabled={disabled}
        error={Boolean(error)}
        fullWidth
        helperText={error}
        id={inputId}
        label={hideLabel ? undefined : "증권사"}
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
        placeholder={placeholder}
        role="combobox"
        slotProps={{
          ...(hideLabel ? { htmlInput: { "aria-label": "증권사" } } : {}),
          input: {
            endAdornment:
              allowEmpty && value !== "" ? (
                <InputAdornment position="end">
                  <IconButton aria-label="선택 해제" edge="end" onClick={clear} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
          },
          formHelperText: { role: "alert" },
        }}
        value={query}
        variant="outlined"
      />
      {open ? (
        <ComboboxPopover anchorEl={anchorRef.current} id={listId} open={open} role="listbox">
          {allowEmpty ? (
            <ListItemButton
              aria-selected={activeIndex === -1}
              onClick={clear}
              role="option"
              selected={activeIndex === -1}
            >
              전체
            </ListItemButton>
          ) : null}
          {items.length === 0 ? (
            <Typography color="textSecondary" sx={{ px: 3, py: 2 }} variant="body2">
              일치하는 증권사가 없습니다.
            </Typography>
          ) : (
            items.map((brokerage, index) => (
              <ListItemButton
                aria-selected={index === activeIndex}
                id={`${baseId}-brokerage-option-${brokerage.code}`}
                key={brokerage.code}
                onClick={() => choose(brokerage)}
                role="option"
                selected={index === activeIndex}
              >
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 3 }}
                >
                  <span>{brokerage.name}</span>
                  <Typography color="textSecondary" variant="body2">
                    {brokerage.code}
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
