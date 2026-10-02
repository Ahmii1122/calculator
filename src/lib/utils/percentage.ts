/**
 * Pure percentage math for the Percentage Calculator.
 * All modes take parsed numbers (or null) and never throw.
 */

export type PercentageMode =
  | "percent-of"
  | "is-what-percent"
  | "percent-change"
  | "adjust-by-percent"
  | "find-whole";

export type AdjustDirection = "increase" | "decrease";

export type PercentageCalcInput = {
  mode: PercentageMode;
  /** First blank in the mode sentence (X). */
  x: number | null;
  /** Second blank in the mode sentence (Y). */
  y: number | null;
  direction?: AdjustDirection;
};

export type PercentageSuccess = {
  ok: true;
  value: number;
  /** Human-readable primary result, e.g. "30" or "25%". */
  display: string;
  /** One-line worked step with the user's numbers. */
  working: string;
  /** For percent-change mode. */
  changeKind?: "increase" | "decrease" | "unchanged";
};

export type PercentageFailure = {
  ok: false;
  error: "empty" | "division_by_zero" | "undefined_change";
  message: string;
};

export type PercentageResult = PercentageSuccess | PercentageFailure;

/** Round for display: up to 4 decimal places, trim trailing zeros. */
export function roundDisplayValue(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 10000) / 10000;
  // Avoid -0
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Format a number with thousands separators and trimmed decimals (max 4).
 */
export function formatPercentNumber(value: number): string {
  const rounded = roundDisplayValue(value);
  const abs = Math.abs(rounded);
  const decimals =
    abs >= 1000 ? 2 : abs >= 1 ? Math.min(4, countNeededDecimals(rounded)) : 4;

  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

function countNeededDecimals(value: number): number {
  const rounded = roundDisplayValue(value);
  const asFixed = rounded.toFixed(4);
  if (!asFixed.includes(".")) return 0;
  const frac = asFixed.split(".")[1].replace(/0+$/, "");
  return frac.length;
}

function readPair(
  x: number | null,
  y: number | null,
): [number, number] | null {
  if (
    x === null ||
    y === null ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return null;
  }
  return [x, y];
}

/**
 * Run the selected percentage mode. Returns empty when inputs are incomplete.
 */
export function calculatePercentage(
  input: PercentageCalcInput,
): PercentageResult {
  const { mode, direction = "increase" } = input;
  const pair = readPair(input.x, input.y);

  if (!pair) {
    return {
      ok: false,
      error: "empty",
      message: "Enter both numbers to calculate.",
    };
  }

  const [x, y] = pair;

  switch (mode) {
    case "percent-of": {
      // What is X% of Y?
      const value = (x / 100) * y;
      return {
        ok: true,
        value,
        display: formatPercentNumber(value),
        working: `${formatPercentNumber(x)}% × ${formatPercentNumber(y)} = ${formatPercentNumber(value)}`,
      };
    }
    case "is-what-percent": {
      // X is what % of Y?
      if (y === 0) {
        return {
          ok: false,
          error: "division_by_zero",
          message:
            "Cannot divide by zero. Enter a non-zero number for the whole (Y).",
        };
      }
      const value = (x / y) * 100;
      return {
        ok: true,
        value,
        display: `${formatPercentNumber(value)}%`,
        working: `(${formatPercentNumber(x)} ÷ ${formatPercentNumber(y)}) × 100 = ${formatPercentNumber(value)}%`,
      };
    }
    case "percent-change": {
      // % change from X to Y — denominator uses |X|
      if (x === 0) {
        return {
          ok: false,
          error: "undefined_change",
          message:
            "Percent change is undefined when the starting value is 0 — there is no baseline to compare against.",
        };
      }
      const value = ((y - x) / Math.abs(x)) * 100;
      const changeKind: PercentageSuccess["changeKind"] =
        value > 0 ? "increase" : value < 0 ? "decrease" : "unchanged";
      const absDisplay = formatPercentNumber(Math.abs(value));
      const label =
        changeKind === "unchanged"
          ? "0% (no change)"
          : changeKind === "increase"
            ? `${absDisplay}% increase`
            : `${absDisplay}% decrease`;
      return {
        ok: true,
        value,
        display: label,
        working: `((${formatPercentNumber(y)} − ${formatPercentNumber(x)}) ÷ |${formatPercentNumber(x)}|) × 100 = ${formatPercentNumber(value)}%`,
        changeKind,
      };
    }
    case "adjust-by-percent": {
      // Increase or decrease X by Y%
      const factor =
        direction === "increase" ? 1 + y / 100 : 1 - y / 100;
      const value = x * factor;
      const verb = direction === "increase" ? "increased" : "decreased";
      const sign = direction === "increase" ? "+" : "−";
      return {
        ok: true,
        value,
        display: formatPercentNumber(value),
        working: `${formatPercentNumber(x)} ${verb} by ${formatPercentNumber(y)}% → ${formatPercentNumber(x)} × (1 ${sign} ${formatPercentNumber(y)}/100) = ${formatPercentNumber(value)}`,
      };
    }
    case "find-whole": {
      // X is Y% of what number?
      if (y === 0) {
        return {
          ok: false,
          error: "division_by_zero",
          message:
            "Cannot use 0%. Enter a non-zero percentage to find the whole.",
        };
      }
      const value = x / (y / 100);
      return {
        ok: true,
        value,
        display: formatPercentNumber(value),
        working: `${formatPercentNumber(x)} ÷ (${formatPercentNumber(y)} ÷ 100) = ${formatPercentNumber(value)}`,
      };
    }
    default:
      return {
        ok: false,
        error: "empty",
        message: "Enter both numbers to calculate.",
      };
  }
}

/** Parse a decimal input string; empty / invalid → null (not NaN). */
export function parseDecimalInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed || trimmed === "-" || trimmed === "." || trimmed === "-.") {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
