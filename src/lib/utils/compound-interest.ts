/**
 * Pure compound-interest / future-value math.
 * Month-by-month simulation with an equivalent monthly growth factor.
 */

import { fromCents, toCents } from "@/lib/utils/money";

export type CompoundingFrequency =
  | "annually"
  | "semiannually"
  | "quarterly"
  | "monthly"
  | "daily";

export type ContributionFrequency = "monthly" | "quarterly" | "yearly";

export type ContributionTiming = "end" | "beginning";

export const COMPOUNDING_OPTIONS: {
  id: CompoundingFrequency;
  label: string;
  timesPerYear: number;
}[] = [
  { id: "annually", label: "Annually", timesPerYear: 1 },
  { id: "semiannually", label: "Semi-annually", timesPerYear: 2 },
  { id: "quarterly", label: "Quarterly", timesPerYear: 4 },
  { id: "monthly", label: "Monthly", timesPerYear: 12 },
  { id: "daily", label: "Daily (365)", timesPerYear: 365 },
];

export const CONTRIBUTION_FREQUENCY_OPTIONS: {
  id: ContributionFrequency;
  label: string;
  months: number;
}[] = [
  { id: "monthly", label: "Monthly", months: 1 },
  { id: "quarterly", label: "Quarterly", months: 3 },
  { id: "yearly", label: "Yearly", months: 12 },
];

export const AMOUNT_MIN = 0;
export const AMOUNT_MAX = 100_000_000;
export const RATE_MIN = 0;
export const RATE_MAX = 100;
export const RATE_HIGH_WARNING = 30;
export const TERM_MONTHS_MIN = 1;
export const TERM_MONTHS_MAX = 60 * 12;
export const INFLATION_MAX = 100;

export function compoundingTimesPerYear(
  frequency: CompoundingFrequency,
): number {
  return (
    COMPOUNDING_OPTIONS.find((o) => o.id === frequency)?.timesPerYear ?? 12
  );
}

export function contributionIntervalMonths(
  frequency: ContributionFrequency,
): number {
  return (
    CONTRIBUTION_FREQUENCY_OPTIONS.find((o) => o.id === frequency)?.months ?? 1
  );
}

/**
 * Equivalent monthly growth factor from nominal annual rate and compounding m:
 * (1 + rate / m) ^ (m / 12).
 */
export function monthlyGrowthFactor(
  annualRatePercent: number,
  compounding: CompoundingFrequency,
): number {
  if (annualRatePercent === 0) return 1;
  const m = compoundingTimesPerYear(compounding);
  const r = annualRatePercent / 100;
  return Math.pow(1 + r / m, m / 12);
}

/** APY = (1 + rate/m)^m − 1, as a percent. */
export function calculateApyPercent(
  annualRatePercent: number,
  compounding: CompoundingFrequency,
): number {
  if (annualRatePercent === 0) return 0;
  const m = compoundingTimesPerYear(compounding);
  const r = annualRatePercent / 100;
  return (Math.pow(1 + r / m, m) - 1) * 100;
}

/** Closed-form future value with no contributions: P(1 + r/m)^(m t). */
export function closedFormFutureValue(
  principal: number,
  annualRatePercent: number,
  compounding: CompoundingFrequency,
  years: number,
): number {
  if (principal === 0) return 0;
  if (annualRatePercent === 0) return principal;
  const m = compoundingTimesPerYear(compounding);
  const r = annualRatePercent / 100;
  return principal * Math.pow(1 + r / m, m * years);
}

/**
 * Years to double at the effective annual yield: ln(2) / ln(1 + APY).
 * Returns null when rate is 0 or APY ≤ 0.
 */
export function yearsToDouble(apyPercent: number): number | null {
  if (apyPercent <= 0) return null;
  return Math.log(2) / Math.log(1 + apyPercent / 100);
}

/** Today's-money value: nominal ÷ (1 + inflation)^years. */
export function inflationAdjustedValue(
  nominal: number,
  inflationPercent: number,
  years: number,
): number {
  if (inflationPercent < 0) return nominal;
  return nominal / Math.pow(1 + inflationPercent / 100, years);
}

function isContributionMonth(
  monthIndex: number,
  intervalMonths: number,
  timing: ContributionTiming,
): boolean {
  if (intervalMonths <= 0) return false;
  if (timing === "beginning") {
    return monthIndex % intervalMonths === 0;
  }
  return (monthIndex + 1) % intervalMonths === 0;
}

export type YearBreakdownRow = {
  year: number;
  /** Cumulative deposits (initial + contributions) through this year, cents. */
  depositedCents: number;
  /** Interest earned during this year only, cents. */
  interestCents: number;
  endingBalanceCents: number;
};

