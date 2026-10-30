/**
 * Pure pay-period conversion for the Salary to Hourly Calculator.
 * Converts any input period to yearly first, then derives the rest.
 * Display rounding only — never returns NaN/Infinity in success displays.
 */

export type PayPeriod =
  | "hourly"
  | "daily"
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "quarterly"
  | "yearly";

export const PAY_PERIODS: {
  id: PayPeriod;
  label: string;
  shortLabel: string;
}[] = [
  { id: "hourly", label: "Hourly", shortLabel: "Hourly" },
  { id: "daily", label: "Daily", shortLabel: "Daily" },
  { id: "weekly", label: "Weekly", shortLabel: "Weekly" },
  { id: "biweekly", label: "Every two weeks", shortLabel: "Bi-weekly" },
  { id: "semimonthly", label: "Twice a month", shortLabel: "Semi-monthly" },
  { id: "monthly", label: "Monthly", shortLabel: "Monthly" },
  { id: "quarterly", label: "Quarterly", shortLabel: "Quarterly" },
  { id: "yearly", label: "Yearly", shortLabel: "Yearly" },
];

export type SalaryHourlyInput = {
  amount: number | null;
  period: PayPeriod;
  hoursPerWeek: number | null;
  daysPerWeek: number | null;
  weeksPerYear: number | null;
  /** Optional unpaid weeks off; subtracted from weeksPerYear. */
  unpaidWeeksOff: number | null;
};

export type SalaryHourlyBreakdown = {
  hourly: number;
  daily: number;
  weekly: number;
  biweekly: number;
  semimonthly: number;
  monthly: number;
  quarterly: number;
  yearly: number;
};

export type SalaryHourlySuccess = {
  ok: true;
  weeksWorked: number;
  hoursPerWeek: number;
  daysPerWeek: number;
  inputPeriod: PayPeriod;
  amounts: SalaryHourlyBreakdown;
  working: string;
};

export type SalaryHourlyFailure = {
  ok: false;
  error:
    | "empty"
    | "negative"
    | "hours_range"
    | "days_range"
    | "weeks_range"
    | "unpaid_range"
    | "zero_weeks"
    | "overflow";
  message: string;
};

export type SalaryHourlyResult = SalaryHourlySuccess | SalaryHourlyFailure;

