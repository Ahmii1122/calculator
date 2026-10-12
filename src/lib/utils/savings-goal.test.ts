import { describe, expect, it } from "vitest";
import { fromCents, toCents } from "./money";
import {
  calculateSavingsGoal,
  inflateGoal,
  monthsToReachConfirmed,
  requiredMonthlyContribution,
  simulateSavingsPlan,
} from "./savings-goal";

describe("requiredMonthlyContribution", () => {
  it("goal 10,000, start 0, 0% rate, 10 months → 1,000", () => {
    const c = requiredMonthlyContribution({
      target: 10_000,
      principal: 0,
      annualRatePercent: 0,
      compounding: "monthly",
      months: 10,
      timing: "end",
    });
    expect(c).toBeCloseTo(1_000, 6);
  });

  it("goal 10,000, start 0, 5% monthly, 5 years, end → ~147.05", () => {
    const c = requiredMonthlyContribution({
      target: 10_000,
      principal: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      months: 60,
      timing: "end",
    });
    expect(c).toBeCloseTo(147.05, 2);
  });

  it("same case beginning of month → ~146.44", () => {
    const c = requiredMonthlyContribution({
      target: 10_000,
      principal: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      months: 60,
      timing: "beginning",
    });
    expect(c).toBeCloseTo(146.44, 2);
  });

  it("goal 20,000, start 5,000, 6% monthly, 10 years, end → ~66.53", () => {
    const c = requiredMonthlyContribution({
      target: 20_000,
      principal: 5_000,
      annualRatePercent: 6,
      compounding: "monthly",
      months: 120,
      timing: "end",
    });
    expect(c).toBeCloseTo(66.53, 2);
  });

  it("starting amount that already reaches the goal → 0", () => {
    const c = requiredMonthlyContribution({
      target: 10_000,
      principal: 10_000,
      annualRatePercent: 5,
      compounding: "monthly",
      months: 60,
      timing: "end",
    });
    expect(c).toBe(0);
  });

  it("daily compounding needs slightly less than monthly", () => {
    const monthly = requiredMonthlyContribution({
      target: 10_000,
      principal: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      months: 60,
      timing: "end",
    });
    const daily = requiredMonthlyContribution({
      target: 10_000,
      principal: 0,
      annualRatePercent: 5,
      compounding: "daily",
      months: 60,
      timing: "end",
    });
    expect(daily).toBeLessThan(monthly);
  });

  it("never returns negative", () => {
    const c = requiredMonthlyContribution({
      target: 5_000,
      principal: 20_000,
      annualRatePercent: 5,
      compounding: "monthly",
      months: 24,
      timing: "end",
    });
    expect(c).toBe(0);
    expect(Number.isFinite(c)).toBe(true);
  });
});

describe("monthsToReachConfirmed", () => {
  it("goal 10,000, contrib 200, start 0, 0% → 50 months", () => {
    const result = monthsToReachConfirmed({
      target: 10_000,
      principal: 0,
      contribution: 200,
      annualRatePercent: 0,
      compounding: "monthly",
      timing: "end",
    });
    expect(result?.months).toBe(50);
  });

  it("goal 10,000, contrib 200, 5% monthly, end → 46 months with simulation check", () => {
    const result = monthsToReachConfirmed({
      target: 10_000,
      principal: 0,
      contribution: 200,
      annualRatePercent: 5,
      compounding: "monthly",
      timing: "end",
    });
    expect(result?.months).toBe(46);

    const at45 = simulateSavingsPlan({
      principal: 0,
      contribution: 200,
      annualRatePercent: 5,
      compounding: "monthly",
      timing: "end",
      maxMonths: 45,
      target: null,
    });
    const at46 = simulateSavingsPlan({
      principal: 0,
      contribution: 200,
      annualRatePercent: 5,
      compounding: "monthly",
      timing: "end",
      maxMonths: 46,
      target: null,
    });
    expect(fromCents(at45.finalBalanceCents)).toBeLessThan(10_000);
    expect(fromCents(at46.finalBalanceCents)).toBeGreaterThanOrEqual(10_000);
  });
});

describe("inflateGoal", () => {
  it("10,000 at 3% over 10 years ≈ 13,439.16", () => {
    expect(inflateGoal(10_000, 3, 120)).toBeCloseTo(13_439.16, 2);
  });
});

describe("round trip and totals", () => {
  it("mode-1 contribution reaches target within a cent at end of term", () => {
    const n = 60;
    const target = 10_000;
    const c = requiredMonthlyContribution({
      target,
      principal: 0,
      annualRatePercent: 5,
      compounding: "monthly",
      months: n,
      timing: "end",
    });
    const sim = simulateSavingsPlan({
      principal: 0,
      contribution: c,
      annualRatePercent: 5,
      compounding: "monthly",
      timing: "end",
      maxMonths: n,
      target: null,
    });
    expect(Math.abs(fromCents(sim.finalBalanceCents) - target)).toBeLessThan(
      0.02,
    );
  });

  it("contributions + starting + interest = final; yearly interest sums", () => {
    const sim = simulateSavingsPlan({
      principal: 1_000,
      contribution: 100,
      annualRatePercent: 4,
      compounding: "monthly",
      timing: "end",
      maxMonths: 36,
      target: null,
    });
    expect(
      sim.startingCents + sim.totalContributedCents + sim.totalInterestCents,
    ).toBe(sim.finalBalanceCents);
    const sumInterest = sim.yearly.reduce((s, r) => s + r.interestCents, 0);
    expect(sumInterest).toBe(sim.totalInterestCents);
  });
});

describe("calculateSavingsGoal", () => {
  it("mode 1 success and no NaN/Infinity", () => {
    const result = calculateSavingsGoal({
      mode: "monthly",
      goal: 10_000,
      starting: 0,
      years: 5,
      months: 0,
      contribution: null,
      annualRatePercent: 5,
      compounding: "monthly",
      timing: "end",
      adjustForInflation: false,
      inflationPercent: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number.isFinite(result.monthlyContributionCents)).toBe(true);
    expect(result.monthlyContributionCents).toBeGreaterThanOrEqual(0);
    expect(fromCents(result.monthlyContributionCents)).toBeCloseTo(147.05, 2);
  });

  it("mode 2 success", () => {
    const result = calculateSavingsGoal({
      mode: "duration",
      goal: 10_000,
      starting: 0,
      years: null,
      months: null,
      contribution: 200,
      annualRatePercent: 5,
      compounding: "monthly",
      timing: "end",
      adjustForInflation: false,
      inflationPercent: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.durationMonths).toBe(46);
    expect(result.durationLabel).toBeTruthy();
  });

  it("already-funded goal gives contribution 0", () => {
    const result = calculateSavingsGoal({
      mode: "monthly",
      goal: 5_000,
      starting: 5_000,
      years: 2,
      months: 0,
      contribution: null,
      annualRatePercent: 0,
      compounding: "monthly",
      timing: "end",
      adjustForInflation: false,
      inflationPercent: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.monthlyContributionCents).toBe(0);
    expect(result.alreadyOnTrack || result.message).toBeTruthy();
  });
});
