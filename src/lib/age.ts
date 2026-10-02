import {
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInWeeks,
  format,
  intervalToDuration,
  isAfter,
  isBefore,
  isLeapYear,
  isSameDay,
  startOfDay,
} from "date-fns";
import {
  formatNaturalBreakdown,
  parseDateInput,
  toDateInputValue,
} from "@/lib/date-span";

export type AgeBreakdown = {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  totalHours: number;
  bornWeekday: string;
  nextBirthday: Date;
  nextBirthdayWeekday: string;
  daysUntilBirthday: number;
  isBirthdayToday: boolean;
  /** True when the next observed birthday uses March 1 for a Feb 29 birth in a non-leap year. */
  nextBirthdayUsesMarch1: boolean;
  summary: string;
};

export type AgeCalculation =
  | { ok: true; result: AgeBreakdown }
  | {
      ok: false;
      error: "invalid" | "future_birth" | "age_at_before_birth";
    };

/**
 * Next birthday on or after `from`, using local calendar dates.
 * Feb 29 births observe March 1 in non-leap years.
 */
export function getNextBirthday(
  birth: Date,
  from: Date,
): { date: Date; usedMarch1: boolean } {
  const fromDay = startOfDay(from);
  let year = fromDay.getFullYear();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const leap = isLeapYear(new Date(year, 0, 1));
    let usedMarch1 = false;
    let month = birth.getMonth();
    let day = birth.getDate();

    if (month === 1 && day === 29 && !leap) {
      month = 2;
      day = 1;
      usedMarch1 = true;
    }

    const candidate = startOfDay(new Date(year, month, day));
    if (
      isSameDay(candidate, fromDay) ||
      isAfter(candidate, fromDay)
    ) {
      return { date: candidate, usedMarch1 };
    }

    year += 1;
  }

  // Fallback — should not reach for valid local dates
  const fallback = startOfDay(addYears(birth, fromDay.getFullYear() - birth.getFullYear() + 1));
  return { date: fallback, usedMarch1: false };
}

/**
 * Exact age between date of birth and an "age at" date (local calendar, date-fns).
 */
export function calculateAge(
  birthValue: string,
  ageAtValue: string,
  todayValue?: string,
): AgeCalculation {
  const birth = parseDateInput(birthValue);
  const ageAt = parseDateInput(ageAtValue);
  if (!birth || !ageAt) return { ok: false, error: "invalid" };

  const birthDay = startOfDay(birth);
  const atDay = startOfDay(ageAt);
  const today = startOfDay(
    parseDateInput(todayValue ?? toDateInputValue(new Date())) ?? new Date(),
  );

  if (isBefore(atDay, birthDay)) {
    return { ok: false, error: "age_at_before_birth" };
  }

  if (isAfter(birthDay, today)) {
    return { ok: false, error: "future_birth" };
  }

  const duration = intervalToDuration({ start: birthDay, end: atDay });
  const years = duration.years ?? 0;
  const months = duration.months ?? 0;
  const days = duration.days ?? 0;

  const totalDays = differenceInCalendarDays(atDay, birthDay);
  const totalMonths = differenceInCalendarMonths(atDay, birthDay);
  const totalWeeks = differenceInWeeks(atDay, birthDay);

  const { date: nextBirthday, usedMarch1 } = getNextBirthday(birthDay, atDay);
  const daysUntilBirthday = differenceInCalendarDays(nextBirthday, atDay);

  return {
    ok: true,
    result: {
      years,
      months,
      days,
      totalMonths,
      totalWeeks,
      totalDays,
      totalHours: totalDays * 24,
      bornWeekday: format(birthDay, "EEEE"),
      nextBirthday,
      nextBirthdayWeekday: format(nextBirthday, "EEEE"),
      daysUntilBirthday,
      isBirthdayToday: daysUntilBirthday === 0,
      nextBirthdayUsesMarch1: usedMarch1,
      summary: formatNaturalBreakdown(years, months, days),
    },
  };
}

export { formatNaturalBreakdown, parseDateInput, toDateInputValue };
