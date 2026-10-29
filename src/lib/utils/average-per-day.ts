/**
 * Pure math for the Average Per Day Calculator.
 * Local calendar dates only (date-fns). Never throws; never returns NaN/Infinity in displays.
 */

import {
  differenceInCalendarDays,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  countBusinessDays,
  type CountBusinessDaysOptions,
} from "@/lib/utils/business-days";

export type AveragePerDayMode = "daily-average" | "find-total";
export type PeriodKind = "duration" | "date-range";
/** Length unit when periodKind is "duration" (converted to days for the average). */
export type DurationUnit = "days" | "weeks" | "months" | "years";

/** Same pace factors used for the week / month / year projections. */
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 365 / 12;
export const DAYS_PER_YEAR = 365;

export type AveragePerDayInput = {
  mode: AveragePerDayMode;
  /** Total amount (mode daily-average) or unused. */
  total: number | null;
  /** Daily average (mode find-total) or unused. */
  dailyAverage: number | null;
  periodKind: PeriodKind;
  /**
   * Duration amount when periodKind is "duration"
   * (e.g. 2 with durationUnit "months").
   */
  periodAmount: number | null;
  durationUnit: DurationUnit;
  startDate: string;
  endDate: string;
  includeEnd: boolean;
  workingDaysOnly: boolean;
  businessOptions?: CountBusinessDaysOptions;
  /** Optional unit label (already sanitized, max 12). */
  unitLabel: string;
};


export type AveragePerDaySuccess = {
  ok: true;
  dayCount: number;
  /** Primary figure: daily average (both modes expose it). */
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
  /** Total (mode find-total result, or the input total in daily-average mode). */
  total: number;
  working: string;
  displayPerDay: string;
  displayTotal: string;
  displayPerWeek: string;
  displayPerMonth: string;
  displayPerYear: string;
  unitLabel: string;
  datesWereSwapped: boolean;
  usedWorkingDays: boolean;
};

export type AveragePerDayFailure = {
  ok: false;
  error:
    | "empty"
    | "zero_days"
    | "invalid_number"
    | "invalid_dates"
    | "end_before_start"
    | "overflow";
  message: string;
};

export type AveragePerDayResult = AveragePerDaySuccess | AveragePerDayFailure;

const MAX_ABS = 1e15;
const UNIT_LABEL_MAX = 12;

