/**
 * Pure GPA / CGPA / SGPA math and grade-scale data for the GPA Calculator.
 */

export type CourseWeight = "regular" | "honors" | "ap-ib";

export type GradeScaleId =
  | "us-4.0"
  | "us-4.3"
  | "us-4.0-thirds"
  | "scale-5.0"
  | "scale-10"
  | "custom";

export type GradeEntryMode = "letter" | "points";

export type CourseRowInput = {
  name?: string;
  /** Letter grade key when entryMode is "letter". */
  grade: string;
  /** Direct grade points when entryMode is "points". */
  pointsDirect: number | null;
  credits: number | null;
  weight: CourseWeight;
  /** When false, the row is ignored (retake / older attempt). */
  included: boolean;
};

export type SemesterInput = {
  id: string;
  name: string;
  courses: CourseRowInput[];
};

export type ResolvedScale = {
  id: GradeScaleId;
  label: string;
  max: number;
  points: Record<string, number>;
  excludedLetters: string[];
  supportsWeighting: boolean;
  /** Default CGPA→% factor; null means conversion is not offered. */
  percentageFactor: number | null;
};

export type GpaCalcInput = {
  semesters: SemesterInput[];
  scale: ResolvedScale;
  entryMode: GradeEntryMode;
  weighted: boolean;
  previousGpa: number | null;
  previousCredits: number | null;
  /** User override for CGPA→%; null uses scale default when available. */
  percentageFactor: number | null;
};

export type SemesterResult = {
  id: string;
  name: string;
  sgpa: number;
  credits: number;
  qualityPoints: number;
  working: string;
};

export type GpaSuccess = {
  ok: true;
  cgpa: number;
  totalCredits: number;
  totalQualityPoints: number;
  working: string;
  letterBand: string;
  semesters: SemesterResult[];
  scaleMax: number;
  estimatedPercentage: number | null;
  hasPrevious: boolean;
};

export type GpaFailure = {
  ok: false;
  error:
    | "empty"
    | "invalid_credits"
    | "invalid_previous_gpa"
    | "invalid_previous_credits";
  message: string;
};

export type GpaResult = GpaSuccess | GpaFailure;

export type TargetGpaInput = {
  currentGpa: number;
  creditsCompleted: number;
  creditsRemaining: number;
  targetGpa: number;
  scaleMax: number;
};

export type TargetGpaSuccess = {
  ok: true;
  neededGpa: number;
  alreadyMet: boolean;
};

export type TargetGpaFailure = {
  ok: false;
  error: "unreachable" | "invalid" | "empty";
  message: string;
};

export type TargetGpaResult = TargetGpaSuccess | TargetGpaFailure;

export type CustomGradeRow = {
  id: string;
  letter: string;
  points: string;
  excluded: boolean;
};

export type GradeScaleMeta = {
  id: GradeScaleId;
  label: string;
  /** Short note shown under the select. */
  hint: string;
  max: number;
  points: Record<string, number>;
  excludedLetters: string[];
  supportsWeighting: boolean;
  percentageFactor: number | null;
};

const US_4_0_POINTS: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

const US_4_3_POINTS: Record<string, number> = {
  ...US_4_0_POINTS,
  "A+": 4.3,
};

/** Common thirds scale (A− = 3.67, B+ = 3.33, …) used by many universities. */
const US_4_0_THIRDS_POINTS: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.67,
  "B+": 3.33,
  B: 3.0,
  "B-": 2.67,
  "C+": 2.33,
  C: 2.0,
  "C-": 1.67,
  "D+": 1.33,
  D: 1.0,
  "D-": 0.67,
  F: 0.0,
};

const SCALE_5_POINTS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

const SCALE_10_POINTS: Record<string, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
};

const US_EXCLUDED = ["P", "NP", "W"];

export const GRADE_SCALES: Record<
  Exclude<GradeScaleId, "custom">,
  GradeScaleMeta
