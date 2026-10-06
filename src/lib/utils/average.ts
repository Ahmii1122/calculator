/**
 * Pure statistics math for the Average Calculator.
 * Parsing and aggregation never throw; callers handle empty results.
 */

export type ModeResult =
  | { kind: "none"; label: string }
  | { kind: "single"; values: [number]; label: string }
  | { kind: "multiple"; values: number[]; label: string };

export type AverageStats = {
  numbers: number[];
  skipped: number;
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: ModeResult;
  min: number;
  max: number;
  range: number;
  /** null when any value is ≤ 0 */
  geometricMean: number | null;
  /** Population variance (÷ n). null when count === 0 */
  populationVariance: number;
  /** Sample variance (÷ n−1). null when count < 2 */
  sampleVariance: number | null;
  populationStdDev: number;
  sampleStdDev: number | null;
};

export type ParseResult = {
  numbers: number[];
  skipped: number;
};

const NUMBER_TOKEN =
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Split on commas, whitespace, or newlines; ignore blank tokens;
 * count non-numeric tokens as skipped.
 */
export function parseNumberList(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { numbers: [], skipped: 0 };
  }

  const tokens = trimmed.split(/[\s,;]+/).filter((token) => token.length > 0);
  const numbers: number[] = [];
  let skipped = 0;

  for (const token of tokens) {
    if (NUMBER_TOKEN.test(token)) {
      const value = Number(token);
      if (Number.isFinite(value)) {
        numbers.push(value);
        continue;
      }
    }
    skipped += 1;
  }

  return { numbers, skipped };
}

/** Round for display: up to 6 decimal places, avoid -0. */
export function roundStatValue(value: number): number {
  if (!Number.isFinite(value)) return value;
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Format a statistic with thousands separators and trimmed decimals.
 */
export function formatStatNumber(value: number): string {
  const rounded = roundStatValue(value);
  const abs = Math.abs(rounded);
  const decimals =
    abs >= 1000
      ? Math.min(4, countNeededDecimals(rounded))
      : Math.min(6, countNeededDecimals(rounded));

  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

function countNeededDecimals(value: number): number {
  const rounded = roundStatValue(value);
  const asFixed = rounded.toFixed(6);
  if (!asFixed.includes(".")) return 0;
  const frac = asFixed.split(".")[1].replace(/0+$/, "");
  return frac.length;
}

function computeMean(numbers: number[]): number {
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return sum / numbers.length;
}

function computeMedian(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeMode(numbers: number[]): ModeResult {
  if (numbers.length === 0) {
    return { kind: "none", label: "No mode" };
  }
  if (numbers.length === 1) {
    return {
      kind: "none",
      label: "No mode (need repeated values)",
    };
  }

  const freq = new Map<number, number>();
  for (const n of numbers) {
    freq.set(n, (freq.get(n) ?? 0) + 1);
  }

  let maxFreq = 0;
  for (const count of freq.values()) {
    if (count > maxFreq) maxFreq = count;
  }

  if (maxFreq === 1) {
    return {
      kind: "none",
      label: "No mode (all values unique)",
    };
  }

  const modes = [...freq.entries()]
    .filter(([, count]) => count === maxFreq)
    .map(([value]) => value)
    .sort((a, b) => a - b);

  if (modes.length === 1) {
    return {
      kind: "single",
      values: [modes[0]],
      label: formatStatNumber(modes[0]),
    };
  }

  return {
    kind: "multiple",
    values: modes,
    label: modes.map(formatStatNumber).join(", "),
  };
}

function computeGeometricMean(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  if (numbers.some((n) => n <= 0)) return null;

  // Use log-space to avoid overflow on large products
  const logSum = numbers.reduce((acc, n) => acc + Math.log(n), 0);
  return Math.exp(logSum / numbers.length);
}

function sumSquaredDeviations(numbers: number[], mean: number): number {
  return numbers.reduce((acc, n) => {
    const d = n - mean;
    return acc + d * d;
  }, 0);
}

/**
 * Compute mean, median, mode, range, geometric mean, and std-dev stats.
 * Returns null when there are no valid numbers.
 */
export function calculateAverageStats(raw: string): AverageStats | null {
  const { numbers, skipped } = parseNumberList(raw);
  if (numbers.length === 0) {
    return null;
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const count = numbers.length;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  const mean = computeMean(numbers);
  const median = computeMedian(sorted);
  const mode = computeMode(numbers);
  const min = sorted[0];
  const max = sorted[count - 1];
  const range = max - min;
  const geometricMean = computeGeometricMean(numbers);
  const ss = sumSquaredDeviations(numbers, mean);
  const populationVariance = ss / count;
  const sampleVariance = count >= 2 ? ss / (count - 1) : null;
  const populationStdDev = Math.sqrt(populationVariance);
  const sampleStdDev =
    sampleVariance !== null ? Math.sqrt(sampleVariance) : null;

  return {
    numbers,
    skipped,
    count,
    sum,
    mean,
    median,
    mode,
    min,
    max,
    range,
    geometricMean,
    populationVariance,
    sampleVariance,
    populationStdDev,
    sampleStdDev,
  };
}