/** Round for display only (max 2 decimals — matches hand-checked examples). */
export function roundDisplayValue(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatAmount(value: number): string {
  const rounded = roundDisplayValue(value);
  if (!Number.isFinite(rounded)) return "—";
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}


export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^-?\d*\.?\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function parseDayCountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Strip control / angle chars; cap length. Always render as plain text. */
export function sanitizeUnitLabel(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F<>&"'`]/g, "")
    .slice(0, UNIT_LABEL_MAX);
}

export function parseLocalYmd(value: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

/**
 * Calendar day count for a range. Returns null if either date is invalid.
 * If end is before start, returns end_before_start via a tagged object.
 */
export function resolveCalendarDayCount(
  startValue: string,
  endValue: string,
  includeEnd: boolean,
):
  | { ok: true; days: number; swapped: boolean }
  | { ok: false; error: "invalid_dates" | "end_before_start" | "zero_days" } {
  const start = parseLocalYmd(startValue);
  const end = parseLocalYmd(endValue);
  if (!start || !end) return { ok: false, error: "invalid_dates" };

  if (isBefore(end, start)) {
    return { ok: false, error: "end_before_start" };
  }

  const exclusive = differenceInCalendarDays(end, start);
  const days = exclusive + (includeEnd ? 1 : 0);
  if (days <= 0) return { ok: false, error: "zero_days" };
  return { ok: true, days, swapped: false };
}

function withUnit(amount: string, unit: string): string {
  const label = unit.trim();
  return label ? `${amount} ${label}` : amount;
}

/** Convert a duration amount into calendar days (fixed factors, not calendar months). */
export function durationToDays(
  amount: number,
  unit: DurationUnit,
): number {
  switch (unit) {
    case "weeks":
      return amount * DAYS_PER_WEEK;
    case "months":
      return amount * DAYS_PER_MONTH;
    case "years":
      return amount * DAYS_PER_YEAR;
    case "days":
    default:
      return amount;
  }
}

export function durationUnitLabel(
  unit: DurationUnit,
  amount: number,
): string {
  const plural = amount === 1 ? "" : "s";
  switch (unit) {
    case "weeks":
      return `week${plural}`;
    case "months":
      return `month${plural}`;
    case "years":
      return `year${plural}`;
    case "days":
    default:
      return `day${plural}`;
  }
}

export function calculateAveragePerDay(
  input: AveragePerDayInput,
): AveragePerDayResult {
  const unitLabel = sanitizeUnitLabel(input.unitLabel);

  let dayCount: number;
  let datesWereSwapped = false;
  let usedWorkingDays = false;
  let durationNote: string | null = null;

  if (input.periodKind === "duration") {
    if (input.periodAmount === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter the length of the period.",
      };
    }
    if (!Number.isFinite(input.periodAmount) || input.periodAmount <= 0) {
      return {
        ok: false,
        error: "zero_days",
        message: "Enter a period greater than zero.",
      };
    }
    dayCount = durationToDays(input.periodAmount, input.durationUnit);
    if (!Number.isFinite(dayCount) || dayCount <= 0) {
      return {
        ok: false,
        error: "zero_days",
        message: "Enter a period that covers at least one day.",
      };
    }
    if (input.durationUnit !== "days") {
      const amountFmt = formatAmount(input.periodAmount);
      const daysFmt = formatAmount(dayCount);
      durationNote = `${amountFmt} ${durationUnitLabel(input.durationUnit, input.periodAmount)} ≈ ${daysFmt} days`;
    }
  } else {
    if (!input.startDate || !input.endDate) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a start date and an end date.",
      };
    }

    if (input.workingDaysOnly) {
      const start = parseLocalYmd(input.startDate);
      const end = parseLocalYmd(input.endDate);
      if (!start || !end) {
        return {
          ok: false,
          error: "invalid_dates",
          message: "Enter valid start and end dates.",
        };
      }
      if (isBefore(end, start)) {
        return {
          ok: false,
          error: "end_before_start",
          message:
            "The end date is before the start date. Swap the dates or correct them.",
        };
      }
      dayCount = countBusinessDays(input.startDate, input.endDate, {
        includeEnd: input.includeEnd,
        ...input.businessOptions,
      });
      usedWorkingDays = true;
      if (dayCount <= 0) {
        return {
          ok: false,
          error: "zero_days",
          message:
            "That range has no working days with the current weekend and holiday settings.",
        };
      }
    } else {
      const resolved = resolveCalendarDayCount(
        input.startDate,
        input.endDate,
        input.includeEnd,
      );
      if (!resolved.ok) {
        if (resolved.error === "end_before_start") {
          return {
            ok: false,
            error: "end_before_start",
            message:
              "The end date is before the start date. Swap the dates or correct them.",
          };
        }
        if (resolved.error === "zero_days") {
          return {
            ok: false,
            error: "zero_days",
            message:
              "That date range covers zero days. Try including the end date or choosing a longer span.",
          };
        }
        return {
          ok: false,
          error: "invalid_dates",
          message: "Enter valid start and end dates.",
        };
      }
      dayCount = resolved.days;
      datesWereSwapped = resolved.swapped;
    }
  }

  if (input.mode === "daily-average") {
    if (input.total === null) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a total amount.",
      };
    }
    if (!Number.isFinite(input.total) || Math.abs(input.total) > MAX_ABS) {
      return {
        ok: false,
        error: "overflow",
        message: "Enter a total within a reasonable numeric range.",
      };
    }

    const perDay = input.total / dayCount;
    if (!Number.isFinite(perDay)) {
      return {
        ok: false,
        error: "overflow",
        message: "That calculation is too large to display.",
      };
    }

    return buildSuccess({
      dayCount,
      perDay,
      total: input.total,
      unitLabel,
      datesWereSwapped,
      usedWorkingDays,
      durationNote,
      mode: "daily-average",
    });
  }

  // find-total
  if (input.dailyAverage === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a daily average.",
    };
  }
  if (
    !Number.isFinite(input.dailyAverage) ||
    Math.abs(input.dailyAverage) > MAX_ABS
  ) {
    return {
      ok: false,
      error: "overflow",
      message: "Enter a daily average within a reasonable numeric range.",
    };
  }

  const total = input.dailyAverage * dayCount;
  if (!Number.isFinite(total) || Math.abs(total) > MAX_ABS) {
    return {
      ok: false,
      error: "overflow",
      message: "That total is too large to display.",
    };
  }

  return buildSuccess({
    dayCount,
    perDay: input.dailyAverage,
    total,
    unitLabel,
    datesWereSwapped,
    usedWorkingDays,
    durationNote,
    mode: "find-total",
  });
}

function buildSuccess(args: {
  dayCount: number;
  perDay: number;
  total: number;
  unitLabel: string;
  datesWereSwapped: boolean;
  usedWorkingDays: boolean;
  durationNote: string | null;
  mode: AveragePerDayMode;
}): AveragePerDaySuccess {
  const {
    dayCount,
    perDay,
    total,
    unitLabel,
    datesWereSwapped,
    usedWorkingDays,
    durationNote,
    mode,
  } = args;

  const perWeek = perDay * DAYS_PER_WEEK;
  const perMonth = perDay * DAYS_PER_MONTH;
  const perYear = perDay * DAYS_PER_YEAR;

  const dayWord = usedWorkingDays
    ? dayCount === 1
      ? "working day"
      : "working days"
    : dayCount === 1
      ? "day"
      : "days";

  const totalFmt = formatAmount(total);
  const perDayFmt = formatAmount(perDay);
  const dayCountFmt = formatAmount(dayCount);
  const periodPart = durationNote
    ? `${durationNote}`
    : `${dayCountFmt} ${dayWord}`;

  const working =
    mode === "daily-average"
      ? `${withUnit(totalFmt, unitLabel)} ÷ ${periodPart} = ${withUnit(perDayFmt, unitLabel)} per day`
      : `${withUnit(perDayFmt, unitLabel)} per day × ${periodPart} = ${withUnit(formatAmount(total), unitLabel)}`;

  return {
    ok: true,
    dayCount,
    perDay,
    perWeek,
    perMonth,
    perYear,
    total,
    working,
    displayPerDay: formatAmount(perDay),
    displayTotal: formatAmount(total),
    displayPerWeek: formatAmount(perWeek),
    displayPerMonth: formatAmount(perMonth),
    displayPerYear: formatAmount(perYear),
    unitLabel,
    datesWereSwapped,
    usedWorkingDays,
  };
}
