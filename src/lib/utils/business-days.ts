import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";

/** date-fns getDay(): 0 = Sunday … 6 = Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: { day: Weekday; short: string; long: string }[] = [
  { day: 1, short: "Mon", long: "Monday" },
  { day: 2, short: "Tue", long: "Tuesday" },
  { day: 3, short: "Wed", long: "Wednesday" },
  { day: 4, short: "Thu", long: "Thursday" },
  { day: 5, short: "Fri", long: "Friday" },
  { day: 6, short: "Sat", long: "Saturday" },
  { day: 0, short: "Sun", long: "Sunday" },
];

export const DEFAULT_NON_WORKING: ReadonlySet<Weekday> = new Set([0, 6]);

export const MAX_BUSINESS_DAY_STEPS = 10_000;

export const ALL_SEVEN_REJECT_MESSAGE =
  "Choose at least one working weekday. All seven days cannot be non-working.";

export const STEP_CAP_MESSAGE =
  "That shift is too large to calculate (limit 10,000 steps). Try a smaller amount.";

/** Compact holiday row from generated JSON (short keys). */
export type CompactHoliday = {
  d: string;
  n: string;
  t: string;
  s?: number;
  l?: number;
};

export type HolidayRecord = {
  date: string;
  name: string;
  type: string;
  substitute: boolean;
  lunar: boolean;
};

export type HolidaySet = {
  /** YYYY-MM-DD → holiday names on that date (deduped). */
  byDate: Map<string, string[]>;
  /** Unique dates that count as holidays after type/custom filters. */
  dates: Set<string>;
  records: HolidayRecord[];
};

export type BuildHolidaySetOptions = {
  types?: ReadonlySet<string> | readonly string[];
  customDates?: readonly string[];
};

export type CountBusinessDaysOptions = {
  includeEnd?: boolean;
  nonWorkingWeekdays?: ReadonlySet<number>;
  holidaySet?: HolidaySet | null;
};

export type AddBusinessDaysOptions = {
  nonWorkingWeekdays?: ReadonlySet<number>;
  holidaySet?: HolidaySet | null;
};

export type BusinessDayBreakdown = {
  totalDays: number;
  weekendDays: number;
  holidayDays: number;
  businessDays: number;
  excludedHolidays: HolidayRecord[];
  noEffectHolidays: HolidayRecord[];
  arithmeticLine: string;
};

function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function toYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function normalizeNonWorkingWeekdays(
  input: ReadonlySet<number> | readonly number[] | null | undefined,
): Set<Weekday> {
  const source = input
    ? input instanceof Set
      ? [...input]
      : [...input]
    : [0, 6];
  const next = new Set<Weekday>();
  for (const d of source) {
    if (d >= 0 && d <= 6) next.add(d as Weekday);
  }
  if (next.size === 0) {
    return new Set(DEFAULT_NON_WORKING);
  }
  return next;
}

/** Reject selecting all seven weekdays as non-working. */
export function canSetNonWorkingWeekdays(
  next: ReadonlySet<number> | readonly number[],
): { ok: true; value: Set<Weekday> } | { ok: false; message: string } {
  const set = normalizeNonWorkingWeekdays(next);
  if (set.size >= 7) {
    return { ok: false, message: ALL_SEVEN_REJECT_MESSAGE };
  }
  return { ok: true, value: set };
}

export function isWorkingDay(
  date: Date,
  nonWorkingWeekdays: ReadonlySet<number> = DEFAULT_NON_WORKING,
  holidayDates: ReadonlySet<string> | null | undefined = null,
): boolean {
  const day = getDay(date);
  if (nonWorkingWeekdays.has(day)) return false;
  if (holidayDates && holidayDates.has(toYmd(date))) return false;
  return true;
}

export function buildHolidaySet(
  holidayList: readonly CompactHoliday[] | readonly HolidayRecord[],
  options: BuildHolidaySetOptions = {},
): HolidaySet {
  const typeFilter = options.types
    ? options.types instanceof Set
      ? options.types
      : new Set(options.types)
    : null;

  const byDate = new Map<string, string[]>();
  const records: HolidayRecord[] = [];

  for (const raw of holidayList) {
    const isCompact = "d" in raw;
    const date = isCompact ? raw.d : raw.date;
    const name = isCompact ? raw.n : raw.name;
    const type = isCompact ? raw.t : raw.type;
    const substitute = isCompact ? Boolean(raw.s) : Boolean(raw.substitute);
    const lunar = isCompact ? Boolean(raw.l) : Boolean(raw.lunar);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (typeFilter && !typeFilter.has(type)) continue;

    const names = byDate.get(date) ?? [];
    if (!names.includes(name)) names.push(name);
    byDate.set(date, names);

    records.push({ date, name, type, substitute, lunar });
  }

  for (const custom of options.customDates ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(custom)) continue;
    const names = byDate.get(custom) ?? [];
    if (!names.includes("Custom day off")) names.push("Custom day off");
    byDate.set(custom, names);
    records.push({
      date: custom,
      name: "Custom day off",
      type: "custom",
      substitute: false,
      lunar: false,
    });
  }

  return {
    byDate,
    dates: new Set(byDate.keys()),
    records,
  };
}

