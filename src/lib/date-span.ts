import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  getDay,
  intervalToDuration,
  isBefore,
  isValid,
  parseISO,
} from "date-fns";

export type DateSpanResult = {
  totalDays: number;
  businessDays: number;
  weekendDays: number;
  weeks: number;
  weekRemainderDays: number;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  yearPercent: number;
  orderedStart: Date;
  orderedEnd: Date;
  wasSwapped: boolean;
};

export type DateSpanOptions = {
  includeEndDate?: boolean;
  /** When true, Saturday counts as a business day (Sun-only weekend). Default: false (Sat+Sun weekend). */
  saturdayAsBusinessDay?: boolean;
};

export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function pluralize(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export function formatNaturalBreakdown(
  years: number,
  months: number,
  days: number,
): string {
  const parts: string[] = [];
  if (years > 0) parts.push(pluralize(years, "year"));
  if (months > 0) parts.push(pluralize(months, "month"));
  if (days > 0 || parts.length === 0) parts.push(pluralize(days, "day"));
  return parts.join(", ");
}

/** True when the day is treated as non-working for the chosen week pattern. */
export function isNonWorkingDay(
  date: Date,
  saturdayAsBusinessDay = false,
): boolean {
  const day = getDay(date); // 0 Sun … 6 Sat
  if (saturdayAsBusinessDay) return day === 0; // Sunday only
  return day === 0 || day === 6; // Sat + Sun
}

/**
 * Compute calendar / business day stats between two dates using date-fns.
 * When end < start, dates are ordered for calculation (inputs are not mutated).
 */
export function calculateDateSpan(
  startValue: string,
  endValue: string,
  includeEndDateOrOptions: boolean | DateSpanOptions = true,
): DateSpanResult | null {
  const options: DateSpanOptions =
    typeof includeEndDateOrOptions === "boolean"
      ? { includeEndDate: includeEndDateOrOptions }
      : includeEndDateOrOptions;

  const includeEndDate = options.includeEndDate ?? true;
  const saturdayAsBusinessDay = options.saturdayAsBusinessDay ?? false;

  const start = parseDateInput(startValue);
  const end = parseDateInput(endValue);
  if (!start || !end) return null;

  const wasSwapped = isBefore(end, start);
  const orderedStart = wasSwapped ? end : start;
  const orderedEnd = wasSwapped ? start : end;

  const exclusiveDays = differenceInCalendarDays(orderedEnd, orderedStart);
  const totalDays = Math.max(0, exclusiveDays + (includeEndDate ? 1 : 0));

  let businessDays = 0;
  let weekendDays = 0;

  if (totalDays > 0) {
    const rangeEnd = includeEndDate ? orderedEnd : addDays(orderedEnd, -1);
    if (!isBefore(rangeEnd, orderedStart)) {
      const days = eachDayOfInterval({ start: orderedStart, end: rangeEnd });
      for (const day of days) {
        if (isNonWorkingDay(day, saturdayAsBusinessDay)) weekendDays += 1;
        else businessDays += 1;
      }
    }
  }

  const durationEnd = includeEndDate ? addDays(orderedEnd, 1) : orderedEnd;
  const duration =
    totalDays === 0
      ? { years: 0, months: 0, days: 0 }
      : intervalToDuration({
          start: orderedStart,
          end: durationEnd,
        });

  const yearLength =
    differenceInCalendarDays(
      new Date(orderedStart.getFullYear() + 1, 0, 1),
      new Date(orderedStart.getFullYear(), 0, 1),
    ) || 365;

  return {
    totalDays,
    businessDays,
    weekendDays,
    weeks: Math.floor(totalDays / 7),
    weekRemainderDays: totalDays % 7,
    years: duration.years ?? 0,
    months: duration.months ?? 0,
    days: duration.days ?? 0,
    hours: totalDays * 24,
    minutes: totalDays * 24 * 60,
    seconds: totalDays * 24 * 60 * 60,
    yearPercent: Number(((totalDays / yearLength) * 100).toFixed(1)),
    orderedStart,
    orderedEnd,
    wasSwapped,
  };
}

export function formatRangeLabel(start: Date, end: Date): string {
  return `Range: ${format(start, "MMM d, yyyy")} — ${format(end, "MMM d, yyyy")}`;
}

export function dayOfWeekLabel(value: string): string | null {
  const date = parseDateInput(value);
  if (!date) return null;
  return format(date, "EEEE");
}
