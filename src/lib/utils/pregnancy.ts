/**
 * Pure pregnancy due-date math (EDD / gestational age).
 * All offsets and trimester/term definitions are stored as data for auditability.
 * Local calendar dates only — use date-fns, no UTC conversion.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

export type PregnancyMode = "lmp" | "conception" | "ivf" | "ultrasound";

export type PregnancyModeOption = {
  id: PregnancyMode;
  label: string;
  shortLabel: string;
};

export const PREGNANCY_MODES: PregnancyModeOption[] = [
  {
    id: "lmp",
    label: "Last period (LMP)",
    shortLabel: "Due date by LMP",
  },
  {
    id: "conception",
    label: "Conception date",
    shortLabel: "From conception",
  },
  {
    id: "ivf",
    label: "IVF transfer",
    shortLabel: "Embryo transfer",
  },
  {
    id: "ultrasound",
    label: "Ultrasound",
    shortLabel: "Scan dating",
  },
];

/** Standard gestational length from LMP to EDD (40 weeks). */
export const GESTATION_DAYS = 280;

/** Approximate days from conception to EDD (40 weeks − 2 weeks). */
export const CONCEPTION_TO_EDD_DAYS = 266;

export const CYCLE_LENGTH_DEFAULT = 28;
export const CYCLE_LENGTH_MIN = 21;
export const CYCLE_LENGTH_MAX = 45;

export type EmbryoOption = {
  id: string;
  label: string;
  ageDays: number;
};

/** Embryo age at transfer — extend this list to add more IVF day options. */
export const EMBRYO_OPTIONS: EmbryoOption[] = [
  { id: "day-3", label: "Day 3", ageDays: 3 },
  { id: "day-5", label: "Day 5", ageDays: 5 },
  { id: "day-6", label: "Day 6", ageDays: 6 },
];

export const ULTRASOUND_WEEKS_MIN = 4;
export const ULTRASOUND_WEEKS_MAX = 42;

export type TrimesterRange = {
  id: "first" | "second" | "third";
  label: string;
  /** Inclusive start, gestational age in days from LMP (0 = 0w0d). */
  startDays: number;
  /** Inclusive end in days, or null for open-ended. */
  endDays: number | null;
};

/**
 * Trimester ranges used on this page.
 * Note: sources define trimester boundaries slightly differently.
 */
export const TRIMESTERS: TrimesterRange[] = [
  { id: "first", label: "First trimester", startDays: 0, endDays: 13 * 7 + 6 },
  {
    id: "second",
    label: "Second trimester",
    startDays: 14 * 7,
    endDays: 27 * 7 + 6,
  },
  { id: "third", label: "Third trimester", startDays: 28 * 7, endDays: null },
];

export type TermMilestone = {
  id: string;
  label: string;
  /** Gestational age label such as "14w0d". */
  gestationalLabel: string;
  startDays: number;
};

/** Key dates derived from the EDD (shown in the results table). */
export const KEY_DATE_MILESTONES: TermMilestone[] = [
  {
    id: "second-trimester",
    label: "Second trimester begins",
    gestationalLabel: "14w0d",
    startDays: 14 * 7,
  },
  {
    id: "third-trimester",
    label: "Third trimester begins",
    gestationalLabel: "28w0d",
    startDays: 28 * 7,
  },
  {
    id: "early-term",
    label: "Early term begins",
    gestationalLabel: "37w0d",
    startDays: 37 * 7,
  },
  {
    id: "full-term",
    label: "Full term begins",
    gestationalLabel: "39w0d",
    startDays: 39 * 7,
  },
  {
    id: "edd",
    label: "Estimated due date",
    gestationalLabel: "40w0d",
    startDays: GESTATION_DAYS,
  },
];

/** Term category labels for the explanation table (definitions vary by source). */
export const TERM_DEFINITIONS = [
  {
    id: "early",
    label: "Early term",
    range: "37w0d to 38w6d",
  },
  {
    id: "full",
    label: "Full term",
    range: "39w0d to 40w6d",
  },
  {
    id: "late",
    label: "Late term",
    range: "41w0d to 41w6d",
  },
  {
    id: "postterm",
    label: "Postterm",
    range: "42w0d and beyond",
  },
] as const;

