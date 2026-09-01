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
import type { Owner } from "@/lib/api-contracts";
import styles from "./stock-combobox.module.css";

interface OwnerComboboxProps {
  readonly owners: readonly Owner[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
  readonly allowEmpty?: boolean;
}

function matches(owner: Owner, query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length === 0) return true;
  return owner.name.toLocaleLowerCase("ko-KR").includes(trimmed.toLocaleLowerCase("ko-KR"));
}

export function OwnerCombobox({
  owners,
  value,
  onChange,
  error,
  disabled = false,
  allowEmpty = false,
}: OwnerComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-owner`;
  const listId = `${baseId}-owner-list`;
  const errorId = `${baseId}-owner-error`;
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
    const selected = owners.find((owner) => owner.id.toString() === value);
    setQuery(selected?.name ?? "");
  }, [value, owners, allowEmpty]);

  const items = useMemo(
    () => (showDefault ? owners : owners.filter((owner) => matches(owner, query))),
    [showDefault, owners, query],
  );
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  const openList = () => {
    window.clearTimeout(closeTimerRef.current);
    setShowDefault(true);
    setOpen(true);
    setActiveIndex(items.length > 0 ? 0 : -1);
  };

  const choose = (owner: Owner) => {
    setQuery(owner.name);
    setOpen(false);
    setActiveIndex(-1);
    onChange(owner.id.toString());
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
    if (event.key === "Enter" && open && activeItem !== undefined) {
      event.preventDefault();
      choose(activeItem);
    }
  };

  const handleBlur = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      if (value === "") {
        setQuery(allowEmpty ? "전체" : "");
        return;
      }
      const selected = owners.find((owner) => owner.id.toString() === value);
      setQuery(selected?.name ?? "");
    }, 150);
  };

  const handleComposition = (event: CompositionEvent<HTMLInputElement>) => {
    composingRef.current = event.type !== "compositionend";
  };

  return (
    <div className={styles.field}>
      <label className="field-label" htmlFor={inputId}>
        소유주
      </label>
      <div className={styles.anchor}>
        <input
          id={inputId}
          className="control"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && activeItem ? `${baseId}-owner-option-${activeItem.id}` : undefined
          }
          aria-expanded={open}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder="소유주 선택"
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
          <div id={listId} className={styles.popover} role="listbox">
            {allowEmpty ? (
              <button
                aria-selected={value === ""}
                className={styles.option}
                onClick={clear}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                전체
              </button>
            ) : null}
            {items.length === 0 ? (
              <p className={styles.message}>일치하는 소유주가 없습니다.</p>
            ) : (
              items.map((owner, index) => (
                <button
                  aria-selected={index === activeIndex}
                  className={styles.option}
                  id={`${baseId}-owner-option-${owner.id}`}
                  key={owner.id}
                  onClick={() => choose(owner)}
                  onMouseDown={(event) => event.preventDefault()}
                  role="option"
                  type="button"
                >
                  <strong>{owner.name}</strong>
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