export type CompoundInterestResult = {
  futureValueCents: number;
  totalDepositedCents: number;
  totalInterestCents: number;
  interestSharePercent: number;
  apyPercent: number;
  yearsToDouble: number | null;
  inflationAdjustedCents: number | null;
  inflationPercent: number | null;
  years: number;
  yearly: YearBreakdownRow[];
  workingStep: string;
  highRateWarning: boolean;
};

export type CompoundInterestInput = {
  initialAmount: number | null;
  contribution: number | null;
  contributionFrequency: ContributionFrequency;
  contributionTiming: ContributionTiming;
  contributionIncreasePercent: number | null;
  annualRatePercent: number | null;
  compounding: CompoundingFrequency;
  years: number | null;
  months: number | null;
  inflationPercent: number | null;
};

export type CompoundInterestSuccess = {
  ok: true;
  result: CompoundInterestResult;
};

export type CompoundInterestFailure = {
  ok: false;
  error: "empty" | "amount" | "rate" | "term" | "inflation" | "invalid";
  message: string;
};

export type CompoundInterestCalcResult =
  | CompoundInterestSuccess
  | CompoundInterestFailure;

function totalMonths(years: number, months: number): number {
  return Math.max(0, Math.floor(years) * 12 + Math.floor(months));
}

/**
 * Month-by-month compound interest simulation.
 * Balance is tracked in floating dollars; yearly rows and totals use cents.
 */
export function simulateCompoundInterest(input: {
  initialAmount: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  contributionTiming: ContributionTiming;
  contributionIncreasePercent: number;
  annualRatePercent: number;
  compounding: CompoundingFrequency;
  totalMonths: number;
  inflationPercent: number | null;
}): CompoundInterestResult {
  const {
    initialAmount,
    contribution: baseContribution,
    contributionFrequency,
    contributionTiming,
    contributionIncreasePercent,
    annualRatePercent,
    compounding,
    totalMonths: n,
    inflationPercent,
  } = input;

  const factor = monthlyGrowthFactor(annualRatePercent, compounding);
  const interval = contributionIntervalMonths(contributionFrequency);
  const apyPercent = calculateApyPercent(annualRatePercent, compounding);
  const yearsExact = n / 12;

  let balance = initialAmount;
  let contribution = baseContribution;
  let deposited = initialAmount;
  const yearly: YearBreakdownRow[] = [];
  let priorInterestCents = 0;

  for (let i = 0; i < n; i++) {
    if (i > 0 && i % 12 === 0 && contributionIncreasePercent !== 0) {
      contribution = contribution * (1 + contributionIncreasePercent / 100);
    }

    const due = isContributionMonth(i, interval, contributionTiming);

    if (due && contributionTiming === "beginning" && contribution !== 0) {
      balance += contribution;
      deposited += contribution;
    }

    if (annualRatePercent !== 0) {
      balance *= factor;
    }

    if (due && contributionTiming === "end" && contribution !== 0) {
      balance += contribution;
      deposited += contribution;
    }

    const monthNumber = i + 1;
    const isYearEnd = monthNumber % 12 === 0 || monthNumber === n;
    if (isYearEnd) {
      const year = Math.ceil(monthNumber / 12);
      const endingBalanceCents = toCents(balance);
      const depositedCents = toCents(deposited);
      const interestSoFarCents = endingBalanceCents - depositedCents;
      const interestCents = interestSoFarCents - priorInterestCents;
      priorInterestCents = interestSoFarCents;
      yearly.push({
        year,
        depositedCents,
        interestCents,
        endingBalanceCents,
      });
    }
  }

  const futureValueCents = toCents(balance);
  const totalDepositedCents = toCents(deposited);
  const totalInterestCents = futureValueCents - totalDepositedCents;

  if (yearly.length > 0) {
    yearly[yearly.length - 1]!.endingBalanceCents = futureValueCents;
    yearly[yearly.length - 1]!.depositedCents = totalDepositedCents;
    const summedInterest = yearly.reduce((s, r) => s + r.interestCents, 0);
    if (summedInterest !== totalInterestCents) {
      yearly[yearly.length - 1]!.interestCents +=
        totalInterestCents - summedInterest;
    }
  }

  const interestSharePercent =
    futureValueCents > 0
      ? (totalInterestCents / futureValueCents) * 100
      : 0;

  const inflationAdjustedCents =
    inflationPercent !== null && inflationPercent >= 0
      ? toCents(
          inflationAdjustedValue(
            fromCents(futureValueCents),
            inflationPercent,
            yearsExact,
          ),
        )
      : null;

  const workingStep = buildWorkingStep({
    initialAmount,
    contribution: baseContribution,
    annualRatePercent,
    compounding,
    yearsExact,
    n,
    futureValueCents,
  });

  return {
    futureValueCents,
    totalDepositedCents,
    totalInterestCents,
    interestSharePercent,
    apyPercent,
    yearsToDouble: yearsToDouble(apyPercent),
    inflationAdjustedCents,
    inflationPercent,
    years: yearsExact,
    yearly,
    workingStep,
    highRateWarning: annualRatePercent > RATE_HIGH_WARNING,
  };
}