export const BIRTH_WINDOW_START_DAYS = 37 * 7;
export const BIRTH_WINDOW_END_DAYS = 42 * 7;

export function parseLocalDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = parseISO(value.trim());
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date): string {
  return format(date, "MMMM d, yyyy");
}

export function formatDisplayDateWithWeekday(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

export function weeksAndDaysFromTotal(totalDays: number): {
  weeks: number;
  days: number;
  totalDays: number;
} {
  const safe = Math.max(0, Math.floor(totalDays));
  return {
    weeks: Math.floor(safe / 7),
    days: safe % 7,
    totalDays: safe,
  };
}

export function formatWeeksDays(totalDays: number): string {
  const { weeks, days } = weeksAndDaysFromTotal(totalDays);
  const weekLabel = weeks === 1 ? "week" : "weeks";
  const dayLabel = days === 1 ? "day" : "days";
  return `${weeks} ${weekLabel}, ${days} ${dayLabel}`;
}

export function getEmbryoOption(id: string): EmbryoOption | undefined {
  return EMBRYO_OPTIONS.find((option) => option.id === id);
}

export function dateAtGestationalAge(edd: Date, gestationalDays: number): Date {
  return addDays(edd, gestationalDays - GESTATION_DAYS);
}

export function getTrimester(gestationalDays: number): TrimesterRange {
  for (const trimester of TRIMESTERS) {
    const withinStart = gestationalDays >= trimester.startDays;
    const withinEnd =
      trimester.endDays === null || gestationalDays <= trimester.endDays;
    if (withinStart && withinEnd) return trimester;
  }
  return TRIMESTERS[TRIMESTERS.length - 1];
}

export type PregnancyInput = {
  mode: PregnancyMode;
  lmpDate: string;
  cycleLength: number | null;
  conceptionDate: string;
  transferDate: string;
  embryoId: string;
  scanDate: string;
  ultrasoundWeeks: number | null;
  ultrasoundDays: number | null;
  /** Client "today" after mount; null until hydrated. */
  today: Date | null;
};

export type KeyDateRow = {
  id: string;
  label: string;
  gestationalLabel: string;
  date: Date;
  dateDisplay: string;
};

export type PregnancySuccess = {
  ok: true;
  edd: Date;
  eddDisplay: string;
  eddWeekdayDisplay: string;
  working: string;
  mode: PregnancyMode;
  /** Approximate conception; null when the mode is Conception (input). */
  estimatedConception: Date | null;
  estimatedConceptionDisplay: string | null;
  /** True when EDD is before today (completed / past due dating). */
  isPast: boolean;
  /** False until client today is known. */
  todayReady: boolean;
  gestationalAge: { weeks: number; days: number; totalDays: number } | null;
  gestationalAgeDisplay: string | null;
  daysRemaining: number | null;
  trimester: TrimesterRange | null;
  keyDates: KeyDateRow[];
  birthWindowStartDisplay: string;
  birthWindowEndDisplay: string;
  /** Current gestational week index 0–40 for the timeline (null if past / not ready). */
  timelineWeek: number | null;
};

export type PregnancyFailure = {
  ok: false;
  error:
    | "empty"
    | "invalid_date"
    | "future_date"
    | "cycle_out_of_range"
    | "ultrasound_out_of_range"
    | "invalid";
  message: string;
};

export type PregnancyResult = PregnancySuccess | PregnancyFailure;

function futureDateMessage(fieldLabel: string): string {
  return `${fieldLabel} cannot be in the future. Enter a date on or before today.`;
}

function buildSuccess(
  edd: Date,
  working: string,
  mode: PregnancyMode,
  today: Date | null,
): PregnancySuccess {
  const keyDates = KEY_DATE_MILESTONES.map((milestone) => {
    const date = dateAtGestationalAge(edd, milestone.startDays);
    return {
      id: milestone.id,
      label: milestone.label,
      gestationalLabel: milestone.gestationalLabel,
      date,
      dateDisplay: formatDisplayDate(date),
    };
  });

  const birthWindowStart = dateAtGestationalAge(edd, BIRTH_WINDOW_START_DAYS);
  const birthWindowEnd = dateAtGestationalAge(edd, BIRTH_WINDOW_END_DAYS);

  const estimatedConception =
    mode === "conception" ? null : subDays(edd, CONCEPTION_TO_EDD_DAYS);

  const todayReady = today !== null;
  let isPast = false;
  let gestationalAge: PregnancySuccess["gestationalAge"] = null;
  let gestationalAgeDisplay: string | null = null;
  let daysRemaining: number | null = null;
  let trimester: TrimesterRange | null = null;
  let timelineWeek: number | null = null;

  if (today) {
    const todayStart = startOfDay(today);
    const eddStart = startOfDay(edd);
    const remaining = differenceInCalendarDays(eddStart, todayStart);
    isPast = remaining < 0;

    if (!isPast) {
      daysRemaining = remaining;
      const gaDays = GESTATION_DAYS - remaining;
      gestationalAge = weeksAndDaysFromTotal(gaDays);
      gestationalAgeDisplay = formatWeeksDays(gaDays);
      trimester = getTrimester(gaDays);
      timelineWeek = Math.min(
        40,
        Math.max(0, weeksAndDaysFromTotal(gaDays).weeks),
      );
    }
  }

  return {
    ok: true,
    edd,
    eddDisplay: formatDisplayDate(edd),
    eddWeekdayDisplay: formatDisplayDateWithWeekday(edd),
    working,
    mode,
    estimatedConception,
    estimatedConceptionDisplay: estimatedConception
      ? formatDisplayDate(estimatedConception)
      : null,
    isPast,
    todayReady,
    gestationalAge,
    gestationalAgeDisplay,
    daysRemaining,
    trimester,
    keyDates,
    birthWindowStartDisplay: formatDisplayDate(birthWindowStart),
    birthWindowEndDisplay: formatDisplayDate(birthWindowEnd),
    timelineWeek,
  };
}

export function calculatePregnancy(input: PregnancyInput): PregnancyResult {
  const today = input.today ? startOfDay(input.today) : null;

  if (input.mode === "lmp") {
    if (!input.lmpDate.trim()) {
      return {
        ok: false,
        error: "empty",
        message:
          "Enter the first day of the last menstrual period to estimate a due date.",
      };
    }
    const lmp = parseLocalDate(input.lmpDate);
    if (!lmp) {
      return {
        ok: false,
        error: "invalid_date",
        message: "Enter a valid last period date.",
      };
    }
    if (today && isAfter(lmp, today)) {
      return {
        ok: false,
        error: "future_date",
        message: futureDateMessage("Last period date"),
      };
    }
    if (
      input.cycleLength === null ||
      !Number.isFinite(input.cycleLength) ||
      !Number.isInteger(input.cycleLength)
    ) {
      return {
        ok: false,
        error: "invalid",
        message: "Enter an average cycle length in whole days.",
      };
    }
    if (
      input.cycleLength < CYCLE_LENGTH_MIN ||
      input.cycleLength > CYCLE_LENGTH_MAX
    ) {
      return {
        ok: false,
        error: "cycle_out_of_range",
        message: `Cycle length should be between ${CYCLE_LENGTH_MIN} and ${CYCLE_LENGTH_MAX} days. For cycles outside this range, ultrasound dating or a healthcare professional may be a better guide.`,
      };
    }

    const adjustment = input.cycleLength - CYCLE_LENGTH_DEFAULT;
    const edd = addDays(lmp, GESTATION_DAYS + adjustment);
    const working =
      adjustment === 0
        ? `Last period + ${GESTATION_DAYS} days = ${formatDisplayDate(edd)}`
        : `Last period + ${GESTATION_DAYS} days + (${input.cycleLength} − ${CYCLE_LENGTH_DEFAULT}) = ${formatDisplayDate(edd)}`;
    return buildSuccess(edd, working, "lmp", today);
  }

  if (input.mode === "conception") {
    if (!input.conceptionDate.trim()) {
      return {
        ok: false,
        error: "empty",
        message: "Enter a conception date to estimate a due date.",
      };
    }
    const conception = parseLocalDate(input.conceptionDate);
    if (!conception) {
      return {
        ok: false,
        error: "invalid_date",
        message: "Enter a valid conception date.",
      };
    }
    if (today && isAfter(conception, today)) {
      return {
        ok: false,
        error: "future_date",
        message: futureDateMessage("Conception date"),
      };
    }
    const edd = addDays(conception, CONCEPTION_TO_EDD_DAYS);
    const working = `Conception date + ${CONCEPTION_TO_EDD_DAYS} days = ${formatDisplayDate(edd)}`;
    return buildSuccess(edd, working, "conception", today);
  }

  if (input.mode === "ivf") {
    if (!input.transferDate.trim()) {
      return {
        ok: false,
        error: "empty",
        message: "Enter the embryo transfer date to estimate a due date.",
      };
    }
    const transfer = parseLocalDate(input.transferDate);
    if (!transfer) {
      return {
        ok: false,
        error: "invalid_date",
        message: "Enter a valid transfer date.",
      };
    }
    if (today && isAfter(transfer, today)) {
      return {
        ok: false,
        error: "future_date",
        message: futureDateMessage("Transfer date"),
      };
    }
    const embryo = getEmbryoOption(input.embryoId);
    if (!embryo) {
      return {
        ok: false,
        error: "invalid",
        message: "Choose the embryo age at transfer.",
      };
    }
    const edd = addDays(
      transfer,
      CONCEPTION_TO_EDD_DAYS - embryo.ageDays,
    );
    const working = `Transfer date + ${CONCEPTION_TO_EDD_DAYS} days − ${embryo.label} embryo (${embryo.ageDays} days) = ${formatDisplayDate(edd)}`;
    return buildSuccess(edd, working, "ivf", today);
  }

  // Ultrasound
  if (!input.scanDate.trim()) {
    return {
      ok: false,
      error: "empty",
      message:
        "Enter the ultrasound scan date and gestational age on that date.",
    };
  }
  const scan = parseLocalDate(input.scanDate);
  if (!scan) {
    return {
      ok: false,
      error: "invalid_date",
      message: "Enter a valid ultrasound scan date.",
    };
  }
  if (today && isAfter(scan, today)) {
    return {
      ok: false,
      error: "future_date",
      message: futureDateMessage("Ultrasound date"),
    };
  }
  if (
    input.ultrasoundWeeks === null ||
    input.ultrasoundDays === null ||
    !Number.isFinite(input.ultrasoundWeeks) ||
    !Number.isFinite(input.ultrasoundDays) ||
    !Number.isInteger(input.ultrasoundWeeks) ||
    !Number.isInteger(input.ultrasoundDays)
  ) {
    return {
      ok: false,
      error: "empty",
      message: "Enter gestational age as whole weeks and days.",
    };
  }
  if (input.ultrasoundDays < 0 || input.ultrasoundDays > 6) {
    return {
      ok: false,
      error: "invalid",
      message: "Days should be between 0 and 6.",
    };
  }
  const gaDays = input.ultrasoundWeeks * 7 + input.ultrasoundDays;
  const minDays = ULTRASOUND_WEEKS_MIN * 7;
  const maxDays = ULTRASOUND_WEEKS_MAX * 7;
  if (gaDays < minDays || gaDays > maxDays) {
    return {
      ok: false,
      error: "ultrasound_out_of_range",
      message: `Gestational age on the scan should be between ${ULTRASOUND_WEEKS_MIN} and ${ULTRASOUND_WEEKS_MAX} weeks.`,
    };
  }

  const edd = addDays(scan, GESTATION_DAYS - gaDays);
  const working = `Scan date + (${GESTATION_DAYS} − ${gaDays} days of gestation) = ${formatDisplayDate(edd)}`;
  return buildSuccess(edd, working, "ultrasound", today);
}
