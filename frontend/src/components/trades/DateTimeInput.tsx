"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import calendarStyles from "./calendar-popover.module.css";
import styles from "./date-time-input.module.css";
import { isIntegerDraft } from "./integer-input";

interface DateTimeInputProps {
  readonly "aria-describedby"?: string | undefined;
  readonly "aria-invalid"?: boolean | undefined;
  readonly "aria-labelledby": string;
  readonly disabled?: boolean;
  readonly id: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}

type Meridiem = "AM" | "PM";

interface Segments {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly meridiem: Meridiem;
  readonly hour12: string;
  readonly minute: string;
}

const DAY_PICKER_VARS = {
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
} as CSSProperties;

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

function stripLeadingZeros(raw: string): string {
  return raw === "" ? "" : String(Number(raw));
}

function parseSegments(value: string): Segments {
  const [datePart = "", timePart = ""] = value.split("T");
  const [year = "", month = "", day = ""] = datePart.split("-");
  const [hourStr = "", minuteStr = ""] = timePart.split(":");
  const hour24 = hourStr === "" ? 0 : Number(hourStr);
  const meridiem: Meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    year,
    month: stripLeadingZeros(month),
    day: stripLeadingZeros(day),
    meridiem,
    hour12: String(hour12),
    minute: stripLeadingZeros(minuteStr),
  };
}

function composeValue(segments: Segments): string {
  const now = new Date();
  const year = (segments.year || String(now.getFullYear())).padStart(4, "0");
  const month = (segments.month || "1").padStart(2, "0");
  const day = (segments.day || "1").padStart(2, "0");
  const hour12 = Number(segments.hour12 || "12") % 12;
  const hour24 = segments.meridiem === "PM" ? hour12 + 12 : hour12;
  const minute = (segments.minute || "0").padStart(2, "0");
  return `${year}-${month}-${day}T${String(hour24).padStart(2, "0")}:${minute}`;
}

function digitsWithinRange(raw: string, maxLength: number, maxValue: number): boolean {
  if (!isIntegerDraft(raw) || raw.length > maxLength) return false;
  return raw === "" || Number(raw) <= maxValue;
}

export function DateTimeInput({
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
  "aria-labelledby": ariaLabelledby,
  disabled,
  id,
  onChange,
  value,
}: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [segments, setSegments] = useState<Segments>(() => parseSegments(value));
  const isLocalEditRef = useRef(false);

  useEffect(() => {
    if (isLocalEditRef.current) {
      isLocalEditRef.current = false;
      return;
    }
    setSegments(parseSegments(value));
  }, [value]);

  const commit = (nextSegments: Segments) => {
    setSegments(nextSegments);
    isLocalEditRef.current = true;
    onChange(composeValue(nextSegments));
  };

  const closeCalendar = useCallback(() => setOpen(false), []);

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

  const selectedDate =
    segments.year && segments.month && segments.day
      ? fromDateKey(
          `${segments.year.padStart(4, "0")}-${segments.month.padStart(2, "0")}-${segments.day.padStart(2, "0")}`,
        )
      : undefined;

  const handleSelectDate = (nextDate: Date | undefined) => {
    if (!nextDate) return;
    const key = toDateKey(nextDate);
    const [year, month, day] = key.split("-");
    commit({ ...segments, year: year ?? "", month: month ?? "", day: day ?? "" });
    setOpen(false);
  };

  return (
    <div className={`${styles.row} ${calendarStyles.anchor}`} ref={anchorRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="button button--secondary"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        달력
      </button>
      <fieldset
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid}
        aria-labelledby={ariaLabelledby}
        className={styles.segments}
        id={id}
      >
        <input
          aria-label="년"
          className={`control ${styles.yearUnit}`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={4}
          onChange={(event) => {
            const next = event.target.value;
            if (!isIntegerDraft(next) || next.length > 4) return;
            commit({ ...segments, year: next });
          }}
          value={segments.year}
        />
        <span>년</span>
        <input
          aria-label="월"
          className={`control ${styles.timeUnit}`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) => {
            const next = event.target.value;
            if (!digitsWithinRange(next, 2, 12)) return;
            commit({ ...segments, month: next });
          }}
          value={segments.month}
        />
        <span>월</span>
        <input
          aria-label="일"
          className={`control ${styles.timeUnit}`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) => {
            const next = event.target.value;
            if (!digitsWithinRange(next, 2, 31)) return;
            commit({ ...segments, day: next });
          }}
          value={segments.day}
        />
        <span>일</span>
        <div className={styles.meridiem}>
          <button
            aria-pressed={segments.meridiem === "AM"}
            className="button button--secondary"
            disabled={disabled}
            onClick={() => commit({ ...segments, meridiem: "AM" })}
            type="button"
          >
            오전
          </button>
          <button
            aria-pressed={segments.meridiem === "PM"}
            className="button button--secondary"
            disabled={disabled}
            onClick={() => commit({ ...segments, meridiem: "PM" })}
            type="button"
          >
            오후
          </button>
        </div>
        <input
          aria-label="시"
          className={`control ${styles.timeUnit}`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) => {
            const next = event.target.value;
            if (!digitsWithinRange(next, 2, 12)) return;
            commit({ ...segments, hour12: next });
          }}
          value={segments.hour12}
        />
        <span>시</span>
        <input
          aria-label="분"
          className={`control ${styles.timeUnit}`}
          disabled={disabled}
          inputMode="numeric"
          maxLength={2}
          onChange={(event) => {
            const next = event.target.value;
            if (!digitsWithinRange(next, 2, 59)) return;
            commit({ ...segments, minute: next });
          }}
          value={segments.minute}
        />
        <span>분</span>
      </fieldset>
      {open ? (
        <div aria-label="날짜 선택" className={calendarStyles.popover} role="dialog">
          <DayPicker
            defaultMonth={selectedDate ?? new Date()}
            locale={ko}
            mode="single"
            onSelect={handleSelectDate}
            selected={selectedDate}
            style={DAY_PICKER_VARS}
          />
        </div>
      ) : null}
    </div>
  );
}
