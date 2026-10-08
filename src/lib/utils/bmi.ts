/**
 * Pure BMI math and adult category thresholds for the BMI Calculator.
 * Thresholds are data (not UI constants) so they can be audited and updated.
 */

export type UnitSystem = "metric" | "imperial";
export type PopulationGuideline = "who" | "asian";

export type BmiCategory = {
  id: string;
  label: string;
  /** Inclusive lower bound (kg/m²). null = unbounded below. */
  min: number | null;
  /** Exclusive upper bound except for the top band (inclusive). */
  max: number | null;
  /** When true, max is inclusive (top obesity band). */
  maxInclusive?: boolean;
};

/** WHO adult BMI categories (ages 20+). */
export const WHO_BMI_CATEGORIES: BmiCategory[] = [
  { id: "underweight", label: "Underweight", min: null, max: 18.5 },
  { id: "normal", label: "Normal weight", min: 18.5, max: 25 },
  { id: "overweight", label: "Overweight", min: 25, max: 30 },
  { id: "obesity-1", label: "Obesity (class I)", min: 30, max: 35 },
  { id: "obesity-2", label: "Obesity (class II)", min: 35, max: 40 },
  {
    id: "obesity-3",
    label: "Obesity (class III)",
    min: 40,
    max: null,
    maxInclusive: true,
  },
];

/**
 * Commonly applied Asian public-health action points from the WHO expert
 * consultation (overweight from 23.0, obesity from 27.5). Countries may use
 * slightly different cut-offs — labeled as an alternative guideline in the UI.
 */
export const ASIAN_BMI_CATEGORIES: BmiCategory[] = [
  { id: "underweight", label: "Underweight", min: null, max: 18.5 },
  { id: "normal", label: "Normal weight", min: 18.5, max: 23 },
  { id: "overweight", label: "Overweight", min: 23, max: 27.5 },
  {
    id: "obesity",
    label: "Obesity",
    min: 27.5,
    max: null,
    maxInclusive: true,
  },
];

/** Healthy BMI band used for the secondary weight-range display (WHO normal). */
export const HEALTHY_BMI_MIN = 18.5;
export const HEALTHY_BMI_MAX = 24.9;

export const HEIGHT_CM_MIN = 50;
export const HEIGHT_CM_MAX = 250;
export const WEIGHT_KG_MIN = 10;
export const WEIGHT_KG_MAX = 500;

const LB_PER_KG = 2.2046226218;
const CM_PER_INCH = 2.54;

export function getCategories(
  guideline: PopulationGuideline,
): BmiCategory[] {
  return guideline === "asian" ? ASIAN_BMI_CATEGORIES : WHO_BMI_CATEGORIES;
}

export function categorizeBmi(
  bmi: number,
  guideline: PopulationGuideline,
): BmiCategory {
  const categories = getCategories(guideline);
  for (const category of categories) {
    const aboveMin = category.min === null || bmi >= category.min;
    let belowMax: boolean;
    if (category.max === null) {
      belowMax = true;
    } else if (category.maxInclusive) {
      belowMax = bmi <= category.max;
    } else {
      // Bands use exclusive max so 24.9 stays in normal for display rounding
      // WHO table often shows 18.5–24.9; we use <25 for the upper edge.
      belowMax = bmi < category.max;
    }
    if (aboveMin && belowMax) return category;
  }
  return categories[categories.length - 1];
}

/** Round BMI to one decimal place. */
export function roundBmi(bmi: number): number {
  return Math.round(bmi * 10) / 10;
}

export function formatBmi(bmi: number): string {
  return roundBmi(bmi).toFixed(1);
}

export function formatWeight(kg: number, system: UnitSystem): string {
  if (system === "metric") {
    const rounded = Math.round(kg * 10) / 10;
    return `${rounded.toLocaleString("en-US", {
      maximumFractionDigits: 1,
      minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
    })} kg`;
  }
  const lb = kg * LB_PER_KG;
  const rounded = Math.round(lb * 10) / 10;
  return `${rounded.toLocaleString("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 1,
  })} lb`;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_INCH;
}

export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PER_KG * 10) / 10;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export type BmiInputMetric = {
  system: "metric";
  heightCm: number | null;
  weightKg: number | null;
};

export type BmiInputImperial = {
  system: "imperial";
  heightFeet: number | null;
  heightInches: number | null;
  weightLb: number | null;
};

export type BmiInput = BmiInputMetric | BmiInputImperial;

export type BmiSuccess = {
  ok: true;
  bmi: number;
  display: string;
  category: BmiCategory;
  heightM: number;
  weightKg: number;
  /** Weight at BMI 18.5 and 24.9 for the entered height. */
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  /** Neutral delta vs nearest edge of 18.5–24.9 band; null if inside. */
  deltaVsHealthyKg: number | null;
  deltaDirection: "above" | "below" | null;
  working: string;
  /** 0–100 position on the visual scale for the active guideline. */
  scalePercent: number;
  scaleDescription: string;
};

export type BmiFailure = {
  ok: false;
  error: "empty" | "invalid" | "out_of_range";
  message: string;
};