const MAX_HOURS_PER_WEEK = 168;
const MAX_DAYS_PER_WEEK = 7;
const MAX_WEEKS_PER_YEAR = 52;
const MAX_ABS = 1e15;

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatPayNumber(value: number): string {
  const rounded = roundMoney(value);
  if (!Number.isFinite(rounded)) return "—";
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function weeksWorkedFromInput(
  weeksPerYear: number,
  unpaidWeeksOff: number | null,
): number {
  const unpaid = unpaidWeeksOff ?? 0;
  return weeksPerYear - unpaid;
}

/** Convert the entered amount into a yearly figure. */
export function toYearly(
  amount: number,
  period: PayPeriod,
  hoursPerWeek: number,
  daysPerWeek: number,
  weeksWorked: number,
): number {
  switch (period) {
    case "hourly":
      return amount * hoursPerWeek * weeksWorked;
    case "daily":
      return amount * daysPerWeek * weeksWorked;
    case "weekly":
      return amount * weeksWorked;
    case "biweekly":
      return amount * (weeksWorked / 2);
    case "semimonthly":
      return amount * 24;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "yearly":
      return amount;
  }
}

export function deriveFromYearly(
  yearly: number,
  hoursPerWeek: number,
  daysPerWeek: number,
  weeksWorked: number,
): SalaryHourlyBreakdown {
  const weekly = yearly / weeksWorked;
  return {
    yearly,
    weekly,
    biweekly: weekly * 2,
    semimonthly: yearly / 24,
    monthly: yearly / 12,
    quarterly: yearly / 4,
    daily: weekly / daysPerWeek,
    hourly: weekly / hoursPerWeek,
  };
}

function buildWorkingStep(
  amount: number,
  period: PayPeriod,
  hoursPerWeek: number,
  daysPerWeek: number,
  weeksWorked: number,
  yearly: number,
): string {
  const a = formatPayNumber(amount);
  const y = formatPayNumber(yearly);
  const h = formatPayNumber(hoursPerWeek);
  const d = formatPayNumber(daysPerWeek);
  const w = formatPayNumber(weeksWorked);

  switch (period) {
    case "hourly":
      return `${a} × ${h} hours × ${w} weeks = ${y} per year`;
    case "daily":
      return `${a} × ${d} days × ${w} weeks = ${y} per year`;
    case "weekly":
      return `${a} × ${w} weeks = ${y} per year`;
    case "biweekly":
      return `${a} × (${w} weeks ÷ 2) = ${y} per year`;
    case "semimonthly":
      return `${a} × 24 = ${y} per year`;
    case "monthly":
      return `${a} × 12 = ${y} per year`;
    case "quarterly":
      return `${a} × 4 = ${y} per year`;
    case "yearly":
      return `${a} per year (entered as yearly pay)`;
  }
}

export function calculateSalaryHourly(
  input: SalaryHourlyInput,
): SalaryHourlyResult {
  if (input.amount === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter a pay amount.",
    };
  }
  if (input.amount < 0) {
    return {
      ok: false,
      error: "negative",
      message: "Enter a pay amount of zero or more.",
    };
  }
  if (!Number.isFinite(input.amount) || Math.abs(input.amount) > MAX_ABS) {
    return {
      ok: false,
      error: "overflow",
      message: "Enter a pay amount within a reasonable range.",
    };
  }

  if (input.hoursPerWeek === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter hours worked per week.",
    };
  }
  if (input.hoursPerWeek <= 0) {
    return {
      ok: false,
      error: "hours_range",
      message: "Hours per week must be greater than zero.",
    };
  }
  if (input.hoursPerWeek > MAX_HOURS_PER_WEEK) {
    return {
      ok: false,
      error: "hours_range",
      message: `Hours per week cannot be more than ${MAX_HOURS_PER_WEEK} (hours in a week).`,
    };
  }

  if (input.daysPerWeek === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter days worked per week.",
    };
  }
  if (input.daysPerWeek <= 0) {
    return {
      ok: false,
      error: "days_range",
      message: "Days per week must be greater than zero.",
    };
  }
  if (input.daysPerWeek > MAX_DAYS_PER_WEEK) {
    return {
      ok: false,
      error: "days_range",
      message: `Days per week cannot be more than ${MAX_DAYS_PER_WEEK}.`,
    };
  }

  if (input.weeksPerYear === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter weeks worked per year.",
    };
  }
  if (input.weeksPerYear <= 0) {
    return {
      ok: false,
      error: "weeks_range",
      message: "Weeks per year must be greater than zero.",
    };
  }
  if (input.weeksPerYear > MAX_WEEKS_PER_YEAR) {
    return {
      ok: false,
      error: "weeks_range",
      message: `Weeks per year cannot be more than ${MAX_WEEKS_PER_YEAR}.`,
    };
  }

  const unpaid = input.unpaidWeeksOff;
  if (unpaid !== null) {
    if (unpaid < 0) {
      return {
        ok: false,
        error: "unpaid_range",
        message: "Unpaid weeks off cannot be negative.",
      };
    }
    if (unpaid >= input.weeksPerYear) {
      return {
        ok: false,
        error: "unpaid_range",
        message: "Unpaid weeks off must be less than weeks worked per year.",
      };
    }
  }

  const weeksWorked = weeksWorkedFromInput(input.weeksPerYear, unpaid);
  if (weeksWorked <= 0) {
    return {
      ok: false,
      error: "zero_weeks",
      message: "Weeks worked per year must be greater than zero after unpaid time off.",
    };
  }

  const yearly = toYearly(
    input.amount,
    input.period,
    input.hoursPerWeek,
    input.daysPerWeek,
    weeksWorked,
  );

  if (!Number.isFinite(yearly) || Math.abs(yearly) > MAX_ABS) {
    return {
      ok: false,
      error: "overflow",
      message: "That conversion is too large to display.",
    };
  }

  const amounts = deriveFromYearly(
    yearly,
    input.hoursPerWeek,
    input.daysPerWeek,
    weeksWorked,
  );

  for (const value of Object.values(amounts)) {
    if (!Number.isFinite(value)) {
      return {
        ok: false,
        error: "overflow",
        message: "That conversion produced a non-finite result.",
      };
    }
  }

  return {
    ok: true,
    weeksWorked,
    hoursPerWeek: input.hoursPerWeek,
    daysPerWeek: input.daysPerWeek,
    inputPeriod: input.period,
    amounts,
    working: buildWorkingStep(
      input.amount,
      input.period,
      input.hoursPerWeek,
      input.daysPerWeek,
      weeksWorked,
      yearly,
    ),
  };
}

/** Amount for a given period from a successful result (for round-trip checks). */
export function amountForPeriod(
  amounts: SalaryHourlyBreakdown,
  period: PayPeriod,
): number {
  switch (period) {
    case "hourly":
      return amounts.hourly;
    case "daily":
      return amounts.daily;
    case "weekly":
      return amounts.weekly;
    case "biweekly":
      return amounts.biweekly;
    case "semimonthly":
      return amounts.semimonthly;
    case "monthly":
      return amounts.monthly;
    case "quarterly":
      return amounts.quarterly;
    case "yearly":
      return amounts.yearly;
  }
}
