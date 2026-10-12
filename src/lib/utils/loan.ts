/**
 * Pure loan payment / EMI / amortization math.
 * Money math uses integer cents so schedules reconcile to a zero balance.
 */

import {
  fromCents,
  toCents,
} from "@/lib/utils/money";

export type InterestMethod = "reducing" | "flat";

export {
  CURRENCY_OPTIONS,
  formatMoney,
  fromCents,
  getCurrency,
  parseDecimal,
  parseWhole,
  toCents,
  type CurrencyOption,
} from "@/lib/utils/money";

export const LOAN_AMOUNT_MIN = 0.01;
export const LOAN_AMOUNT_MAX = 100_000_000;
export const RATE_MIN = 0;
export const RATE_MAX = 100;
export const RATE_HIGH_WARNING = 50;
export const TERM_MONTHS_MIN = 1;
export const TERM_MONTHS_MAX = 50 * 12;

export function totalMonths(years: number, months: number): number {
  return Math.max(0, Math.floor(years) * 12 + Math.floor(months));
}

/**
 * Standard reducing-balance (EMI) monthly payment in cents.
 * r = annualRatePercent / 12 / 100. If r = 0, payment = principal / n.
 */
export function calculateReducingPaymentCents(
  principalCents: number,
  annualRatePercent: number,
  n: number,
): number {
  if (n <= 0 || principalCents <= 0) return 0;
  if (annualRatePercent === 0) {
    return Math.round(principalCents / n);
  }
  const r = annualRatePercent / 100 / 12;
  const factor = Math.pow(1 + r, n);
  const payment = (principalCents * r * factor) / (factor - 1);
  return Math.round(payment);
}

/** Flat-rate total interest in cents: P × rate × years (years = n / 12). */
export function calculateFlatTotalInterestCents(
  principalCents: number,
  annualRatePercent: number,
  n: number,
): number {
  const years = n / 12;
  return Math.round(principalCents * (annualRatePercent / 100) * years);
}

export function calculateFlatPaymentCents(
  principalCents: number,
  annualRatePercent: number,
  n: number,
): number {
  if (n <= 0 || principalCents <= 0) return 0;
  const totalInterest = calculateFlatTotalInterestCents(
    principalCents,
    annualRatePercent,
    n,
  );
  return Math.round((principalCents + totalInterest) / n);
}

/**
 * Estimate the reducing-balance annual rate (%) that yields the same
 * monthly payment and term as a flat-rate quote. Returns null if it
 * does not converge.
 */
export function estimateEquivalentReducingRate(
  principalCents: number,
  flatPaymentCents: number,
  n: number,
): number | null {
  if (n <= 0 || principalCents <= 0 || flatPaymentCents <= 0) return null;
  // Zero-interest reducing payment is principal/n
  const zeroPayment = principalCents / n;
  if (flatPaymentCents <= zeroPayment + 0.5) return 0;

  let lo = 0;
  let hi = 100;
  // Ensure hi is high enough that reducing payment exceeds flat payment
  for (let i = 0; i < 20 && calculateReducingPaymentCents(principalCents, hi, n) < flatPaymentCents; i++) {
    hi *= 2;
    if (hi > 1000) return null;
  }

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const pmt = calculateReducingPaymentCents(principalCents, mid, n);
    if (pmt < flatPaymentCents) lo = mid;
    else hi = mid;
  }

  const estimate = (lo + hi) / 2;
  const check = calculateReducingPaymentCents(principalCents, estimate, n);
  if (Math.abs(check - flatPaymentCents) > 2) return null;
  return Math.round(estimate * 1000) / 1000;
}

export type ScheduleRow = {
  paymentNumber: number;
  /** 0-based month index from start. */
  monthIndex: number;
  paymentCents: number;
  principalCents: number;
  interestCents: number;
  balanceCents: number;
  extraAppliedCents: number;
};

export type YearSummary = {
  year: number;
  principalCents: number;
  interestCents: number;
  endingBalanceCents: number;
  paymentCount: number;
  /** Inclusive payment numbers in this year. */
  fromPayment: number;
  toPayment: number;
};

