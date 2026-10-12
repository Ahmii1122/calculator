import { describe, expect, it } from "vitest";
import {
  buildFlatSchedule,
  buildReducingSchedule,
  calculateFlatTotalInterestCents,
  calculateLoan,
  calculateReducingPaymentCents,
  fromCents,
  toCents,
} from "./loan";

describe("calculateReducingPaymentCents", () => {
  it("matches ~599.55 for 100,000 at 6% over 30 years", () => {
    const pmt = calculateReducingPaymentCents(toCents(100_000), 6, 360);
    expect(fromCents(pmt)).toBeCloseTo(599.55, 2);
  });

  it("matches ~299.71 for 10,000 at 5% over 3 years", () => {
    const pmt = calculateReducingPaymentCents(toCents(10_000), 5, 36);
    expect(fromCents(pmt)).toBeCloseTo(299.71, 2);
  });

  it("uses amount ÷ months when interest is 0%", () => {
    const pmt = calculateReducingPaymentCents(toCents(12_000), 0, 24);
    expect(pmt).toBe(toCents(500));
  });
});

describe("buildReducingSchedule", () => {
  it("ends at exactly zero with no negative balances (100k / 6% / 30y)", () => {
    const result = buildReducingSchedule({
      principalCents: toCents(100_000),
      annualRatePercent: 6,
      n: 360,
    });
    expect(result.paymentCount).toBe(360);
    expect(result.yearly).toHaveLength(30);
    expect(result.yearly.at(-1)?.endingBalanceCents).toBe(0);
    expect(result.schedule.at(-1)?.balanceCents).toBe(0);
    expect(result.schedule.every((row) => row.balanceCents >= 0)).toBe(true);
    expect(result.schedule.every((row) => row.principalCents >= 0)).toBe(true);
    expect(fromCents(result.totalInterestCents)).toBeCloseTo(115_838, -1);
  });

  it("sums principal to the loan amount", () => {
    const principal = toCents(10_000);
    const result = buildReducingSchedule({
      principalCents: principal,
      annualRatePercent: 5,
      n: 36,
    });
    const sumPrincipal = result.schedule.reduce(
      (s, row) => s + row.principalCents,
      0,
    );
    expect(sumPrincipal).toBe(principal);
  });

  it("shortens term and reduces interest with extra payments without overpaying", () => {
    const principal = toCents(100_000);
    const base = buildReducingSchedule({
      principalCents: principal,
      annualRatePercent: 6,
      n: 360,
    });
    const withExtra = buildReducingSchedule({
      principalCents: principal,
      annualRatePercent: 6,
      n: 360,
      extraPaymentCents: toCents(100),
    });

    expect(withExtra.paymentCount).toBeLessThan(base.paymentCount);
    expect(withExtra.totalInterestCents).toBeLessThan(base.totalInterestCents);
    expect(withExtra.schedule.at(-1)?.balanceCents).toBe(0);

    const last = withExtra.schedule.at(-1)!;
    // Final payment should not exceed remaining principal + interest for that month
    expect(last.principalCents).toBeGreaterThan(0);
    expect(last.paymentCents).toBe(last.principalCents + last.interestCents);
  });
});

describe("flat rate", () => {
  it("computes total interest as P × rate × years", () => {
    const interest = calculateFlatTotalInterestCents(toCents(50_000), 10, 60);
    // 50,000 × 0.10 × 5 = 25,000
    expect(interest).toBe(toCents(25_000));
  });

  it("builds a flat schedule that ends at zero", () => {
    const result = buildFlatSchedule({
      principalCents: toCents(50_000),
      annualRatePercent: 10,
      n: 60,
    });
    expect(result.schedule.at(-1)?.balanceCents).toBe(0);
    expect(result.schedule.every((row) => row.balanceCents >= 0)).toBe(true);
    const sumPrincipal = result.schedule.reduce(
      (s, row) => s + row.principalCents,
      0,
    );
    expect(sumPrincipal).toBe(toCents(50_000));
  });
});

describe("calculateLoan", () => {
  it("returns a success result for valid reducing-balance input", () => {
    const result = calculateLoan({
      amount: 100_000,
      annualRatePercent: 6,
      years: 30,
      months: 0,
      method: "reducing",
      extraMonthly: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(fromCents(result.schedule.monthlyPaymentCents)).toBeCloseTo(
      599.55,
      2,
    );
  });

  it("reports months and interest saved with extras", () => {
    const result = calculateLoan({
      amount: 100_000,
      annualRatePercent: 6,
      years: 30,
      months: 0,
      method: "reducing",
      extraMonthly: 200,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.monthsSaved).toBeGreaterThan(0);
    expect(result.interestSavedCents).toBeGreaterThan(0);
  });
});
