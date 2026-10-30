import { describe, expect, it } from "vitest";
import {
  amountForPeriod,
  calculateSalaryHourly,
  formatPayNumber,
  PAY_PERIODS,
  roundMoney,
  type PayPeriod,
} from "@/lib/utils/salary-hourly";

const base = {
  hoursPerWeek: 40,
  daysPerWeek: 5,
  weeksPerYear: 52,
  unpaidWeeksOff: null as number | null,
};

describe("calculateSalaryHourly", () => {
  it("20 per hour, 40 hours, 52 weeks matches hand-checked breakdown", () => {
    const r = calculateSalaryHourly({
      amount: 20,
      period: "hourly",
      ...base,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.amounts.yearly).toBe(41600);
    expect(r.amounts.weekly).toBe(800);
    expect(r.amounts.biweekly).toBe(1600);
    expect(roundMoney(r.amounts.semimonthly)).toBe(1733.33);
    expect(roundMoney(r.amounts.monthly)).toBe(3466.67);
    expect(r.amounts.quarterly).toBe(10400);
    expect(r.amounts.daily).toBe(160);
    expect(r.amounts.hourly).toBe(20);
    expect(r.working).toBe("20 × 40 hours × 52 weeks = 41,600 per year");
    expect(formatPayNumber(r.amounts.semimonthly)).toBe("1,733.33");
    expect(formatPayNumber(r.amounts.monthly)).toBe("3,466.67");
  });

  it("60,000 yearly salary gives about 28.85 per hour", () => {
    const r = calculateSalaryHourly({
      amount: 60000,
      period: "yearly",
      ...base,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(roundMoney(r.amounts.hourly)).toBe(28.85);
  });

  it("round-trips each period back to the original amount", () => {
    const original = calculateSalaryHourly({
      amount: 20,
      period: "hourly",
      ...base,
    });
    expect(original.ok).toBe(true);
    if (!original.ok) return;

    for (const { id } of PAY_PERIODS) {
      const period = id as PayPeriod;
      const entered = amountForPeriod(original.amounts, period);
      const back = calculateSalaryHourly({
        amount: entered,
        period,
        ...base,
      });
      expect(back.ok).toBe(true);
      if (!back.ok) return;
      expect(roundMoney(back.amounts.hourly)).toBe(20);
      expect(roundMoney(back.amounts.yearly)).toBe(41600);
    }
  });

  it("subtracts unpaid weeks off from weeks worked", () => {
    const r = calculateSalaryHourly({
      amount: 20,
      period: "hourly",
      hoursPerWeek: 40,
      daysPerWeek: 5,
      weeksPerYear: 52,
      unpaidWeeksOff: 2,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.weeksWorked).toBe(50);
    expect(r.amounts.yearly).toBe(20 * 40 * 50);
  });

  it("rejects empty, negative, and out-of-range schedule inputs", () => {
    expect(
      calculateSalaryHourly({
        amount: null,
        period: "hourly",
        ...base,
      }).ok,
    ).toBe(false);

    expect(
      calculateSalaryHourly({
        amount: -1,
        period: "hourly",
        ...base,
      }).ok,
    ).toBe(false);

    expect(
      calculateSalaryHourly({
        amount: 20,
        period: "hourly",
        hoursPerWeek: 169,
        daysPerWeek: 5,
        weeksPerYear: 52,
        unpaidWeeksOff: null,
      }).ok,
    ).toBe(false);

    expect(
      calculateSalaryHourly({
        amount: 20,
        period: "hourly",
        hoursPerWeek: 40,
        daysPerWeek: 8,
        weeksPerYear: 52,
        unpaidWeeksOff: null,
      }).ok,
    ).toBe(false);

    expect(
      calculateSalaryHourly({
        amount: 20,
        period: "hourly",
        hoursPerWeek: 40,
        daysPerWeek: 5,
        weeksPerYear: 53,
        unpaidWeeksOff: null,
      }).ok,
    ).toBe(false);
  });
});
