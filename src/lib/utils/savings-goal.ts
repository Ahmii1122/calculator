/**
 * Pure savings-goal math: required monthly contribution or time to goal.
 */

import {
  COMPOUNDING_OPTIONS,
  monthlyGrowthFactor,
  type CompoundingFrequency,
  type ContributionTiming,
} from "@/lib/utils/compounding";
import { fromCents, toCents } from "@/lib/utils/money";

export type { CompoundingFrequency, ContributionTiming };
export { COMPOUNDING_OPTIONS };

export type SavingsMode = "monthly" | "duration";

export const GOAL_MIN = 0.01;
export const GOAL_MAX = 100_000_000;
export const AMOUNT_MIN = 0;
export const AMOUNT_MAX = 100_000_000;
export const RATE_MIN = 0;
export const RATE_MAX = 100;
export const RATE_HIGH_WARNING = 30;
export const TERM_MONTHS_MIN = 1;
export const TERM_MONTHS_MAX = 50 * 12;
export const DURATION_CAP_MONTHS = 100 * 12;
export const INFLATION_MAX = 100;

export type YearBreakdownRow = {
  year: number;
  contributedCents: number;
  interestCents: number;
  endingBalanceCents: number;
};

export type SavingsSimulation = {
  months: number;
  finalBalanceCents: number;
  totalContributedCents: number;
  totalInterestCents: number;
  startingCents: number;
  yearly: YearBreakdownRow[];
};

/** Inflated target from a today's-money goal. */
export function inflateGoal(
  goal: number,
  inflationPercent: number,
  months: number,
): number {
  if (inflationPercent <= 0 || months <= 0) return goal;
  return goal * Math.pow(1 + inflationPercent / 100, months / 12);
}

/**
 * Required monthly contribution (dollars) to reach target in n months.
 * Returns 0 when the starting amount alone is projected to meet the target.
 */
export function requiredMonthlyContribution(input: {
  target: number;
  principal: number;
  annualRatePercent: number;
  compounding: CompoundingFrequency;
  months: number;
  timing: ContributionTiming;
}): number {
  const { target, principal, annualRatePercent, compounding, months, timing } =
    input;
  if (months <= 0) return 0;
  if (principal >= target) return 0;

  const g = monthlyGrowthFactor(annualRatePercent, compounding);
  const gn = Math.pow(g, months);
  const grown = principal * gn;
  if (grown >= target - 1e-9) return 0;

  const i = g - 1;
  if (Math.abs(i) < 1e-15 || annualRatePercent === 0) {
    return (target - principal) / months;
  }

  if (timing === "beginning") {
    return ((target - grown) * i) / ((gn - 1) * g);
  }
  return ((target - grown) * i) / (gn - 1);
}

/**
 * Exact months (float) to reach target with a fixed monthly contribution.
 * Returns null when the goal cannot be reached.
 */
export function monthsToReachExact(input: {
  target: number;
  principal: number;
  contribution: number;
  annualRatePercent: number;
  compounding: CompoundingFrequency;
  timing: ContributionTiming;
}): number | null {
  const {
    target,
    principal,
    contribution,
    annualRatePercent,
    compounding,
    timing,
  } = input;

  if (principal >= target) return 0;
  if (contribution < 0) return null;

  const g = monthlyGrowthFactor(annualRatePercent, compounding);
  const i = g - 1;

  if (annualRatePercent === 0 || Math.abs(i) < 1e-15) {
    if (contribution <= 0) return null;
    return (target - principal) / contribution;
  }

  // With positive interest and zero contribution, only growth of principal
  if (contribution === 0) {
    if (principal <= 0) return null;
    const ratio = target / principal;
    if (ratio <= 1) return 0;
    return Math.log(ratio) / Math.log(g);
  }

  let numerator: number;
  let denominator: number;
  if (timing === "beginning") {
    numerator = target * i + contribution * g;
    denominator = principal * i + contribution * g;
  } else {
    numerator = target * i + contribution;
    denominator = principal * i + contribution;
  }

  if (denominator <= 0 || numerator / denominator <= 0) return null;
  const ratio = numerator / denominator;
  if (ratio <= 1) return 0;
  return Math.log(ratio) / Math.log(g);
}

