"use client";

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
import styles from "./stock-combobox.module.css";

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
  const errorId = `${baseId}-brokerage-error`;
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
    <div className={styles.field}>
      <label className={hideLabel ? "sr-only" : "field-label"} htmlFor={inputId}>
        증권사
      </label>
      <div className={styles.anchor}>
        <input
          id={inputId}
          className="control"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && activeItem ? `${baseId}-brokerage-option-${activeItem.code}` : undefined
          }
          aria-expanded={open}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
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
        />
        {open ? (
          <div
            id={listId}
            className={styles.popover}
            onMouseDown={(event) => event.preventDefault()}
            role="listbox"
          >
            {allowEmpty ? (
              <button
                aria-selected={activeIndex === -1}
                className={styles.option}
                onClick={clear}
                role="option"
                type="button"
              >
                전체
              </button>
            ) : null}
            {items.length === 0 ? (
              <p className={styles.message}>일치하는 증권사가 없습니다.</p>
            ) : (
              items.map((brokerage, index) => (
                <button
                  aria-selected={index === activeIndex}
                  className={styles.option}
                  id={`${baseId}-brokerage-option-${brokerage.code}`}
                  key={brokerage.code}
                  onClick={() => choose(brokerage)}
                  role="option"
                  type="button"
                >
                  <strong>{brokerage.name}</strong>
                  <span>{brokerage.code}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
