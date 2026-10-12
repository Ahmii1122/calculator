import { describe, expect, it } from "vitest";
import { addDays, format, getDay, parseISO } from "date-fns";
import {
  addBusinessDays,
  ALL_SEVEN_REJECT_MESSAGE,
  analyzeBusinessDays,
  buildHolidaySet,
  canSetNonWorkingWeekdays,
  countBusinessDays,
  countBusinessDaysBruteForce,
  DEFAULT_NON_WORKING,
  isWorkingDay,
  type CompactHoliday,
} from "./business-days";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FIXTURE: CompactHoliday[] = [
  { d: "2025-12-25", n: "Christmas Day", t: "public" },
  { d: "2026-01-01", n: "New Year's Day", t: "public" },
  { d: "2026-01-03", n: "Weekend Holiday", t: "public" },
];

const satSun = new Set([0, 6]);
const friSat = new Set([5, 6]);

describe("isWorkingDay", () => {
  it("treats Sat/Sun as non-working by default", () => {
    expect(isWorkingDay(parseISO("2025-12-22"), satSun)).toBe(true); // Mon
    expect(isWorkingDay(parseISO("2025-12-27"), satSun)).toBe(false); // Sat
    expect(isWorkingDay(parseISO("2025-12-28"), satSun)).toBe(false); // Sun
  });

  it("excludes holidays only on working weekdays", () => {
    const holidays = new Set(["2025-12-25"]);
    expect(isWorkingDay(parseISO("2025-12-25"), satSun, holidays)).toBe(false);
    expect(isWorkingDay(parseISO("2025-12-24"), satSun, holidays)).toBe(true);
  });
});

describe("buildHolidaySet", () => {
  it("dedupes two holidays on the same date", () => {
    const set = buildHolidaySet([
      { d: "2025-12-25", n: "A", t: "public" },
      { d: "2025-12-25", n: "B", t: "public" },
    ]);
    expect(set.dates.size).toBe(1);
    expect(set.byDate.get("2025-12-25")).toEqual(["A", "B"]);
  });

  it("filters by type and merges custom dates", () => {
    const set = buildHolidaySet(
      [
        { d: "2025-12-25", n: "Christmas", t: "public" },
        { d: "2025-12-26", n: "Bank Day", t: "bank" },
      ],
      { types: ["public"], customDates: ["2025-12-24"] },
    );
    expect(set.dates.has("2025-12-25")).toBe(true);
    expect(set.dates.has("2025-12-26")).toBe(false);
    expect(set.dates.has("2025-12-24")).toBe(true);
  });
});

describe("countBusinessDays fixtures", () => {
  const holidaySet = buildHolidaySet(FIXTURE, { types: ["public"] });

  it("Mon 2025-12-22 to Fri 2025-12-26 inclusive: 5 weekdays, 4 with Dec 25", () => {
    expect(
      countBusinessDays("2025-12-22", "2025-12-26", {
        includeEnd: true,
        nonWorkingWeekdays: satSun,
      }),
    ).toBe(5);
    expect(
      countBusinessDays("2025-12-22", "2025-12-26", {
        includeEnd: true,
        nonWorkingWeekdays: satSun,
        holidaySet,
      }),
    ).toBe(4);
  });

  it("same range end exclusive: 4 weekdays, 3 with holiday", () => {
    expect(
      countBusinessDays("2025-12-22", "2025-12-26", {
        includeEnd: false,
        nonWorkingWeekdays: satSun,
      }),
    ).toBe(4);
    expect(
      countBusinessDays("2025-12-22", "2025-12-26", {
        includeEnd: false,
        nonWorkingWeekdays: satSun,
        holidaySet,
      }),
    ).toBe(3);
  });

  it("Mon 2025-12-29 to Sun 2026-01-04 inclusive: weekend holiday has no effect", () => {
    const onlySat = buildHolidaySet(
      [{ d: "2026-01-03", n: "Weekend Holiday", t: "public" }],
      { types: ["public"] },
    );
    expect(
      countBusinessDays("2025-12-29", "2026-01-04", {
        includeEnd: true,
        nonWorkingWeekdays: satSun,
        holidaySet: onlySat,
      }),
    ).toBe(5);

    const withNewYear = buildHolidaySet(
      [
        { d: "2026-01-01", n: "New Year's Day", t: "public" },
        { d: "2026-01-03", n: "Weekend Holiday", t: "public" },
      ],
      { types: ["public"] },
    );
    expect(
      countBusinessDays("2025-12-29", "2026-01-04", {
        includeEnd: true,
        nonWorkingWeekdays: satSun,
        holidaySet: withNewYear,
      }),
    ).toBe(4);

    const analysis = analyzeBusinessDays("2025-12-29", "2026-01-04", {
      includeEnd: true,
      nonWorkingWeekdays: satSun,
      holidaySet: withNewYear,
    });
    expect(analysis?.noEffectHolidays.some((h) => h.date === "2026-01-03")).toBe(
      true,
    );
    expect(analysis?.excludedHolidays.some((h) => h.date === "2026-01-01")).toBe(
      true,
    );
  });

  it("Fri-Sat weekend: Mon–Sun inclusive gives 5 working days", () => {
    expect(
      countBusinessDays("2025-12-22", "2025-12-28", {
        includeEnd: true,
        nonWorkingWeekdays: friSat,
      }),
    ).toBe(5);
  });

  it("zero holidays and no country match weekends-only baseline", () => {
    const empty = buildHolidaySet([]);
    expect(
      countBusinessDays("2025-12-22", "2025-12-26", {
        includeEnd: true,
        nonWorkingWeekdays: satSun,
        holidaySet: empty,
      }),
    ).toBe(
      countBusinessDays("2025-12-22", "2025-12-26", {
        includeEnd: true,
        nonWorkingWeekdays: satSun,
      }),
    );
  });
});