/** Simulate month-by-month until target or maxMonths. */
export function simulateSavingsPlan(input: {
  principal: number;
  contribution: number;
  annualRatePercent: number;
  compounding: CompoundingFrequency;
  timing: ContributionTiming;
  /** Stop when balance reaches target (if set). */
  target?: number | null;
  /** Hard stop after this many months (inclusive). */
  maxMonths: number;
}): SavingsSimulation {
  const {
    principal,
    contribution,
    annualRatePercent,
    compounding,
    timing,
    target,
    maxMonths,
  } = input;

  const g = monthlyGrowthFactor(annualRatePercent, compounding);
  let balance = principal;
  let contributed = 0;
  let months = 0;
  const yearly: YearBreakdownRow[] = [];
  let priorInterestCents = 0;
  const startingCents = toCents(principal);
  const targetCents = target != null ? toCents(target) : null;

  while (months < maxMonths) {
    months += 1;

    if (timing === "beginning" && contribution !== 0) {
      balance += contribution;
      contributed += contribution;
    }

    if (annualRatePercent !== 0) {
      balance *= g;
    }

    if (timing === "end" && contribution !== 0) {
      balance += contribution;
      contributed += contribution;
    }

    const isYearEnd = months % 12 === 0 || months === maxMonths;
    const hitTarget =
      targetCents != null && toCents(balance) >= targetCents;

    if (isYearEnd || hitTarget) {
      const year = Math.ceil(months / 12);
      const endingBalanceCents = toCents(balance);
      const contributedCents = toCents(contributed);
      const interestSoFarCents =
        endingBalanceCents - startingCents - contributedCents;
      const interestCents = interestSoFarCents - priorInterestCents;
      priorInterestCents = interestSoFarCents;

      const existing = yearly.findIndex((row) => row.year === year);
      const row: YearBreakdownRow = {
        year,
        contributedCents,
        interestCents,
        endingBalanceCents,
      };
      if (existing >= 0) {
        const prior = yearly
          .slice(0, existing)
          .reduce((s, r) => s + r.interestCents, 0);
        yearly[existing] = {
          year,
          contributedCents,
          interestCents: interestSoFarCents - prior,
          endingBalanceCents,
        };
        priorInterestCents = interestSoFarCents;
      } else {
        yearly.push(row);
      }
    }

    if (hitTarget) break;
  }

  const finalBalanceCents = toCents(balance);
  const totalContributedCents = toCents(contributed);
  let totalInterestCents =
    finalBalanceCents - startingCents - totalContributedCents;

  if (yearly.length > 0) {
    yearly[yearly.length - 1]!.endingBalanceCents = finalBalanceCents;
    yearly[yearly.length - 1]!.contributedCents = totalContributedCents;
    const summed = yearly.reduce((s, r) => s + r.interestCents, 0);
    if (summed !== totalInterestCents) {
      yearly[yearly.length - 1]!.interestCents +=
        totalInterestCents - summed;
      totalInterestCents = yearly.reduce((s, r) => s + r.interestCents, 0);
    }
  }

  return {
    months,
    finalBalanceCents,
    totalContributedCents,
    totalInterestCents,
    startingCents,
    yearly,
  };
}

/**
 * Ceil exact months, then confirm with simulation the first month at/above target.
 */