> = {
  "us-4.0": {
    id: "us-4.0",
    label: "US 4.0 with ± (common)",
    hint: "A+ = 4.0. Confirm your school’s table — policies differ.",
    max: 4.0,
    points: US_4_0_POINTS,
    excludedLetters: US_EXCLUDED,
    supportsWeighting: true,
    percentageFactor: null,
  },
  "us-4.3": {
    id: "us-4.3",
    label: "US 4.3 (A+ = 4.3, common)",
    hint: "A+ = 4.3. Confirm your school’s table — policies differ.",
    max: 4.3,
    points: US_4_3_POINTS,
    excludedLetters: US_EXCLUDED,
    supportsWeighting: true,
    percentageFactor: null,
  },
  "us-4.0-thirds": {
    id: "us-4.0-thirds",
    label: "4.0 with thirds (common)",
    hint: "A− = 3.67, B+ = 3.33. Used by many universities, including many in Pakistan. Confirm locally.",
    max: 4.0,
    points: US_4_0_THIRDS_POINTS,
    excludedLetters: US_EXCLUDED,
    supportsWeighting: true,
    percentageFactor: null,
  },
  "scale-5.0": {
    id: "scale-5.0",
    label: "5.0 scale (common)",
    hint: "A = 5 … F = 0. Used by some universities (for example in Nigeria). Confirm locally.",
    max: 5.0,
    points: SCALE_5_POINTS,
    excludedLetters: [],
    supportsWeighting: false,
    percentageFactor: null,
  },
  "scale-10": {
    id: "scale-10",
    label: "10-point CGPA (common)",
    hint: "O = 10 … F = 0. Used by many Indian universities. Confirm your institution’s table.",
    max: 10.0,
    points: SCALE_10_POINTS,
    excludedLetters: [],
    supportsWeighting: false,
    percentageFactor: 9.5,
  },
};

export const SCALE_OPTIONS: {
  id: GradeScaleId;
  label: string;
}[] = [
  ...Object.values(GRADE_SCALES).map((s) => ({ id: s.id, label: s.label })),
  {
    id: "custom",
    label: "Custom scale (edit your own)",
  },
];

export const WEIGHT_BONUS: Record<CourseWeight, number> = {
  regular: 0,
  honors: 0.5,
  "ap-ib": 1.0,
};

export const WEIGHT_OPTIONS: { id: CourseWeight; label: string }[] = [
  { id: "regular", label: "Regular" },
  { id: "honors", label: "Honors (+0.5)" },
  { id: "ap-ib", label: "AP/IB (+1.0)" },
];

/** Rows for the on-page “grading scales” content table. */
export const SCALE_OVERVIEW_ROWS: {
  name: string;
  max: string;
  notes: string;
}[] = [
  {
    name: "US 4.0 with ±",
    max: "4.0",
    notes: "A+ capped at 4.0; A− = 3.7, B+ = 3.3, and so on.",
  },
  {
    name: "US 4.3",
    max: "4.3",
    notes: "Same plus/minus steps, but A+ = 4.3.",
  },
  {
    name: "4.0 with thirds",
    max: "4.0",
    notes: "A− = 3.67, B+ = 3.33 — common at many universities.",
  },
  {
    name: "5.0 scale",
    max: "5.0",
    notes: "Letter grades A–E/F mapped to 5–0.",
  },
  {
    name: "10-point CGPA",
    max: "10.0",
    notes: "O / A+ / A / B+ … used widely in India and elsewhere.",
  },
  {
    name: "Custom",
    max: "You set it",
    notes: "Edit any letter-to-points table to match your school.",
  },
];

export function createDefaultCustomRows(): CustomGradeRow[] {
  return Object.entries(US_4_0_POINTS).map(([letter, points], index) => ({
    id: `custom-${index}-${letter}`,
    letter,
    points: String(points),
    excluded: false,
  })).concat(
    US_EXCLUDED.map((letter, index) => ({
      id: `custom-ex-${index}-${letter}`,
      letter,
      points: "0",
      excluded: true,
    })),
  );
}

export function resolveScale(
  scaleId: GradeScaleId,
  customRows?: CustomGradeRow[],
): ResolvedScale {
  if (scaleId !== "custom") {
    const meta = GRADE_SCALES[scaleId];
    return {
      id: meta.id,
      label: meta.label,
      max: meta.max,
      points: meta.points,
      excludedLetters: meta.excludedLetters,
      supportsWeighting: meta.supportsWeighting,
      percentageFactor: meta.percentageFactor,
    };
  }

  const points: Record<string, number> = {};
  const excludedLetters: string[] = [];
  let max = 0;

  for (const row of customRows ?? []) {
    const letter = row.letter.trim();
    if (!letter) continue;
    if (row.excluded) {
      excludedLetters.push(letter);
      continue;
    }
    const value = parseGpaInput(row.points);
    if (value === null || value < 0) continue;
    points[letter] = value;
    if (value > max) max = value;
  }

  return {
    id: "custom",
    label: "Custom scale",
    max: max > 0 ? max : 4,
    points,
    excludedLetters,
    supportsWeighting: false,
    percentageFactor: null,
  };
}

export function getLetterOptions(scale: ResolvedScale): string[] {
  const graded = Object.keys(scale.points);
  const excluded = scale.excludedLetters.filter((l) => !graded.includes(l));
  return [...graded, ...excluded];
}

