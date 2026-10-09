/**
 * Pure calorie math for the Calorie Calculator (BMR / TDEE).
 * Mifflin–St Jeor equation, activity multipliers, and safety floors
 * are stored as data for auditability.
 */

export type UnitSystem = "metric" | "imperial";
export type SexForFormula = "male" | "female";
export type GoalMode = "maintain" | "loss" | "gain";

export type ActivityLevel = {
  id: string;
  label: string;
  description: string;
  multiplier: number;
};

/** Standard Harris–Benedict–style activity factors applied to Mifflin–St Jeor BMR. */
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  {
    id: "sedentary",
    label: "Sedentary",
    description: "Little or no exercise",
    multiplier: 1.2,
  },
  {
    id: "light",
    label: "Lightly active",
    description: "Light exercise 1 to 3 days a week",
    multiplier: 1.375,
  },
  {
    id: "moderate",
    label: "Moderately active",
    description: "Exercise 3 to 5 days a week",
    multiplier: 1.55,
  },
  {
    id: "very",
    label: "Very active",
    description: "Hard exercise 6 to 7 days a week",
    multiplier: 1.725,
  },
  {
    id: "extra",
    label: "Extra active",
    description: "Very hard exercise or a physical job",
    multiplier: 1.9,
  },
];

/** Daily calorie floors — do not display goal targets below these. */
export const SAFETY_FLOORS: Record<SexForFormula, number> = {
  female: 1200,
  male: 1500,
};

/** Suggested daily adjustment range for gradual change (not a prescription). */
export const GOAL_ADJUSTMENT = {
  minDelta: 250,
  maxDelta: 500,
} as const;

export const AGE_MIN = 18;
export const AGE_MAX = 100;
export const HEIGHT_CM_MIN = 120;
export const HEIGHT_CM_MAX = 230;
export const WEIGHT_KG_MIN = 30;
export const WEIGHT_KG_MAX = 300;

const LB_PER_KG = 2.2046226218;
const CM_PER_INCH = 2.54;

export function getActivity(id: string): ActivityLevel | undefined {
  return ACTIVITY_LEVELS.find((level) => level.id === id);
}

export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
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

/** Round calorie estimates to the nearest 10. */
export function roundCalories(value: number): number {
  return Math.round(value / 10) * 10;
}

export function formatCalories(value: number): string {
  return roundCalories(value).toLocaleString("en-US");
}

/**
 * Mifflin–St Jeor resting energy expenditure (BMR / REE) in kcal/day.
 * Weight in kg, height in cm, age in years.
 */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: SexForFormula,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, multiplier: number): number {
  return bmr * multiplier;
}

export type GoalEstimate = {
  mode: GoalMode;
  /** Inclusive low end of the suggested range (already floor-clamped). */
  low: number;
  /** Inclusive high end of the suggested range (already floor-clamped). */
  high: number;
  /** True when the floor replaced a lower raw estimate. */
  floored: boolean;
  floor: number;
};

export function estimateGoalCalories(
  maintenance: number,
  sex: SexForFormula,
  mode: GoalMode,
): GoalEstimate {
  const floor = SAFETY_FLOORS[sex];
  if (mode === "maintain") {
    const value = Math.max(roundCalories(maintenance), floor);
    return {
      mode,
      low: value,
      high: value,
      floored: roundCalories(maintenance) < floor,
      floor,
    };
  }

  const { minDelta, maxDelta } = GOAL_ADJUSTMENT;
  let rawLow: number;
  let rawHigh: number;
  if (mode === "loss") {
    rawLow = maintenance - maxDelta;
    rawHigh = maintenance - minDelta;
  } else {
    rawLow = maintenance + minDelta;
    rawHigh = maintenance + maxDelta;
  }

  const low = Math.max(roundCalories(rawLow), floor);
  const high = Math.max(roundCalories(rawHigh), floor);
  const floored =
    roundCalories(rawLow) < floor || roundCalories(rawHigh) < floor;

  return {
    mode,
    low: Math.min(low, high),
    high: Math.max(low, high),
    floored,
    floor,
  };
}

export type CalorieInput = {
  age: number | null;
  sex: SexForFormula;
  heightCm: number | null;
  weightKg: number | null;
  activityId: string;
};

export type CalorieSuccess = {
  ok: true;
  bmr: number;
  tdee: number;
  bmrDisplay: string;
  tdeeDisplay: string;
  activity: ActivityLevel;
  working: string;
  /** TDEE at every activity level for comparison. */
  byActivity: { activity: ActivityLevel; tdee: number; selected: boolean }[];
};

export type CalorieFailure = {
  ok: false;
  error: "empty" | "underage" | "out_of_range" | "invalid";
  message: string;
};

export type CalorieResult = CalorieSuccess | CalorieFailure;

export function calculateCalories(input: CalorieInput): CalorieResult {
  const { age, sex, heightCm, weightKg, activityId } = input;
  const activity = getActivity(activityId);

  if (
    age === null &&
    heightCm === null &&
    weightKg === null
  ) {
    return {
      ok: false,
      error: "empty",
      message: "Enter age, height, and weight to see your calorie estimate.",
    };
  }

  if (age === null || heightCm === null || weightKg === null || !activity) {
    return {
      ok: false,
      error: "empty",
      message: "Enter age, height, weight, and an activity level.",
    };
  }

  if (age < AGE_MIN) {
    return {
      ok: false,
      error: "underage",
      message:
        "This calculator is designed for adults aged 18 and over. Energy needs for children and teens are different and should be discussed with a healthcare professional.",
    };
  }

  if (age > AGE_MAX) {
    return {
      ok: false,
      error: "out_of_range",
      message: `Age should be between ${AGE_MIN} and ${AGE_MAX}.`,
    };
  }

  if (heightCm < HEIGHT_CM_MIN || heightCm > HEIGHT_CM_MAX) {
    return {
      ok: false,
      error: "out_of_range",
      message: `Height should be between ${HEIGHT_CM_MIN} and ${HEIGHT_CM_MAX} cm (about 3 ft 11 in to 7 ft 7 in).`,
    };
  }

  if (weightKg < WEIGHT_KG_MIN || weightKg > WEIGHT_KG_MAX) {
    return {
      ok: false,
      error: "out_of_range",
      message: `Weight should be between ${WEIGHT_KG_MIN} and ${WEIGHT_KG_MAX} kg (about ${Math.round(WEIGHT_KG_MIN * LB_PER_KG)} to ${Math.round(WEIGHT_KG_MAX * LB_PER_KG)} lb).`,
    };
  }

  const bmr = calculateBmr(weightKg, heightCm, age, sex);
  const tdee = calculateTdee(bmr, activity.multiplier);
  const sexConstant = sex === "male" ? "+ 5" : "− 161";
  const w = Math.round(weightKg * 100) / 100;
  const h = Math.round(heightCm * 100) / 100;
  const bmrRounded = Math.round(bmr);
  const working = `BMR = 10 × ${w} + 6.25 × ${h} − 5 × ${age} ${sexConstant} = ${bmrRounded.toLocaleString("en-US")}; × ${activity.multiplier} = ${roundCalories(tdee).toLocaleString("en-US")}`;

  const byActivity = ACTIVITY_LEVELS.map((level) => ({
    activity: level,
    tdee: roundCalories(calculateTdee(bmr, level.multiplier)),
    selected: level.id === activity.id,
  }));

  return {
    ok: true,
    bmr,
    tdee,
    bmrDisplay: formatCalories(bmr),
    tdeeDisplay: formatCalories(tdee),
    activity,
    working,
    byActivity,
  };
}