export function monthsToReachConfirmed(input: {
  target: number;
  principal: number;
  contribution: number;
  annualRatePercent: number;
  compounding: CompoundingFrequency;
  timing: ContributionTiming;
}): { months: number; simulation: SavingsSimulation } | null {
  const exact = monthsToReachExact(input);
  if (exact === null) return null;
  if (exact === 0) {
    return {
      months: 0,
      simulation: simulateSavingsPlan({
        ...input,
        maxMonths: 0,
        target: input.target,
      }),
    };
  }

  let months = Math.max(1, Math.ceil(exact - 1e-12));
  if (months > DURATION_CAP_MONTHS) {
    return null;
  }

  // Confirm with simulation: find first month balance >= target
  const probe = simulateSavingsPlan({
    ...input,
    maxMonths: Math.min(DURATION_CAP_MONTHS, months + 2),
    target: input.target,
  });

  if (fromCents(probe.finalBalanceCents) < input.target - 0.005) {
    // Need more months than ceil suggested
    const longer = simulateSavingsPlan({
      ...input,
      maxMonths: DURATION_CAP_MONTHS,
      target: input.target,
    });
    if (fromCents(longer.finalBalanceCents) < input.target - 0.005) {
      return null;
    }
    months = longer.months;
    return { months, simulation: longer };
  }

  // Ensure previous month was below target when months > 1
  if (months > 1) {
    const prev = simulateSavingsPlan({
      ...input,
      maxMonths: months - 1,
      target: null,
    });
    if (fromCents(prev.finalBalanceCents) >= input.target - 0.005) {
      months = months - 1;
      const sim = simulateSavingsPlan({
        ...input,
        maxMonths: months,
        target: input.target,
      });
      return { months, simulation: sim };
    }
  }

  const simulation = simulateSavingsPlan({
    ...input,
    maxMonths: months,
    target: input.target,
  });
  return { months: simulation.months, simulation };
}

export function formatMonthsAsYearsMonths(totalMonths: number): {
  years: number;
  months: number;
  label: string;
} {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months > 0 || years === 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }
  return { years, months, label: parts.join(", ") };
}

export type SavingsGoalInput = {
  mode: SavingsMode;
  goal: number | null;
  starting: number | null;
  years: number | null;
  months: number | null;
  contribution: number | null;
  annualRatePercent: number | null;
  compounding: CompoundingFrequency;
  timing: ContributionTiming;
  adjustForInflation: boolean;
  inflationPercent: number | null;
};

export type SavingsGoalSuccess = {
  ok: true;
  mode: SavingsMode;
  goalCents: number;
  targetCents: number;
  inflationEnabled: boolean;
  inflationPercent: number | null;
  startingCents: number;
  monthlyContributionCents: number;
  weeklyApproxCents: number | null;
  durationMonths: number | null;
  durationLabel: string | null;
  alreadyOnTrack: boolean;
  unreachable: boolean;
  overCap: boolean;
  simulation: SavingsSimulation;
  contributionSharePercent: number;
  interestSharePercent: number;
  startingSharePercent: number;
  workingStep: string;
  highRateWarning: boolean;
  message: string | null;
};

export type SavingsGoalFailure = {
  ok: false;
  error: "empty" | "goal" | "starting" | "term" | "contribution" | "rate" | "inflation";
  message: string;
};

export type SavingsGoalResult = SavingsGoalSuccess | SavingsGoalFailure;

function totalMonths(years: number, months: number): number {
  return Math.max(0, Math.floor(years) * 12 + Math.floor(months));
}

function buildWorkingStepMode1(input: {
  target: number;
  principal: number;
  rate: number;
  compounding: CompoundingFrequency;
  n: number;
  timing: ContributionTiming;
  contribution: number;
}): string {
  const { target, principal, rate, n, timing, contribution } = input;
  const cStr = contribution.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (rate === 0) {
    return `Monthly saving = (${target.toLocaleString("en-US")} − ${principal.toLocaleString("en-US")}) ÷ ${n} = ${cStr}`;
  }
  const r = rate / 100;
  const when = timing === "beginning" ? " (beginning of month)" : "";
  if (principal === 0 && timing === "end") {
    return `Monthly saving = ${target.toLocaleString("en-US")} × ${r}/12 ÷ ((1 + ${r}/12)^${n} − 1) ≈ ${cStr}${when}`;
  }
  return `Monthly saving ≈ ${cStr} for a ${target.toLocaleString("en-US")} target over ${n} months at ${rate}%${when}`;
}