/** Rows used for the on-page default US 4.0 reference table. */
export function getScaleTableRows(scaleId: Exclude<GradeScaleId, "custom">) {
  const scale = GRADE_SCALES[scaleId];
  return Object.entries(scale.points).map(([letter, points]) => ({
    letter,
    points,
  }));
}

export function isExcludedGrade(
  grade: string,
  excludedLetters: string[],
): boolean {
  return excludedLetters.includes(grade);
}

export function isPassingForWeight(
  grade: string,
  points: Record<string, number>,
): boolean {
  const value = points[grade];
  return value !== undefined && value > 0;
}

/**
 * Unweighted or weighted grade points for one graded letter.
 * Weighting never raises a failing (0-point) grade above 0.
 */
export function gradePointsFor(
  grade: string,
  scale: ResolvedScale,
  weighted: boolean,
  weight: CourseWeight,
): number | null {
  if (!grade || isExcludedGrade(grade, scale.excludedLetters)) return null;
  const base = scale.points[grade];
  if (base === undefined) return null;
  if (
    !weighted ||
    !scale.supportsWeighting ||
    !isPassingForWeight(grade, scale.points)
  ) {
    return base;
  }
  return base + WEIGHT_BONUS[weight];
}

export function formatGpa(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Up to 4 decimal places for worked-step quality points / credits. */
export function formatQualityPoints(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
}

export function formatPercentage(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Rough letter-band label normalized to a 4.0-style feel (display only). */
export function letterBandForGpa(gpa: number, scaleMax: number): string {
  const ratio = scaleMax > 0 ? gpa / scaleMax : 0;
  const normalized = ratio * 4;
  if (normalized >= 3.85) return "A / A+ range";
  if (normalized >= 3.5) return "A- range";
  if (normalized >= 3.15) return "B+ range";
  if (normalized >= 2.85) return "B range";
  if (normalized >= 2.5) return "B- range";
  if (normalized >= 2.15) return "C+ range";
  if (normalized >= 1.85) return "C range";
  if (normalized >= 1.5) return "C- range";
  if (normalized >= 1.15) return "D+ range";
  if (normalized >= 0.85) return "D range";
  if (normalized >= 0.5) return "D- range";
  return "Below D range";
}

export function parseCreditsInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed || trimmed === "." || trimmed === "-") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseGpaInput(raw: string): number | null {
  return parseCreditsInput(raw);
}

function semesterWorking(qp: number, credits: number, gpa: number): string {
  return `Quality points ÷ credits = ${formatQualityPoints(qp)} ÷ ${formatQualityPoints(credits)} = ${formatGpa(gpa)}`;
}

/**
 * Calculate per-semester SGPA and overall CGPA (optional previous cumulative).
 */
export function calculateGpa(input: GpaCalcInput): GpaResult {
  const { scale, entryMode, weighted } = input;
  const semesterResults: SemesterResult[] = [];
  let totalCredits = 0;
  let totalQualityPoints = 0;
  let sawInvalidCredits = false;
  let sawAnyGradedAttempt = false;

  for (const semester of input.semesters) {
    let semCredits = 0;
    let semQp = 0;

    for (const course of semester.courses) {
      if (!course.included) continue;

      let points: number | null = null;

      if (entryMode === "points") {
        if (course.pointsDirect === null) continue;
        if (!(course.pointsDirect >= 0)) continue;
        points = course.pointsDirect;
        sawAnyGradedAttempt = true;
      } else {
        if (!course.grade) continue;
        if (isExcludedGrade(course.grade, scale.excludedLetters)) continue;
        points = gradePointsFor(course.grade, scale, weighted, course.weight);
        if (points === null) continue;
        sawAnyGradedAttempt = true;
      }

      if (course.credits === null) continue;
      if (!(course.credits > 0)) {
        sawInvalidCredits = true;
        continue;
      }

      semCredits += course.credits;
      semQp += points * course.credits;
    }

    if (semCredits > 0) {
      const sgpa = semQp / semCredits;
      semesterResults.push({
        id: semester.id,
        name: semester.name,
        sgpa,
        credits: semCredits,
        qualityPoints: semQp,
        working: semesterWorking(semQp, semCredits, sgpa),
      });
      totalCredits += semCredits;
      totalQualityPoints += semQp;
    }
  }

  if (sawInvalidCredits && totalCredits === 0 && sawAnyGradedAttempt) {
    return {
      ok: false,
      error: "invalid_credits",
      message: "Credits must be greater than 0 for graded courses.",
    };
  }

  const hasPrev =
    input.previousGpa !== null || input.previousCredits !== null;

  if (totalCredits === 0 && !hasPrev) {
    return {
      ok: false,
      error: "empty",
      message:
        "Add at least one course with a grade and credits greater than 0.",
    };
  }

  let prevPoints = 0;
  let prevCredits = 0;

  if (hasPrev) {
    if (
      input.previousGpa === null ||
      !Number.isFinite(input.previousGpa) ||
      input.previousGpa < 0 ||
      input.previousGpa > scale.max
    ) {
      return {
        ok: false,
        error: "invalid_previous_gpa",
        message: `Current CGPA must be between 0 and ${formatGpa(scale.max)}.`,
      };
    }
    if (
      input.previousCredits === null ||
      !Number.isFinite(input.previousCredits) ||
      !(input.previousCredits > 0)
    ) {
      return {
        ok: false,
        error: "invalid_previous_credits",
        message: "Credits completed must be greater than 0.",
      };
    }
    prevPoints = input.previousGpa * input.previousCredits;
    prevCredits = input.previousCredits;
  }

  if (totalCredits === 0 && hasPrev) {
    // Only previous CGPA entered — treat as the overall figure.
    const cgpa = input.previousGpa!;
    const factor =
      input.percentageFactor ?? scale.percentageFactor;
    return {
      ok: true,
      cgpa,
      totalCredits: prevCredits,
      totalQualityPoints: prevPoints,
      working: semesterWorking(prevPoints, prevCredits, cgpa),
      letterBand: letterBandForGpa(cgpa, scale.max),
      semesters: semesterResults,
      scaleMax: scale.max,
      estimatedPercentage:
        factor !== null && factor > 0 ? cgpa * factor : null,
      hasPrevious: true,
    };
  }

  const combinedCredits = totalCredits + prevCredits;
  const combinedQp = totalQualityPoints + prevPoints;
  const cgpa = combinedQp / combinedCredits;

  const factor = input.percentageFactor ?? scale.percentageFactor;

  return {
    ok: true,
    cgpa,
    totalCredits: combinedCredits,
    totalQualityPoints: combinedQp,
    working: semesterWorking(combinedQp, combinedCredits, cgpa),
    letterBand: letterBandForGpa(cgpa, scale.max),
    semesters: semesterResults,
    scaleMax: scale.max,
    estimatedPercentage:
      factor !== null && factor > 0 ? cgpa * factor : null,
    hasPrevious: hasPrev,
  };
}

/**
 * GPA needed on remaining credits to hit a target CGPA.
 * needed = (target × (done + left) − current × done) ÷ left
 */
export function calculateTargetGpa(input: TargetGpaInput): TargetGpaResult {
  const {
    currentGpa,
    creditsCompleted,
    creditsRemaining,
    targetGpa,
    scaleMax,
  } = input;

  if (
    !Number.isFinite(currentGpa) ||
    !Number.isFinite(creditsCompleted) ||
    !Number.isFinite(creditsRemaining) ||
    !Number.isFinite(targetGpa)
  ) {
    return {
      ok: false,
      error: "empty",
      message: "Enter current CGPA, credits completed, credits left, and target.",
    };
  }

  if (creditsCompleted < 0 || creditsRemaining <= 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Credits completed must be ≥ 0 and credits still to take must be greater than 0.",
    };
  }

  if (currentGpa < 0 || currentGpa > scaleMax) {
    return {
      ok: false,
      error: "invalid",
      message: `Current CGPA must be between 0 and ${formatGpa(scaleMax)}.`,
    };
  }

  if (targetGpa < 0) {
    return {
      ok: false,
      error: "invalid",
      message: "Target CGPA must be 0 or higher.",
    };
  }

  if (targetGpa > scaleMax) {
    return {
      ok: false,
      error: "unreachable",
      message: `That target is above this scale’s maximum of ${formatGpa(scaleMax)}.`,
    };
  }

  const needed =
    (targetGpa * (creditsCompleted + creditsRemaining) -
      currentGpa * creditsCompleted) /
    creditsRemaining;

  if (needed > scaleMax + 1e-9) {
    return {
      ok: false,
      error: "unreachable",
      message: `Not reachable: you would need a ${formatGpa(needed)} GPA on remaining credits, above the ${formatGpa(scaleMax)} maximum.`,
    };
  }

  if (needed <= 0) {
    return {
      ok: true,
      neededGpa: 0,
      alreadyMet: true,
    };
  }

  return {
    ok: true,
    neededGpa: needed,
    alreadyMet: false,
  };
}

export const MAX_COURSE_ROWS_PER_SEMESTER = 20;
export const INITIAL_COURSE_ROWS = 4;
export const MAX_SEMESTERS = 12;
export const MAX_CUSTOM_GRADE_ROWS = 24;