function orderedRange(
  startValue: string,
  endValue: string,
  includeEnd: boolean,
): { start: Date; end: Date; totalDays: number } | null {
  const startRaw = parseLocalDate(startValue);
  const endRaw = parseLocalDate(endValue);
  if (!startRaw || !endRaw) return null;

  const wasSwapped = isBefore(endRaw, startRaw);
  const start = wasSwapped ? endRaw : startRaw;
  const end = wasSwapped ? startRaw : endRaw;

  const exclusive = differenceInCalendarDays(end, start);
  const totalDays = Math.max(0, exclusive + (includeEnd ? 1 : 0));
  if (totalDays === 0) {
    return { start, end, totalDays: 0 };
  }

  const rangeEnd = includeEnd ? end : addDays(end, -1);
  if (isBefore(rangeEnd, start)) {
    return { start, end, totalDays: 0 };
  }

  return { start, end: rangeEnd, totalDays };
}

/**
 * Count weekdays that are not in nonWorkingWeekdays (holidays ignored).
 * Uses whole-week arithmetic + remainder instead of walking every day.
 */
export function countWeekdaysInRange(
  start: Date,
  inclusiveEnd: Date,
  nonWorkingWeekdays: ReadonlySet<number>,
): number {
  const totalDays = differenceInCalendarDays(inclusiveEnd, start) + 1;
  if (totalDays <= 0) return 0;

  const workingPerWeek = 7 - nonWorkingWeekdays.size;
  if (workingPerWeek <= 0) return 0;

  const fullWeeks = Math.floor(totalDays / 7);
  let count = fullWeeks * workingPerWeek;

  const remainder = totalDays % 7;
  for (let i = 0; i < remainder; i++) {
    const day = getDay(addDays(start, fullWeeks * 7 + i));
    if (!nonWorkingWeekdays.has(day)) count += 1;
  }
  return count;
}

/** Brute-force weekday+holiday count for tests and verification. */
export function countBusinessDaysBruteForce(
  startValue: string,
  endValue: string,
  options: CountBusinessDaysOptions = {},
): number {
  const includeEnd = options.includeEnd ?? true;
  const nonWorking = normalizeNonWorkingWeekdays(options.nonWorkingWeekdays);
  const holidays = options.holidaySet?.dates ?? null;
  const range = orderedRange(startValue, endValue, includeEnd);
  if (!range || range.totalDays === 0) return 0;

  let count = 0;
  let cursor = range.start;
  for (let i = 0; i < range.totalDays; i++) {
    if (isWorkingDay(cursor, nonWorking, holidays)) count += 1;
    cursor = addDays(cursor, 1);
  }
  return count;
}

/**
 * Count business days with arithmetic weekdays then subtract in-range holidays
 * that fall on working weekdays (never double-count weekend holidays).
 */
export function countBusinessDays(
  startValue: string,
  endValue: string,
  options: CountBusinessDaysOptions = {},
): number {
  const includeEnd = options.includeEnd ?? true;
  const nonWorking = normalizeNonWorkingWeekdays(options.nonWorkingWeekdays);
  const range = orderedRange(startValue, endValue, includeEnd);
  if (!range || range.totalDays === 0) return 0;

  const weekdays = countWeekdaysInRange(range.start, range.end, nonWorking);
  const holidays = options.holidaySet;
  if (!holidays || holidays.dates.size === 0) return weekdays;

  let holidayHits = 0;
  for (const dateStr of holidays.dates) {
    const d = parseLocalDate(dateStr);
    if (!d) continue;
    if (isBefore(d, range.start) || isBefore(range.end, d)) continue;
    if (nonWorking.has(getDay(d) as Weekday)) continue;
    holidayHits += 1;
  }
  return Math.max(0, weekdays - holidayHits);
}

