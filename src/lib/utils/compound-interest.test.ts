import { describe, expect, it } from "vitest";
import {
  calculateApyPercent,
  calculateCompoundInterest,
  closedFormFutureValue,
  inflationAdjustedValue,
  simulateCompoundInterest,
  yearsToDouble,
} from "./compound-interest";
import { fromCents, toCents } from "./money";

describe("closed-form and APY", () => {
  it("10,000 at 5% annually for 10 years equals 16,288.95", () => {
    expect(closedFormFutureValue(10_000, 5, "annually", 10)).toBeCloseTo(
      16_288.95,
      2,
    );
  });

  it("10,000 at 5% monthly for 10 years equals 16,470.09", () => {
    expect(closedFormFutureValue(10_000, 5, "monthly", 10)).toBeCloseTo(
      16_470.09,
      2,
    );
  });

  it("APY for 5% compounded monthly is about 5.12%", () => {
    expect(calculateApyPercent(5, "monthly")).toBeCloseTo(5.12, 2);
  });

  it("inflation: 10,000 after 10 years at 3% is about 7,440.94", () => {
    expect(inflationAdjustedValue(10_000, 3, 10)).toBeCloseTo(7_440.94, 2);
  });

  it("years to double uses ln(2)/ln(1+APY)", () => {
    const apy = calculateApyPercent(5, "annually");
    expect(yearsToDouble(apy)).toBeCloseTo(Math.log(2) / Math.log(1.05), 6);
    expect(yearsToDouble(0)).toBeNull();
  });
});

describe("simulateCompoundInterest", () => {
  it("matches closed form for annual compounding with no contributions", () => {
    const result = simulateCompoundInterest({
      initialAmount: 10_000,
      contribution: 0,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "annually",
      totalMonths: 120,
      inflationPercent: null,
    });
    expect(fromCents(result.futureValueCents)).toBeCloseTo(16_288.95, 2);
    expect(result.futureValueCents).toBe(
      toCents(closedFormFutureValue(10_000, 5, "annually", 10)),
    );
  });

  it("matches closed form for monthly compounding with no contributions", () => {
    const result = simulateCompoundInterest({
      initialAmount: 10_000,
      contribution: 0,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      totalMonths: 120,
      inflationPercent: null,
    });
    expect(fromCents(result.futureValueCents)).toBeCloseTo(16_470.09, 2);
    expect(result.futureValueCents).toBe(
      toCents(closedFormFutureValue(10_000, 5, "monthly", 10)),
    );
  });

  it("0 initial, 100/month at 6% monthly for 10y, end of month ≈ 16,387.93", () => {
    const result = simulateCompoundInterest({
      initialAmount: 0,
      contribution: 100,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 6,
      compounding: "monthly",
      totalMonths: 120,
      inflationPercent: null,
    });
    expect(fromCents(result.futureValueCents)).toBeCloseTo(16_387.93, 2);
  });

  it("same case with beginning-of-month contributions ≈ 16,469.87", () => {
    const result = simulateCompoundInterest({
      initialAmount: 0,
      contribution: 100,
      contributionFrequency: "monthly",
      contributionTiming: "beginning",
      contributionIncreasePercent: 0,
      annualRatePercent: 6,
      compounding: "monthly",
      totalMonths: 120,
      inflationPercent: null,
    });
    expect(fromCents(result.futureValueCents)).toBeCloseTo(16_469.87, 2);
  });

  it("0% rate: final balance equals total deposited", () => {
    const result = simulateCompoundInterest({
      initialAmount: 5_000,
      contribution: 200,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 0,
      compounding: "monthly",
      totalMonths: 24,
      inflationPercent: null,
    });
    expect(result.futureValueCents).toBe(result.totalDepositedCents);
    expect(result.totalInterestCents).toBe(0);
    expect(result.totalDepositedCents).toBe(toCents(5_000 + 200 * 24));
  });

  it("daily compounding exceeds monthly for the same inputs", () => {
    const monthly = simulateCompoundInterest({
      initialAmount: 10_000,
      contribution: 0,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      totalMonths: 120,
      inflationPercent: null,
    });
    const daily = simulateCompoundInterest({
      initialAmount: 10_000,
      contribution: 0,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "daily",
      totalMonths: 120,
      inflationPercent: null,
    });
    expect(daily.futureValueCents).toBeGreaterThan(monthly.futureValueCents);
  });

  it("deposited + interest equals future value; yearly rows sum", () => {
    const result = simulateCompoundInterest({
      initialAmount: 10_000,
      contribution: 50,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      totalMonths: 60,
      inflationPercent: null,
    });
    expect(result.totalDepositedCents + result.totalInterestCents).toBe(
      result.futureValueCents,
    );
    const sumInterest = result.yearly.reduce((s, r) => s + r.interestCents, 0);
    expect(sumInterest).toBe(result.totalInterestCents);
    expect(result.yearly.at(-1)?.endingBalanceCents).toBe(
      result.futureValueCents,
    );
  });

  it("0% yearly contribution increase matches no-increase result", () => {
    const base = simulateCompoundInterest({
      initialAmount: 1_000,
      contribution: 100,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 4,
      compounding: "monthly",
      totalMonths: 36,
      inflationPercent: null,
    });
    const explicit = simulateCompoundInterest({
      initialAmount: 1_000,
      contribution: 100,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 4,
      compounding: "monthly",
      totalMonths: 36,
      inflationPercent: null,
    });
    expect(explicit.futureValueCents).toBe(base.futureValueCents);
    expect(explicit.totalDepositedCents).toBe(base.totalDepositedCents);
  });
});

describe("calculateCompoundInterest", () => {
  it("returns success for valid input and inflation adjustment", () => {
    const result = calculateCompoundInterest({
      initialAmount: 10_000,
      contribution: 0,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "annually",
      years: 10,
      months: 0,
      inflationPercent: 3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(fromCents(result.result.futureValueCents)).toBeCloseTo(16_288.95, 2);
    expect(fromCents(result.result.inflationAdjustedCents!)).toBeCloseTo(
      inflationAdjustedValue(16_288.95, 3, 10),
      2,
    );
  });

  it("rejects both amounts zero", () => {
    const result = calculateCompoundInterest({
      initialAmount: 0,
      contribution: 0,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      contributionIncreasePercent: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      years: 5,
      months: 0,
      inflationPercent: null,
    });
    expect(result.ok).toBe(false);
  });
});
