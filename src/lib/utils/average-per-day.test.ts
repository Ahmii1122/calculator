import { describe, expect, it } from "vitest";
import {
  calculateAveragePerDay,
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  durationToDays,
  formatAmount,
  resolveCalendarDayCount,
  sanitizeUnitLabel,
} from "@/lib/utils/average-per-day";

const baseDuration = {
  startDate: "",
  endDate: "",
  includeEnd: true,
  workingDaysOnly: false,
  unitLabel: "",
  durationUnit: "days" as const,
};

describe("resolveCalendarDayCount", () => {
  it("counts inclusive range 2026-01-01 to 2026-01-10 as 10 days", () => {
    const r = resolveCalendarDayCount("2026-01-01", "2026-01-10", true);
    expect(r).toEqual({ ok: true, days: 10, swapped: false });
  });

  it("counts exclusive end 2026-01-01 to 2026-01-10 as 9 days", () => {
    const r = resolveCalendarDayCount("2026-01-01", "2026-01-10", false);
    expect(r).toEqual({ ok: true, days: 9, swapped: false });
  });

  it("rejects end before start", () => {
    const r = resolveCalendarDayCount("2026-01-10", "2026-01-01", true);
    expect(r).toEqual({ ok: false, error: "end_before_start" });
  });
});

describe("durationToDays", () => {
  it("converts weeks, months, and years with fixed factors", () => {
    expect(durationToDays(2, "weeks")).toBe(14);
    expect(durationToDays(1, "months")).toBe(DAYS_PER_MONTH);
    expect(durationToDays(1, "years")).toBe(DAYS_PER_YEAR);
    expect(durationToDays(30, "days")).toBe(30);
  });
});

describe("calculateAveragePerDay", () => {
  it("1,200 over 30 days = 40 per day", () => {
    const r = calculateAveragePerDay({
      mode: "daily-average",
      total: 1200,
      dailyAverage: null,
      periodKind: "duration",
      periodAmount: 30,
      ...baseDuration,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.perDay).toBe(40);
    expect(r.displayPerDay).toBe("40");
    expect(r.working).toContain("1,200");
    expect(r.working).toContain("30");
    expect(r.working).toContain("40");
  });

  it("1,200 over 1 month uses 365÷12 days", () => {
    const r = calculateAveragePerDay({
      mode: "daily-average",
      total: 1200,
      dailyAverage: null,
      periodKind: "duration",
      periodAmount: 1,
      ...baseDuration,
      durationUnit: "months",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dayCount).toBeCloseTo(DAYS_PER_MONTH, 5);
    expect(r.perDay).toBeCloseTo(1200 / DAYS_PER_MONTH, 5);
    expect(r.working).toMatch(/1 month/);
  });

  it("40 per day × 1 year = 14,600 total", () => {
    const r = calculateAveragePerDay({
      mode: "find-total",
      total: null,
      dailyAverage: 40,
      periodKind: "duration",
      periodAmount: 1,
      ...baseDuration,
      durationUnit: "years",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.total).toBe(14600);
    expect(r.displayTotal).toBe("14,600");
  });

  it("1,000 between 2026-01-01 and 2026-01-10 including end = 100 per day", () => {
    const r = calculateAveragePerDay({
      mode: "daily-average",
      total: 1000,
      dailyAverage: null,
      periodKind: "date-range",
      periodAmount: null,
      ...baseDuration,
      startDate: "2026-01-01",
      endDate: "2026-01-10",
      includeEnd: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dayCount).toBe(10);
    expect(r.perDay).toBe(100);
  });

  it("1,000 between 2026-01-01 and 2026-01-10 excluding end = 111.11 per day", () => {
    const r = calculateAveragePerDay({
      mode: "daily-average",
      total: 1000,
      dailyAverage: null,
      periodKind: "date-range",
      periodAmount: null,
      ...baseDuration,
      startDate: "2026-01-01",
      endDate: "2026-01-10",
      includeEnd: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dayCount).toBe(9);
    expect(r.displayPerDay).toBe("111.11");
  });

  it("40 per day × 30 days = 1,200 total", () => {
    const r = calculateAveragePerDay({
      mode: "find-total",
      total: null,
      dailyAverage: 40,
      periodKind: "duration",
      periodAmount: 30,
      ...baseDuration,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.total).toBe(1200);
    expect(r.displayTotal).toBe("1,200");
  });

  it("yearly figure for 40 per day = 14,600", () => {
    const r = calculateAveragePerDay({
      mode: "daily-average",
      total: 1200,
      dailyAverage: null,
      periodKind: "duration",
      periodAmount: 30,
      ...baseDuration,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.perYear).toBe(14600);
    expect(r.displayPerYear).toBe("14,600");
  });

  it("never returns NaN or Infinity for empty or zero days", () => {
    const empty = calculateAveragePerDay({
      mode: "daily-average",
      total: null,
      dailyAverage: null,
      periodKind: "duration",
      periodAmount: null,
      ...baseDuration,
    });
    expect(empty.ok).toBe(false);

    const zero = calculateAveragePerDay({
      mode: "daily-average",
      total: 100,
      dailyAverage: null,
      periodKind: "duration",
      periodAmount: 0,
      ...baseDuration,
    });
    expect(zero.ok).toBe(false);
  });

  it("sanitizes unit labels to 12 characters of plain text", () => {
    expect(sanitizeUnitLabel("USD per day!!!").length).toBeLessThanOrEqual(12);
    expect(sanitizeUnitLabel("<script>")).not.toContain("<");
  });

  it("formats large and decimal amounts safely", () => {
    expect(formatAmount(1200)).toBe("1,200");
    expect(formatAmount(1000 / 9)).toBe("111.11");
  });
});
