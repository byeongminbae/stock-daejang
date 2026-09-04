"use client";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ko } from "date-fns/locale";

interface DateTimeInputProps {
  readonly "aria-describedby"?: string | undefined;
  readonly "aria-invalid"?: boolean | undefined;
  readonly "aria-labelledby": string;
  readonly disabled?: boolean;
  readonly id: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}

function toDate(value: string): Date | null {
  if (value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toValue(date: Date | null): string {
  if (date === null || Number.isNaN(date.getTime())) return "";
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
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
  return (
    <LocalizationProvider adapterLocale={ko} dateAdapter={AdapterDateFns}>
      <DateTimePicker
        ampm
        disabled={disabled ?? false}
        format="yyyy-MM-dd a h:mm"
        onChange={(date) => onChange(toValue(date))}
        timeSteps={{ minutes: 1 }}
        slotProps={{
          textField: {
            "aria-describedby": ariaDescribedby,
            "aria-invalid": ariaInvalid,
            "aria-labelledby": ariaLabelledby,
            fullWidth: true,
            id,
          },
        }}
        value={toDate(value)}
      />
    </LocalizationProvider>
  );
}