export function analyzeBusinessDays(
  startValue: string,
  endValue: string,
  options: CountBusinessDaysOptions = {},
): BusinessDayBreakdown | null {
  const includeEnd = options.includeEnd ?? true;
  const nonWorking = normalizeNonWorkingWeekdays(options.nonWorkingWeekdays);
  const range = orderedRange(startValue, endValue, includeEnd);
  if (!range) return null;

  const totalDays = range.totalDays;
  if (totalDays === 0) {
    return {
      totalDays: 0,
      weekendDays: 0,
      holidayDays: 0,
      businessDays: 0,
      excludedHolidays: [],
      noEffectHolidays: [],
      arithmeticLine: "0 days = 0 business days",
    };
  }

  const weekdays = countWeekdaysInRange(range.start, range.end, nonWorking);
  const weekendDays = totalDays - weekdays;

  const excludedHolidays: HolidayRecord[] = [];
  const noEffectHolidays: HolidayRecord[] = [];
  const seenExcluded = new Set<string>();
  const seenNoEffect = new Set<string>();

  const holidays = options.holidaySet;
  if (holidays) {
    for (const rec of holidays.records) {
      const d = parseLocalDate(rec.date);
      if (!d) continue;
      if (isBefore(d, range.start) || isBefore(range.end, d)) continue;
      if (nonWorking.has(getDay(d) as Weekday)) {
        if (!seenNoEffect.has(rec.date)) {
          seenNoEffect.add(rec.date);
          noEffectHolidays.push(rec);
        }
      } else if (!seenExcluded.has(rec.date)) {
        seenExcluded.add(rec.date);
        excludedHolidays.push(rec);
      }
    }
  }

  const holidayDays = excludedHolidays.length;
  const businessDays = Math.max(0, weekdays - holidayDays);

  const parts = [`${totalDays} day${totalDays === 1 ? "" : "s"}`];
  if (weekendDays > 0) {
    parts.push(
      `${weekendDays} weekend day${weekendDays === 1 ? "" : "s"}`,
    );
  }
  if (holidayDays > 0) {
    parts.push(`${holidayDays} holiday${holidayDays === 1 ? "" : "s"}`);
  }
  const arithmeticLine =
    parts.length === 1
      ? `${parts[0]} = ${businessDays} business day${businessDays === 1 ? "" : "s"}`
      : `${parts[0]} − ${parts.slice(1).join(" − ")} = ${businessDays} business day${businessDays === 1 ? "" : "s"}`;

  return {
    totalDays,
    weekendDays,
    holidayDays,
    businessDays,
    excludedHolidays: excludedHolidays.sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    noEffectHolidays: noEffectHolidays.sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    arithmeticLine,
  };
}

export type AddBusinessDaysResult =
  | { ok: true; date: Date; ymd: string }
  | { ok: false; message: string };

/**
 * Add (or subtract when n < 0) business days, stepping day by day.
 * Hard cap of 10,000 calendar steps.
 */
export function addBusinessDays(
  startValue: string | Date,
  n: number,
  options: AddBusinessDaysOptions = {},
): AddBusinessDaysResult {
  const start =
    typeof startValue === "string"
      ? parseLocalDate(startValue)
      : isValid(startValue)
        ? startOfDay(startValue)
        : null;
  if (!start) {
    return { ok: false, message: "Enter a valid start date." };
  }

  const steps = Math.trunc(n);
  if (steps === 0) {
    return { ok: true, date: start, ymd: toYmd(start) };
  }

  const nonWorking = normalizeNonWorkingWeekdays(options.nonWorkingWeekdays);
  const holidays = options.holidaySet?.dates ?? null;
  const direction = steps > 0 ? 1 : -1;
  let remaining = Math.abs(steps);
  let current = start;
  let walked = 0;

  while (remaining > 0) {
    walked += 1;
    if (walked > MAX_BUSINESS_DAY_STEPS) {
      return { ok: false, message: STEP_CAP_MESSAGE };
    }
    current = addDays(current, direction);
    if (isWorkingDay(current, nonWorking, holidays)) {
      remaining -= 1;
    }
  }

  return { ok: true, date: current, ymd: toYmd(current) };
}

/** Map legacy Saturday-as-working toggle to a non-working set. */
export function nonWorkingFromSaturdayFlag(
  saturdayAsBusinessDay: boolean,
): Set<Weekday> {
  return saturdayAsBusinessDay ? new Set<Weekday>([0]) : new Set(DEFAULT_NON_WORKING);
}