export type BmiResult = BmiSuccess | BmiFailure;

function resolveMetric(input: BmiInput): {
  heightCm: number | null;
  weightKg: number | null;
  empty: boolean;
} {
  if (input.system === "metric") {
    const empty = input.heightCm === null && input.weightKg === null;
    return { heightCm: input.heightCm, weightKg: input.weightKg, empty };
  }
  const hasHeight =
    input.heightFeet !== null || input.heightInches !== null;
  const empty = !hasHeight && input.weightLb === null;
  if (!hasHeight || input.weightLb === null) {
    return {
      heightCm:
        hasHeight && input.heightFeet !== null
          ? feetInchesToCm(input.heightFeet, input.heightInches ?? 0)
          : null,
      weightKg: input.weightLb !== null ? lbToKg(input.weightLb) : null,
      empty,
    };
  }
  const feet = input.heightFeet ?? 0;
  const inches = input.heightInches ?? 0;
  return {
    heightCm: feetInchesToCm(feet, inches),
    weightKg: lbToKg(input.weightLb),
    empty,
  };
}

/**
 * Map BMI onto a 0–100% scale for the active guideline bands.
 * Caps the visual at a practical upper bound so extreme values stay on-screen.
 */
export function bmiToScalePercent(
  bmi: number,
  guideline: PopulationGuideline,
): number {
  const categories = getCategories(guideline);
  const visualMax = guideline === "asian" ? 40 : 45;
  const clamped = Math.min(Math.max(bmi, 12), visualMax);
  // Build cumulative segment widths proportional to band spans
  const edges: number[] = [12];
  for (const cat of categories) {
    if (cat.max !== null) edges.push(cat.max);
  }
  edges.push(visualMax);

  // Find position linearly across [12, visualMax]
  const percent = ((clamped - 12) / (visualMax - 12)) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function calculateBmi(
  input: BmiInput,
  guideline: PopulationGuideline,
): BmiResult {
  const { heightCm, weightKg, empty } = resolveMetric(input);

  if (empty || heightCm === null || weightKg === null) {
    return {
      ok: false,
      error: "empty",
      message: "Enter height and weight to see your BMI.",
    };
  }

  if (heightCm < HEIGHT_CM_MIN || heightCm > HEIGHT_CM_MAX) {
    return {
      ok: false,
      error: "out_of_range",
      message: `Height should be between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm (about 1 ft 8 in to 8 ft 2 in).`,
    };
  }

  if (weightKg < WEIGHT_KG_MIN || weightKg > WEIGHT_KG_MAX) {
    return {
      ok: false,
      error: "out_of_range",
      message: `Weight should be between ${WEIGHT_KG_MIN} and ${WEIGHT_KG_MAX} kg (about ${Math.round(WEIGHT_KG_MIN * LB_PER_KG)} to ${Math.round(WEIGHT_KG_MAX * LB_PER_KG)} lb).`,
    };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const category = categorizeBmi(bmi, guideline);
  const healthyWeightMinKg = HEALTHY_BMI_MIN * heightM * heightM;
  const healthyWeightMaxKg = HEALTHY_BMI_MAX * heightM * heightM;

  let deltaVsHealthyKg: number | null = null;
  let deltaDirection: "above" | "below" | null = null;
  if (weightKg > healthyWeightMaxKg) {
    deltaVsHealthyKg = weightKg - healthyWeightMaxKg;
    deltaDirection = "above";
  } else if (weightKg < healthyWeightMinKg) {
    deltaVsHealthyKg = healthyWeightMinKg - weightKg;
    deltaDirection = "below";
  }

  const display = formatBmi(bmi);
  const weightRounded = Math.round(weightKg * 100) / 100;
  const heightRounded = Math.round(heightM * 1000) / 1000;
  const working = `BMI = weight (kg) ÷ height (m)² = ${weightRounded} ÷ ${heightRounded}² = ${display}`;

  const scalePercent = bmiToScalePercent(bmi, guideline);

  return {
    ok: true,
    bmi,
    display,
    category,
    heightM,
    weightKg,
    healthyWeightMinKg,
    healthyWeightMaxKg,
    deltaVsHealthyKg,
    deltaDirection,
    working,
    scalePercent,
    scaleDescription: `BMI ${display}, category ${category.label}, marker at ${Math.round(scalePercent)} percent along the adult BMI scale.`,
  };
}

/** Segment widths for the visual scale (percent of bar). */
export function getScaleSegments(guideline: PopulationGuideline): {
  id: string;
  label: string;
  widthPercent: number;
}[] {
  const visualMax = guideline === "asian" ? 40 : 45;
  const visualMin = 12;
  const span = visualMax - visualMin;
  const categories = getCategories(guideline);
  const segments: { id: string; label: string; widthPercent: number }[] = [];

  let cursor = visualMin;
  for (const cat of categories) {
    const end =
      cat.max === null ? visualMax : Math.min(cat.max, visualMax);
    const width = ((end - cursor) / span) * 100;
    if (width > 0) {
      segments.push({
        id: cat.id,
        label: cat.label,
        widthPercent: width,
      });
    }
    cursor = end;
  }
  return segments;
}