export type LoanScheduleResult = {
  method: InterestMethod;
  monthlyPaymentCents: number;
  schedule: ScheduleRow[];
  totalInterestCents: number;
  totalPaidCents: number;
  totalPrincipalCents: number;
  paymentCount: number;
  yearly: YearSummary[];
  /** Shown for flat-rate method when the solver converges. */
  equivalentReducingRatePercent: number | null;
  workingStep: string;
};

function buildYearly(schedule: ScheduleRow[]): YearSummary[] {
  const years: YearSummary[] = [];
  let current: YearSummary | null = null;

  for (const row of schedule) {
    const year = Math.floor(row.monthIndex / 12) + 1;
    if (!current || current.year !== year) {
      current = {
        year,
        principalCents: 0,
        interestCents: 0,
        endingBalanceCents: row.balanceCents,
        paymentCount: 0,
        fromPayment: row.paymentNumber,
        toPayment: row.paymentNumber,
      };
      years.push(current);
    }
    current.principalCents += row.principalCents;
    current.interestCents += row.interestCents;
    current.endingBalanceCents = row.balanceCents;
    current.paymentCount += 1;
    current.toPayment = row.paymentNumber;
  }
  return years;
}

function monthlyInterestCents(
  balanceCents: number,
  annualRatePercent: number,
): number {
  if (annualRatePercent === 0 || balanceCents <= 0) return 0;
  return Math.round((balanceCents * annualRatePercent) / 1200);
}

/**
 * Build a reducing-balance amortization schedule in cents.
 * Extra monthly payment (cents) is applied to principal after the
 * scheduled principal portion, without overpaying the final balance.
 */
