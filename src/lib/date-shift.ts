import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  startOfDay,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { parseDateInput, toDateInputValue } from "@/lib/date-span";
import {
  addBusinessDays,
  DEFAULT_NON_WORKING,
  type HolidaySet,
} from "@/lib/utils/business-days";

export type ShiftUnit = "days" | "weeks" | "months" | "years";
export type ShiftOperation = "add" | "subtract";

export type DateShiftInput = {
  startValue: string;
  /** Raw amount from the input (may be negative). */
  amountRaw: number | null;
  unit: ShiftUnit;
  operation: ShiftOperation;
  /** Only applied when unit is "days". Skips non-working weekdays and holidays. */
  businessDaysOnly?: boolean;
  nonWorkingWeekdays?: ReadonlySet<number>;
  holidaySet?: HolidaySet | null;
};

export type DateShiftSuccess = {
  ok: true;
  result: Date;
  start: Date;
  /** Absolute count of units applied after normalizing sign. */
  amount: number;
  operation: ShiftOperation;
  unit: ShiftUnit;
  businessDaysOnly: boolean;
  /** Calendar days between start and result (signed). */
  calendarDaysDelta: number;
  displayLong: string;
  displayYear: string;
  weekday: string;
};

export type DateShiftFailure = {
  ok: false;
  error: "empty" | "invalid" | "amount_too_large";
  message: string;
};

export type DateShiftResult = DateShiftSuccess | DateShiftFailure;

/** Cap to keep UI responsive (~100 years of daily steps in business-day mode). */
export const MAX_SHIFT_AMOUNT = 10_000;

/**
 * Shift a local calendar date using date-fns (or shared weekend skipping for
 * business days). Negative amounts flip Add ↔ Subtract; the magnitude is always
 * taken as an absolute count.
 */
export function shiftDate(input: DateShiftInput): DateShiftResult {
  const start = parseDateInput(input.startValue);
  if (!start) {
    return {
      ok: false,
      error: input.startValue ? "invalid" : "empty",
      message: input.startValue
        ? "Enter a valid start date."
        : "Choose a start date to calculate.",
    };
  }

  if (input.amountRaw === null || !Number.isFinite(input.amountRaw)) {
    return {
      ok: false,
      error: "empty",
      message: "Enter an amount to add or subtract.",
    };
  }

  let operation = input.operation;
  let amount = Math.trunc(input.amountRaw);
  if (amount < 0) {
    amount = Math.abs(amount);
    operation = operation === "add" ? "subtract" : "add";
  }

  if (amount > MAX_SHIFT_AMOUNT) {
    return {
      ok: false,
      error: "amount_too_large",
      message: `Enter an amount of ${MAX_SHIFT_AMOUNT.toLocaleString()} or less.`,
    };
  }

  const startDay = startOfDay(start);
  const businessDaysOnly =
    Boolean(input.businessDaysOnly) && input.unit === "days";

  let result: Date;

  if (businessDaysOnly) {
    const signed = operation === "add" ? amount : -amount;
    const shifted = addBusinessDays(startDay, signed, {
      nonWorkingWeekdays: input.nonWorkingWeekdays ?? DEFAULT_NON_WORKING,
      holidaySet: input.holidaySet ?? null,
    });
    if (!shifted.ok) {
      return {
        ok: false,
        error: "amount_too_large",
        message: shifted.message,
      };
    }
    result = shifted.date;
  } else if (operation === "add") {
    result = addByUnit(startDay, amount, input.unit);
  } else {
    result = subByUnit(startDay, amount, input.unit);
  }

  const resultDay = startOfDay(result);
  const calendarDaysDelta = differenceInCalendarDays(resultDay, startDay);

  return {
    ok: true,
    result: resultDay,
    start: startDay,
    amount,
    operation,
    unit: input.unit,
    businessDaysOnly,
    calendarDaysDelta,
    displayLong: format(resultDay, "EEEE, MMMM d"),
    displayYear: format(resultDay, "yyyy"),
    weekday: format(resultDay, "EEEE"),
  };
}

function addByUnit(start: Date, amount: number, unit: ShiftUnit): Date {
  switch (unit) {
    case "days":
      return addDays(start, amount);
    case "weeks":
      return addWeeks(start, amount);
    case "months":
      return addMonths(start, amount);
    case "years":
      return addYears(start, amount);
  }
}

function subByUnit(start: Date, amount: number, unit: ShiftUnit): Date {
  switch (unit) {
    case "days":
      return subDays(start, amount);
    case "weeks":
      return subWeeks(start, amount);
    case "months":
      return subMonths(start, amount);
    case "years":
      return subYears(start, amount);
  }
}

/**
 * Move forward or backward by N business days via shared addBusinessDays.
 */
export function shiftByBusinessDays(
  start: Date,
  amount: number,
  operation: ShiftOperation,
  options?: {
    nonWorkingWeekdays?: ReadonlySet<number>;
    holidaySet?: HolidaySet | null;
  },
): Date {
  const signed = operation === "add" ? amount : -amount;
  const shifted = addBusinessDays(start, signed, {
    nonWorkingWeekdays: options?.nonWorkingWeekdays ?? DEFAULT_NON_WORKING,
    holidaySet: options?.holidaySet ?? null,
  });
  if (!shifted.ok) return startOfDay(start);
  return shifted.date;
}

export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed || trimmed === "-" || trimmed === "+") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export { toDateInputValue, parseDateInput };