function buildWorkingStep(input: {
  initialAmount: number;
  contribution: number;
  annualRatePercent: number;
  compounding: CompoundingFrequency;
  yearsExact: number;
  n: number;
  futureValueCents: number;
}): string {
  const {
    initialAmount,
    contribution,
    annualRatePercent,
    compounding,
    yearsExact,
    futureValueCents,
  } = input;
  const m = compoundingTimesPerYear(compounding);
  const fv = fromCents(futureValueCents).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const pStr = initialAmount.toLocaleString("en-US");

  if (contribution === 0 && annualRatePercent === 0) {
    return `Future value = ${pStr} (0% rate, no contributions) = ${fv}`;
  }

  if (contribution === 0) {
    const r = annualRatePercent / 100;
    return `${pStr} × (1 + ${r} ÷ ${m})^(${m} × ${formatYears(yearsExact)}) = ${fv}`;
  }

  if (initialAmount === 0 || annualRatePercent === 0) {
    return `Contributions are added month by month. Future value = ${fv}`;
  }

  return `${pStr} × (1 + ${annualRatePercent / 100} ÷ ${m})^(${m} × ${formatYears(yearsExact)}) plus contributions added month by month = ${fv}`;
}

function formatYears(years: number): string {
  if (Number.isInteger(years)) return String(years);
  return years.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export function calculateCompoundInterest(
  input: CompoundInterestInput,
): CompoundInterestCalcResult {
  const {
    initialAmount,
    contribution,
    contributionFrequency,
    contributionTiming,
    contributionIncreasePercent,
    annualRatePercent,
    compounding,
    years,
    months,
    inflationPercent,
  } = input;

  if (
    initialAmount === null &&
    contribution === null &&
    annualRatePercent === null &&
    years === null &&
    months === null
  ) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter an initial amount or contribution, an interest rate, and a time period.",
    };
  }

  if (annualRatePercent === null || (years === null && months === null)) {
    return {
      ok: false,
      error: "empty",
      message: "Enter an annual interest rate and a time period.",
    };
  }

  const initial = initialAmount ?? 0;
  const contrib = contribution ?? 0;
  const increase = contributionIncreasePercent ?? 0;
  const y = years ?? 0;
  const mo = months ?? 0;

  if (
    !Number.isFinite(initial) ||
    initial < AMOUNT_MIN ||
    initial > AMOUNT_MAX ||
    !Number.isFinite(contrib) ||
    contrib < AMOUNT_MIN ||
    contrib > AMOUNT_MAX
  ) {
    return {
      ok: false,
      error: "amount",
      message: `Amounts should be between ${AMOUNT_MIN} and ${AMOUNT_MAX.toLocaleString("en-US")}.`,
    };
  }

  if (initial === 0 && contrib === 0) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter an initial amount, a recurring contribution, or both — they cannot both be zero.",
    };
  }

  if (
    !Number.isFinite(annualRatePercent) ||
    annualRatePercent < RATE_MIN ||
    annualRatePercent > RATE_MAX
  ) {
    return {
      ok: false,
      error: "rate",
      message: `Interest rate should be between ${RATE_MIN}% and ${RATE_MAX}%.`,
    };
  }

  const n = totalMonths(y, mo);
  if (n < TERM_MONTHS_MIN || n > TERM_MONTHS_MAX) {
    return {
      ok: false,
      error: "term",
      message: "Time period should be from 1 month up to 60 years.",
    };
  }

  if (
    !Number.isFinite(increase) ||
    increase < 0 ||
    increase > RATE_MAX
  ) {
    return {
      ok: false,
      error: "invalid",
      message: "Yearly contribution increase should be between 0% and 100%.",
    };
  }

  let inflation: number | null = null;
  if (inflationPercent !== null) {
    if (
      !Number.isFinite(inflationPercent) ||
      inflationPercent < 0 ||
      inflationPercent > INFLATION_MAX
    ) {
      return {
        ok: false,
        error: "inflation",
        message: `Inflation should be between 0% and ${INFLATION_MAX}%.`,
      };
    }
    inflation = inflationPercent;
  }

  const result = simulateCompoundInterest({
    initialAmount: initial,
    contribution: contrib,
    contributionFrequency,
    contributionTiming,
    contributionIncreasePercent: increase,
    annualRatePercent,
    compounding,
    totalMonths: n,
    inflationPercent: inflation,
  });

  return { ok: true, result };
}