export function buildReducingSchedule(input: {
  principalCents: number;
  annualRatePercent: number;
  n: number;
  extraPaymentCents?: number;
}): LoanScheduleResult {
  const { principalCents, annualRatePercent, n } = input;
  const extraPaymentCents = Math.max(0, input.extraPaymentCents ?? 0);
  const basePayment = calculateReducingPaymentCents(
    principalCents,
    annualRatePercent,
    n,
  );

  const schedule: ScheduleRow[] = [];
  let balance = principalCents;
  let paymentNumber = 0;

  const r = annualRatePercent / 100 / 12;
  const workingStep =
    annualRatePercent === 0
      ? `Payment = ${fromCents(principalCents).toLocaleString("en-US")} ÷ ${n} = ${fromCents(basePayment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `Payment = ${fromCents(principalCents).toLocaleString("en-US")} × ${r} × (1 + ${r})^${n} ÷ ((1 + ${r})^${n} − 1) = ${fromCents(basePayment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Cap slightly above n so aggressive extras still terminate cleanly.
  const maxPayments = n + 12;
  while (balance > 0 && paymentNumber < maxPayments) {
    paymentNumber += 1;
    const interest = monthlyInterestCents(balance, annualRatePercent);
    const payoffDue = balance + interest;
    const maxThisMonth = basePayment + extraPaymentCents;
    const isFinalSlot = paymentNumber >= n;

    let payment: number;
    let principalPart: number;
    let extraApplied = 0;

    // Clear the balance on the last scheduled month, when extras cover the
    // remainder, or when the regular payment alone would overshoot — so the
    // schedule never leaves a few cents (or a negative) for a phantom month.
    if (isFinalSlot || payoffDue <= maxThisMonth) {
      principalPart = balance;
      payment = payoffDue;
      if (!isFinalSlot && extraPaymentCents > 0) {
        const regularPrincipal = Math.max(0, basePayment - interest);
        extraApplied = Math.max(0, principalPart - regularPrincipal);
      }
      balance = 0;
    } else {
      payment = basePayment;
      principalPart = payment - interest;
      if (principalPart < 0) principalPart = 0;
      const remainingAfterRegular = balance - principalPart;
      extraApplied = Math.min(extraPaymentCents, remainingAfterRegular);
      principalPart += extraApplied;
      payment += extraApplied;
      balance -= principalPart;
      if (balance < 0) balance = 0;
    }

    schedule.push({
      paymentNumber,
      monthIndex: paymentNumber - 1,
      paymentCents: payment,
      principalCents: principalPart,
      interestCents: interest,
      balanceCents: balance,
      extraAppliedCents: extraApplied,
    });

    if (balance === 0) break;
  }

  const totalInterestCents = schedule.reduce((s, r) => s + r.interestCents, 0);
  const totalPaidCents = schedule.reduce((s, r) => s + r.paymentCents, 0);
  const totalPrincipalCents = schedule.reduce((s, r) => s + r.principalCents, 0);

  return {
    method: "reducing",
    monthlyPaymentCents: basePayment,
    schedule,
    totalInterestCents,
    totalPaidCents,
    totalPrincipalCents,
    paymentCount: schedule.length,
    yearly: buildYearly(schedule),
    equivalentReducingRatePercent: null,
    workingStep,
  };
}

/**
 * Flat-rate schedule: interest is computed on the original principal for the
 * full term, then spread across equal installments. Extra payments reduce
 * principal and can shorten the remaining term.
 */
export function buildFlatSchedule(input: {
  principalCents: number;
  annualRatePercent: number;
  n: number;
  extraPaymentCents?: number;
}): LoanScheduleResult {
  const { principalCents, annualRatePercent, n } = input;
  const extraPaymentCents = Math.max(0, input.extraPaymentCents ?? 0);
  const basePayment = calculateFlatPaymentCents(
    principalCents,
    annualRatePercent,
    n,
  );
  const totalInterestTarget = calculateFlatTotalInterestCents(
    principalCents,
    annualRatePercent,
    n,
  );
  const interestPerMonth = n > 0 ? Math.round(totalInterestTarget / n) : 0;
  const years = n / 12;
  const workingStep = `Flat interest = ${fromCents(principalCents).toLocaleString("en-US")} × ${annualRatePercent}% × ${years} years = ${fromCents(totalInterestTarget).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}; payment = (principal + interest) ÷ ${n} = ${fromCents(basePayment).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const schedule: ScheduleRow[] = [];
  let balance = principalCents;
  let interestRemaining = totalInterestTarget;
  let paymentNumber = 0;

  while (balance > 0 && paymentNumber < n + 12) {
    paymentNumber += 1;
    const monthsLeftIfNoExtra = Math.max(1, n - paymentNumber + 1);
    let interest = Math.min(
      interestRemaining > 0
        ? Math.round(interestRemaining / monthsLeftIfNoExtra)
        : 0,
      interestPerMonth * 2,
    );
    if (paymentNumber >= n && interestRemaining > 0) {
      interest = interestRemaining;
    }
    interest = Math.min(interest, interestRemaining);

    const isFinalSlot = paymentNumber >= n;
    const tentativePrincipal = Math.max(0, basePayment - interest);
    const canClear =
      isFinalSlot ||
      balance <= tentativePrincipal + extraPaymentCents;

    let payment: number;
    let principalPart: number;
    let extraApplied = 0;

    if (canClear) {
      principalPart = balance;
      if (isFinalSlot) {
        interest = interestRemaining;
      }
      payment = principalPart + interest;
      if (!isFinalSlot && extraPaymentCents > 0) {
        extraApplied = Math.max(0, principalPart - tentativePrincipal);
      }
      interestRemaining -= interest;
      balance = 0;
    } else {
      interestRemaining -= interest;
      payment = basePayment;
      principalPart = payment - interest;
      if (principalPart < 0) {
        interest += principalPart;
        principalPart = 0;
        payment = interest;
      }
      const remainingAfterRegular = balance - principalPart;
      extraApplied = Math.min(extraPaymentCents, remainingAfterRegular);
      principalPart += extraApplied;
      payment += extraApplied;
      balance -= principalPart;
      if (balance < 0) balance = 0;
    }

    schedule.push({
      paymentNumber,
      monthIndex: paymentNumber - 1,
      paymentCents: payment,
      principalCents: principalPart,
      interestCents: interest,
      balanceCents: balance,
      extraAppliedCents: extraApplied,
    });

    if (balance === 0) break;
  }

  const totalInterestCents = schedule.reduce((s, r) => s + r.interestCents, 0);
  const totalPaidCents = schedule.reduce((s, r) => s + r.paymentCents, 0);
  const totalPrincipalCents = schedule.reduce((s, r) => s + r.principalCents, 0);

  return {
    method: "flat",
    monthlyPaymentCents: basePayment,
    schedule,
    totalInterestCents,
    totalPaidCents,
    totalPrincipalCents,
    paymentCount: schedule.length,
    yearly: buildYearly(schedule),
    equivalentReducingRatePercent: estimateEquivalentReducingRate(
      principalCents,
      basePayment,
      n,
    ),
    workingStep,
  };
}

export type LoanInput = {
  amount: number | null;
  annualRatePercent: number | null;
  years: number | null;
  months: number | null;
  method: InterestMethod;
  extraMonthly: number | null;
};

export type LoanSuccess = {
  ok: true;
  /** Schedule used for display (includes extras when set). */
  schedule: LoanScheduleResult;
  /** No-extra baseline for comparison when extras are set. */
  baseline: LoanScheduleResult;
  monthsSaved: number | null;
  interestSavedCents: number | null;
  n: number;
  principalCents: number;
  highRateWarning: boolean;
};

export type LoanFailure = {
  ok: false;
  error:
    | "empty"
    | "amount"
    | "rate"
    | "term"
    | "extra"
    | "invalid";
  message: string;
};

export type LoanResult = LoanSuccess | LoanFailure;

export function calculateLoan(input: LoanInput): LoanResult {
  const {
    amount,
    annualRatePercent,
    years,
    months,
    method,
    extraMonthly,
  } = input;

  if (
    amount === null &&
    annualRatePercent === null &&
    years === null &&
    months === null
  ) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a loan amount, interest rate, and term to see results.",
    };
  }

  if (amount === null || annualRatePercent === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a loan amount and annual interest rate.",
    };
  }

  if (
    !Number.isFinite(amount) ||
    amount < LOAN_AMOUNT_MIN ||
    amount > LOAN_AMOUNT_MAX
  ) {
    return {
      ok: false,
      error: "amount",
      message: `Loan amount should be between ${LOAN_AMOUNT_MIN} and ${LOAN_AMOUNT_MAX.toLocaleString("en-US")}.`,
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
      message: `Annual interest rate should be between ${RATE_MIN}% and ${RATE_MAX}%.`,
    };
  }

  const y = years ?? 0;
  const m = months ?? 0;
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    y < 0 ||
    m < 0 ||
    m > 11 ||
    !Number.isInteger(y) ||
    !Number.isInteger(m)
  ) {
    return {
      ok: false,
      error: "term",
      message: "Enter whole years and months (months 0–11).",
    };
  }

  const n = totalMonths(y, m);
  if (n < TERM_MONTHS_MIN || n > TERM_MONTHS_MAX) {
    return {
      ok: false,
      error: "term",
      message: `Loan term should be between ${TERM_MONTHS_MIN} month and 50 years.`,
    };
  }

  const extra = extraMonthly ?? 0;
  if (!Number.isFinite(extra) || extra < 0) {
    return {
      ok: false,
      error: "extra",
      message: "Extra monthly payment cannot be negative.",
    };
  }

  const principalCents = toCents(amount);
  const extraCents = toCents(extra);
  const build =
    method === "flat" ? buildFlatSchedule : buildReducingSchedule;

  const baseline = build({
    principalCents,
    annualRatePercent,
    n,
    extraPaymentCents: 0,
  });

  if (extraCents > 0) {
    const withExtra = build({
      principalCents,
      annualRatePercent,
      n,
      extraPaymentCents: extraCents,
    });
    return {
      ok: true,
      schedule: withExtra,
      baseline,
      monthsSaved: baseline.paymentCount - withExtra.paymentCount,
      interestSavedCents:
        baseline.totalInterestCents - withExtra.totalInterestCents,
      n,
      principalCents,
      highRateWarning: annualRatePercent > RATE_HIGH_WARNING,
    };
  }

  return {
    ok: true,
    schedule: baseline,
    baseline,
    monthsSaved: null,
    interestSavedCents: null,
    n,
    principalCents,
    highRateWarning: annualRatePercent > RATE_HIGH_WARNING,
  };
}

export function addMonthsLocal(date: Date, months: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Clamp overflow (e.g. Jan 31 + 1 month)
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
}

export function firstOfNextMonth(from: Date): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}