export function calculateSavingsGoal(
  input: SavingsGoalInput,
): SavingsGoalResult {
  const {
    mode,
    goal,
    starting,
    years,
    months,
    contribution,
    annualRatePercent,
    compounding,
    timing,
    adjustForInflation,
    inflationPercent,
  } = input;

  if (goal === null && annualRatePercent === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a savings goal and an interest rate (0 if none) to see results.",
    };
  }

  if (goal === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a savings goal amount.",
    };
  }

  if (
    !Number.isFinite(goal) ||
    goal < GOAL_MIN ||
    goal > GOAL_MAX
  ) {
    return {
      ok: false,
      error: "goal",
      message: `Goal should be between ${GOAL_MIN} and ${GOAL_MAX.toLocaleString("en-US")}.`,
    };
  }

  const start = starting ?? 0;
  if (
    !Number.isFinite(start) ||
    start < AMOUNT_MIN ||
    start > AMOUNT_MAX
  ) {
    return {
      ok: false,
      error: "starting",
      message: `Starting amount should be between ${AMOUNT_MIN} and ${AMOUNT_MAX.toLocaleString("en-US")}.`,
    };
  }

  const rate = annualRatePercent ?? 0;
  if (!Number.isFinite(rate) || rate < RATE_MIN || rate > RATE_MAX) {
    return {
      ok: false,
      error: "rate",
      message: `Interest rate should be between ${RATE_MIN}% and ${RATE_MAX}%.`,
    };
  }

  let inflation: number | null = null;
  if (adjustForInflation) {
    if (
      inflationPercent === null ||
      !Number.isFinite(inflationPercent) ||
      inflationPercent < 0 ||
      inflationPercent > INFLATION_MAX
    ) {
      return {
        ok: false,
        error: "inflation",
        message: `Enter an inflation rate between 0% and ${INFLATION_MAX}%.`,
      };
    }
    inflation = inflationPercent;
  }

  const highRateWarning = rate > RATE_HIGH_WARNING;

  if (mode === "monthly") {
    const y = years ?? 0;
    const mo = months ?? 0;
    const n = totalMonths(y, mo);
    if (n < TERM_MONTHS_MIN || n > TERM_MONTHS_MAX) {
      return {
        ok: false,
        error: "term",
        message: "Time frame should be from 1 month up to 50 years.",
      };
    }

    if (start >= goal && !adjustForInflation) {
      const sim = simulateSavingsPlan({
        principal: start,
        contribution: 0,
        annualRatePercent: rate,
        compounding,
        timing,
        maxMonths: 0,
        target: goal,
      });
      return {
        ok: true,
        mode,
        goalCents: toCents(goal),
        targetCents: toCents(goal),
        inflationEnabled: false,
        inflationPercent: null,
        startingCents: toCents(start),
        monthlyContributionCents: 0,
        weeklyApproxCents: 0,
        durationMonths: n,
        durationLabel: formatMonthsAsYearsMonths(n).label,
        alreadyOnTrack: true,
        unreachable: false,
        overCap: false,
        simulation: {
          ...sim,
          months: n,
          finalBalanceCents: toCents(start),
          totalContributedCents: 0,
          totalInterestCents: 0,
          yearly: [],
        },
        contributionSharePercent: 0,
        interestSharePercent: 0,
        startingSharePercent: 100,
        workingStep: "Required monthly saving = 0 (starting amount already meets the goal).",
        highRateWarning,
        message:
          "Your starting amount already meets this goal. No additional monthly saving is required for this target.",
      };
    }

    const target = inflateGoal(goal, inflation ?? 0, n);
    const rawC = requiredMonthlyContribution({
      target,
      principal: start,
      annualRatePercent: rate,
      compounding,
      months: n,
      timing,
    });

    const contributionDollars = Math.max(0, rawC);
    const contributionCents = toCents(contributionDollars);
    const alreadyOnTrack = contributionCents === 0 && start < goal;

    // Simulate with the precise contribution so the path matches the formula;
    // the displayed monthly figure is still rounded to the cent.
    const simulation = simulateSavingsPlan({
      principal: start,
      contribution: contributionDollars,
      annualRatePercent: rate,
      compounding,
      timing,
      maxMonths: n,
      target: null,
    });

    const total = simulation.finalBalanceCents;
    const contribShare =
      total > 0 ? (simulation.totalContributedCents / total) * 100 : 0;
    const interestShare =
      total > 0 ? (simulation.totalInterestCents / total) * 100 : 0;
    const startShare =
      total > 0 ? (simulation.startingCents / total) * 100 : 0;

    const weeklyApproxCents = toCents(
      (fromCents(contributionCents) * 12) / 52,
    );

    return {
      ok: true,
      mode,
      goalCents: toCents(goal),
      targetCents: toCents(target),
      inflationEnabled: adjustForInflation,
      inflationPercent: inflation,
      startingCents: toCents(start),
      monthlyContributionCents: contributionCents,
      weeklyApproxCents,
      durationMonths: n,
      durationLabel: formatMonthsAsYearsMonths(n).label,
      alreadyOnTrack,
      unreachable: false,
      overCap: false,
      simulation: {
        ...simulation,
        finalBalanceCents: simulation.finalBalanceCents,
      },
      contributionSharePercent: contribShare,
      interestSharePercent: interestShare,
      startingSharePercent: startShare,
      workingStep: buildWorkingStepMode1({
        target,
        principal: start,
        rate,
        compounding,
        n,
        timing,
        contribution: fromCents(contributionCents),
      }),
      highRateWarning,
      message: alreadyOnTrack
        ? "Your starting amount is projected to reach this goal on its own, at this interest rate."
        : null,
    };
  }

  // Mode 2: duration
  if (contribution === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a monthly contribution amount.",
    };
  }
  if (
    !Number.isFinite(contribution) ||
    contribution <= 0 ||
    contribution > AMOUNT_MAX
  ) {
    return {
      ok: false,
      error: "contribution",
      message: "Monthly contribution should be greater than 0.",
    };
  }

  if (start >= goal && !adjustForInflation) {
    return {
      ok: true,
      mode,
      goalCents: toCents(goal),
      targetCents: toCents(goal),
      inflationEnabled: false,
      inflationPercent: null,
      startingCents: toCents(start),
      monthlyContributionCents: toCents(contribution),
      weeklyApproxCents: null,
      durationMonths: 0,
      durationLabel: "0 months",
      alreadyOnTrack: true,
      unreachable: false,
      overCap: false,
      simulation: {
        months: 0,
        finalBalanceCents: toCents(start),
        totalContributedCents: 0,
        totalInterestCents: 0,
        startingCents: toCents(start),
        yearly: [],
      },
      contributionSharePercent: 0,
      interestSharePercent: 0,
      startingSharePercent: 100,
      workingStep: "Time to goal = 0 months (starting amount already meets the goal).",
      highRateWarning,
      message:
        "Your starting amount already meets this goal.",
    };
  }

  // For duration mode with inflation, we need to solve iteratively because
  // target depends on n. Use binary search on months.
  let durationResult: { months: number; simulation: SavingsSimulation; target: number } | null =
    null;

  if (adjustForInflation && inflation != null && inflation > 0) {
    let lo = 1;
    let hi = DURATION_CAP_MONTHS;
    let found: { months: number; simulation: SavingsSimulation; target: number } | null =
      null;
    for (let iter = 0; iter < 40; iter++) {
      const mid = Math.ceil((lo + hi) / 2);
      const target = inflateGoal(goal, inflation, mid);
      const check = monthsToReachConfirmed({
        target,
        principal: start,
        contribution,
        annualRatePercent: rate,
        compounding,
        timing,
      });
      if (check === null || check.months > mid) {
        lo = mid + 1;
      } else {
        found = { months: check.months, simulation: check.simulation, target };
        hi = mid - 1;
      }
    }
    // Verify found month against its own inflated target
    if (found) {
      const target = inflateGoal(goal, inflation, found.months);
      const verified = monthsToReachConfirmed({
        target,
        principal: start,
        contribution,
        annualRatePercent: rate,
        compounding,
        timing,
      });
      if (verified && verified.months <= DURATION_CAP_MONTHS) {
        durationResult = {
          months: verified.months,
          simulation: verified.simulation,
          target,
        };
      }
    }
  } else {
    const target = goal;
    const confirmed = monthsToReachConfirmed({
      target,
      principal: start,
      contribution,
      annualRatePercent: rate,
      compounding,
      timing,
    });
    if (confirmed) {
      if (confirmed.months > DURATION_CAP_MONTHS) {
        durationResult = null;
      } else {
        durationResult = {
          months: confirmed.months,
          simulation: confirmed.simulation,
          target,
        };
      }
    }
  }

  const exactCheck = monthsToReachExact({
    target: goal,
    principal: start,
    contribution,
    annualRatePercent: rate,
    compounding,
    timing,
  });

  if (
    durationResult === null &&
    (exactCheck === null || exactCheck > DURATION_CAP_MONTHS)
  ) {
    const overCap =
      exactCheck !== null && exactCheck > DURATION_CAP_MONTHS;
    return {
      ok: true,
      mode,
      goalCents: toCents(goal),
      targetCents: toCents(goal),
      inflationEnabled: adjustForInflation,
      inflationPercent: inflation,
      startingCents: toCents(start),
      monthlyContributionCents: toCents(contribution),
      weeklyApproxCents: null,
      durationMonths: null,
      durationLabel: null,
      alreadyOnTrack: false,
      unreachable: !overCap,
      overCap,
      simulation: {
        months: 0,
        finalBalanceCents: toCents(start),
        totalContributedCents: 0,
        totalInterestCents: 0,
        startingCents: toCents(start),
        yearly: [],
      },
      contributionSharePercent: 0,
      interestSharePercent: 0,
      startingSharePercent: 100,
      workingStep: overCap
        ? "At this contribution, the goal takes more than 100 years."
        : "This contribution is not enough to reach the goal at the assumed rate.",
      highRateWarning,
      message: overCap
        ? "More than 100 years at this contribution."
        : "This monthly contribution is not enough to reach the goal at the assumed interest rate.",
    };
  }

  if (durationResult === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter valid amounts to see how long it will take.",
    };
  }

  const { months: durationMonths, simulation, target } = durationResult;
  const total = simulation.finalBalanceCents;
  const contribShare =
    total > 0 ? (simulation.totalContributedCents / total) * 100 : 0;
  const interestShare =
    total > 0 ? (simulation.totalInterestCents / total) * 100 : 0;
  const startShare =
    total > 0 ? (simulation.startingCents / total) * 100 : 0;
  const formatted = formatMonthsAsYearsMonths(durationMonths);

  return {
    ok: true,
    mode,
    goalCents: toCents(goal),
    targetCents: toCents(target),
    inflationEnabled: adjustForInflation,
    inflationPercent: inflation,
    startingCents: toCents(start),
    monthlyContributionCents: toCents(contribution),
    weeklyApproxCents: null,
    durationMonths,
    durationLabel: formatted.label,
    alreadyOnTrack: false,
    unreachable: false,
    overCap: false,
    simulation,
    contributionSharePercent: contribShare,
    interestSharePercent: interestShare,
    startingSharePercent: startShare,
    workingStep:
      rate === 0
        ? `Months = (${target.toLocaleString("en-US")} − ${start.toLocaleString("en-US")}) ÷ ${contribution.toLocaleString("en-US")} → ${durationMonths} months (rounded up)`
        : `Time ≈ ${formatted.label} (${durationMonths} months), rounded up so the balance reaches the target`,
    highRateWarning,
    message: null,
  };
}