describe("addBusinessDays", () => {
  it("Fri 2025-12-26 + 1 = Mon 2025-12-29", () => {
    const r = addBusinessDays("2025-12-26", 1, {
      nonWorkingWeekdays: satSun,
    });
    expect(r.ok && r.ymd).toBe("2025-12-29");
  });

  it("Fri 2025-12-26 + 5 with no holidays = Fri 2026-01-02", () => {
    const r = addBusinessDays("2025-12-26", 5, {
      nonWorkingWeekdays: satSun,
    });
    expect(r.ok && r.ymd).toBe("2026-01-02");
  });

  it("Fri 2025-12-26 + 5 with Jan 1 holiday = Mon 2026-01-05", () => {
    const holidaySet = buildHolidaySet(
      [{ d: "2026-01-01", n: "New Year's Day", t: "public" }],
      { types: ["public"] },
    );
    const r = addBusinessDays("2025-12-26", 5, {
      nonWorkingWeekdays: satSun,
      holidaySet,
    });
    expect(r.ok && r.ymd).toBe("2026-01-05");
  });

  it("Mon 2025-12-29 − 1 = Fri 2025-12-26", () => {
    const r = addBusinessDays("2025-12-29", -1, {
      nonWorkingWeekdays: satSun,
    });
    expect(r.ok && r.ymd).toBe("2025-12-26");
  });
});

describe("canSetNonWorkingWeekdays", () => {
  it("rejects all seven weekdays", () => {
    const r = canSetNonWorkingWeekdays([0, 1, 2, 3, 4, 5, 6]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(ALL_SEVEN_REJECT_MESSAGE);
  });

  it("accepts default weekend", () => {
    const r = canSetNonWorkingWeekdays(DEFAULT_NON_WORKING);
    expect(r.ok).toBe(true);
  });
});

describe("arithmetic vs brute-force", () => {
  it("matches on at least 1,000 random ranges", () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    const base = parseISO("2024-01-01");
    for (let i = 0; i < 1000; i++) {
      const a = Math.floor(rand() * 900);
      const b = Math.floor(rand() * 900);
      const start = addDays(base, Math.min(a, b));
      const end = addDays(base, Math.max(a, b));
      const startYmd = format(start, "yyyy-MM-dd");
      const endYmd = format(end, "yyyy-MM-dd");
      const includeEnd = rand() > 0.5;

      const weekendSize = 1 + Math.floor(rand() * 3);
      const nonWorking = new Set<number>();
      while (nonWorking.size < weekendSize) {
        nonWorking.add(Math.floor(rand() * 7));
      }

      const holidayCount = Math.floor(rand() * 8);
      const compact: CompactHoliday[] = [];
      for (let h = 0; h < holidayCount; h++) {
        const d = addDays(start, Math.floor(rand() * (differenceDays(start, end) + 1)));
        compact.push({
          d: format(d, "yyyy-MM-dd"),
          n: `H${h}`,
          t: "public",
        });
      }
      const holidaySet = buildHolidaySet(compact, { types: ["public"] });

      const opts = { includeEnd, nonWorkingWeekdays: nonWorking, holidaySet };
      expect(countBusinessDays(startYmd, endYmd, opts)).toBe(
        countBusinessDaysBruteForce(startYmd, endYmd, opts),
      );
    }
  });
});

function differenceDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

describe("generated holiday files", () => {
  const out = join(process.cwd(), "public", "data", "holidays");

  it("exist for several countries with valid year window and dates", () => {
    if (!existsSync(out)) {
      throw new Error(
        "public/data/holidays missing — run npm run generate:holidays first",
      );
    }

    const countries = JSON.parse(
      readFileSync(join(out, "countries.json"), "utf8"),
    );
    expect(countries.countries.length).toBeGreaterThanOrEqual(150);
    expect(countries.meta.firstYear).toBeTypeOf("number");
    expect(countries.meta.lastYear).toBe(
      countries.meta.firstYear + 7,
    );

    for (const code of ["US", "GB", "PK", "DE", "IN"]) {
      const file = join(out, `${code}.json`);
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(0);
      const data = JSON.parse(readFileSync(file, "utf8"));
      expect(data.meta.firstYear).toBe(countries.meta.firstYear);
      expect(data.meta.lastYear).toBe(countries.meta.lastYear);

      const seen = new Set<string>();
      for (const h of data.h) {
        expect(h.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const key = `${h.d}|${h.n}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        const y = Number(h.d.slice(0, 4));
        expect(y).toBeGreaterThanOrEqual(data.meta.firstYear);
        expect(y).toBeLessThanOrEqual(data.meta.lastYear);
      }
    }

    const files = readdirSync(out).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(150);
  });
});

// silence unused import warning for getDay in case tree-shake
void getDay;
