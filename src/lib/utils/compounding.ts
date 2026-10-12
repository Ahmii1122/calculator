/**
 * Shared compounding frequency helpers used by compound-interest and
 * savings-goal calculators.
 */

export type CompoundingFrequency =
  | "annually"
  | "semiannually"
  | "quarterly"
  | "monthly"
  | "daily";

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

export function compoundingTimesPerYear(
  frequency: CompoundingFrequency,
): number {
  return (
    COMPOUNDING_OPTIONS.find((o) => o.id === frequency)?.timesPerYear ?? 12
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
