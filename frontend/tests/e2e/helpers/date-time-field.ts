import { expect, type Locator } from "@playwright/test";

interface DateTimeSegments {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly meridiem: "오전" | "오후";
  readonly hour12: string;
  readonly minute: string;
}

function toSegments(value: string): DateTimeSegments {
  const [datePart = "", timePart = ""] = value.split("T");
  const [year = "", month = "", day = ""] = datePart.split("-");
  const [hourStr = "", minuteStr = ""] = timePart.split(":");
  const hour24 = Number(hourStr);
  const meridiem: "오전" | "오후" = hour24 >= 12 ? "오후" : "오전";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    year,
    month: String(Number(month)),
    day: String(Number(day)),
    meridiem,
    hour12: String(hour12),
    minute: String(Number(minuteStr)),
  };
}

export async function fillExecutedAt(scope: Locator, label: string, value: string): Promise<void> {
  const group = scope.getByRole("group", { name: label });
  const segments = toSegments(value);
  await group.getByLabel("년").fill(segments.year);
  await group.getByLabel("월").fill(segments.month);
  await group.getByLabel("일").fill(segments.day);
  await group.getByRole("button", { name: segments.meridiem }).click();
  await group.getByLabel("시").fill(segments.hour12);
  await group.getByLabel("분").fill(segments.minute);
}

export async function expectExecutedAt(scope: Locator, label: string, value: string): Promise<void> {
  const group = scope.getByRole("group", { name: label });
  const segments = toSegments(value);
  await expect(group.getByLabel("년")).toHaveValue(segments.year);
  await expect(group.getByLabel("월")).toHaveValue(segments.month);
  await expect(group.getByLabel("일")).toHaveValue(segments.day);
  await expect(group.getByRole("button", { name: segments.meridiem })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(group.getByLabel("시")).toHaveValue(segments.hour12);
  await expect(group.getByLabel("분")).toHaveValue(segments.minute);
}
