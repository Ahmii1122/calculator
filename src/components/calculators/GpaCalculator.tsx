"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  GraduationCap,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  GRADE_SCALES,
  INITIAL_COURSE_ROWS,
  MAX_COURSE_ROWS_PER_SEMESTER,
  MAX_CUSTOM_GRADE_ROWS,
  MAX_SEMESTERS,
  SCALE_OPTIONS,
  WEIGHT_OPTIONS,
  calculateGpa,
  calculateTargetGpa,
  createDefaultCustomRows,
  formatGpa,
  formatPercentage,
  formatQualityPoints,
  getLetterOptions,
  parseCreditsInput,
  parseGpaInput,
  resolveScale,
  type CourseWeight,
  type CustomGradeRow,
  type GradeEntryMode,
  type GradeScaleId,
} from "@/lib/utils/gpa";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";

const mathTheme = CATEGORY_THEME[getCategoryTheme("math")];

function ThemeToggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <span className="relative inline-block h-6 w-11 shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-full bg-border transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${mathTheme.toggle}`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out peer-checked:translate-x-5"
      />
    </span>
  );
}

type CourseRowState = {
  id: string;
  name: string;
  grade: string;
  pointsRaw: string;
  credits: string;
  weight: CourseWeight;
  included: boolean;
};

type SemesterState = {
  id: string;
  name: string;
  courses: CourseRowState[];
};

function newId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newRow(): CourseRowState {
  return {
    id: newId("course"),
    name: "",
    grade: "",
    pointsRaw: "",
    credits: "3",
    weight: "regular",
    included: true,
  };
}

function newSemester(index: number): SemesterState {
  return {
    id: newId("sem"),
    name: `Semester ${index}`,
    courses: Array.from({ length: INITIAL_COURSE_ROWS }, () => newRow()),
  };
}

function createInitialSemesters(): SemesterState[] {
  return [newSemester(1)];
}

/**
 * College / university / high school GPA & CGPA calculator —
 * multi-semester SGPA, scales, target planner, and optional percentage.
 */
export function GpaCalculator() {
  const [semesters, setSemesters] = useState<SemesterState[]>(
    createInitialSemesters,
  );
  const [scaleId, setScaleId] = useState<GradeScaleId>("us-4.0");
  const [customRows, setCustomRows] = useState<CustomGradeRow[]>(
    createDefaultCustomRows,
  );
  const [entryMode, setEntryMode] = useState<GradeEntryMode>("letter");
  const [weighted, setWeighted] = useState(false);
  const [includePrevious, setIncludePrevious] = useState(false);
  const [prevGpaRaw, setPrevGpaRaw] = useState("");
  const [prevCreditsRaw, setPrevCreditsRaw] = useState("");
  const [percentFactorRaw, setPercentFactorRaw] = useState("9.5");
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetCurrentRaw, setTargetCurrentRaw] = useState("");
  const [targetDoneRaw, setTargetDoneRaw] = useState("");
  const [targetLeftRaw, setTargetLeftRaw] = useState("");
  const [targetGoalRaw, setTargetGoalRaw] = useState("");
  const [focusCourseId, setFocusCourseId] = useState<string | null>(null);
  const [focusSemesterId, setFocusSemesterId] = useState<string | null>(null);
  const firstFieldRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const semesterNameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const addSemesterRef = useRef<HTMLButtonElement | null>(null);
  const baseId = useId();

  const scale = useMemo(
    () => resolveScale(scaleId, customRows),
    [scaleId, customRows],
  );
  const letterOptions = useMemo(() => getLetterOptions(scale), [scale]);
  const showWeighted = scale.supportsWeighting;
  const showPercentConversion = scale.percentageFactor !== null;

  useEffect(() => {
    if (scale.percentageFactor !== null) {
      setPercentFactorRaw(String(scale.percentageFactor));
    }
  }, [scale.percentageFactor, scaleId]);

  useEffect(() => {
    if (!showWeighted && weighted) setWeighted(false);
  }, [showWeighted, weighted]);

  useEffect(() => {
    if (!focusCourseId) return;
    firstFieldRefs.current[focusCourseId]?.focus();
    setFocusCourseId(null);
  }, [focusCourseId, semesters]);

  useEffect(() => {
    if (!focusSemesterId) return;
    semesterNameRefs.current[focusSemesterId]?.focus();
    setFocusSemesterId(null);
  }, [focusSemesterId, semesters]);

  const result = useMemo(() => {
    return calculateGpa({
      semesters: semesters.map((sem) => ({
        id: sem.id,
        name: sem.name.trim() || "Semester",
        courses: sem.courses.map((row) => ({
          name: row.name,
          grade: row.grade,
          pointsDirect: parseGpaInput(row.pointsRaw),
          credits: parseCreditsInput(row.credits),
          weight: row.weight,
          included: row.included,
        })),
      })),
      scale,
      entryMode,
      weighted: showWeighted && weighted,
      previousGpa: includePrevious ? parseGpaInput(prevGpaRaw) : null,
      previousCredits: includePrevious
        ? parseCreditsInput(prevCreditsRaw)
        : null,
      percentageFactor: showPercentConversion
        ? parseGpaInput(percentFactorRaw)
        : null,
    });
  }, [
    semesters,
    scale,
    entryMode,
    weighted,
    showWeighted,
    includePrevious,
    prevGpaRaw,
    prevCreditsRaw,
    showPercentConversion,
    percentFactorRaw,
  ]);

  const targetResult = useMemo(() => {
    if (!targetOpen) return null;
    const current = parseGpaInput(targetCurrentRaw);
    const done = parseCreditsInput(targetDoneRaw);
    const left = parseCreditsInput(targetLeftRaw);
    const goal = parseGpaInput(targetGoalRaw);
    if (
      current === null &&
      done === null &&
      left === null &&
      goal === null
    ) {
      return {
        ok: false as const,
        error: "empty" as const,
        message:
          "Enter current CGPA, credits completed, credits still to take, and target CGPA.",
      };
    }
    return calculateTargetGpa({
      currentGpa: current ?? NaN,
      creditsCompleted: done ?? NaN,
      creditsRemaining: left ?? NaN,
      targetGpa: goal ?? NaN,
      scaleMax: scale.max,
    });
  }, [
    targetOpen,
    targetCurrentRaw,
    targetDoneRaw,
    targetLeftRaw,
    targetGoalRaw,
    scale.max,
  ]);

  function updateCourse(
    semesterId: string,
    courseId: string,
    patch: Partial<CourseRowState>,
  ) {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id !== semesterId
          ? sem
          : {
              ...sem,
              courses: sem.courses.map((row) =>
                row.id === courseId ? { ...row, ...patch } : row,
              ),
            },
      ),
    );
  }

  function updateSemesterName(semesterId: string, name: string) {
    setSemesters((prev) =>
      prev.map((sem) => (sem.id === semesterId ? { ...sem, name } : sem)),
    );
  }

  function handleAddCourse(semesterId: string) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== semesterId) return sem;
        if (sem.courses.length >= MAX_COURSE_ROWS_PER_SEMESTER) return sem;
        const row = newRow();
        setFocusCourseId(row.id);
        return { ...sem, courses: [...sem.courses, row] };
      }),
    );
  }

  function handleRemoveCourse(
    semesterId: string,
    courseId: string,
    index: number,
  ) {
    setSemesters((prev) =>
      prev.map((sem) => {
        if (sem.id !== semesterId) return sem;
        const nextCourses =
          sem.courses.length <= 1
            ? [newRow()]
            : sem.courses.filter((row) => row.id !== courseId);
        const focusIndex = Math.min(
          Math.max(0, index - 1),
          nextCourses.length - 1,
        );
        const targetId = nextCourses[focusIndex]?.id;
        queueMicrotask(() => {
          if (targetId) firstFieldRefs.current[targetId]?.focus();
        });
        return { ...sem, courses: nextCourses };
      }),
    );
  }

  function handleAddSemester() {
    if (semesters.length >= MAX_SEMESTERS) return;
    const sem = newSemester(semesters.length + 1);
    setSemesters((prev) => [...prev, sem]);
    setFocusSemesterId(sem.id);
  }

  function handleRemoveSemester(semesterId: string, index: number) {
    setSemesters((prev) => {
      if (prev.length <= 1) {
        const only = newSemester(1);
        queueMicrotask(() => {
          semesterNameRefs.current[only.id]?.focus();
        });
        return [only];
      }
      const next = prev.filter((sem) => sem.id !== semesterId);
      const focusIndex = Math.min(Math.max(0, index - 1), next.length - 1);
      const targetId = next[focusIndex]?.id;
      queueMicrotask(() => {
        if (targetId) semesterNameRefs.current[targetId]?.focus();
        else addSemesterRef.current?.focus();
      });
      return next;
    });
  }

  function handleReset() {
    setSemesters(createInitialSemesters());
    setScaleId("us-4.0");
    setCustomRows(createDefaultCustomRows());
    setEntryMode("letter");
    setWeighted(false);
    setIncludePrevious(false);
    setPrevGpaRaw("");
    setPrevCreditsRaw("");
    setPercentFactorRaw("9.5");
    setTargetOpen(false);
    setTargetCurrentRaw("");
    setTargetDoneRaw("");
    setTargetLeftRaw("");
    setTargetGoalRaw("");
  }

  function updateCustomRow(id: string, patch: Partial<CustomGradeRow>) {
    setCustomRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addCustomRow() {
    if (customRows.length >= MAX_CUSTOM_GRADE_ROWS) return;
    setCustomRows((prev) => [
      ...prev,
      {
        id: newId("grade"),
        letter: "",
        points: "0",
        excluded: false,
      },
    ]);
  }

  function removeCustomRow(id: string) {
    setCustomRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.id !== id),
    );
  }

  const scaleSelectId = `${baseId}-scale`;
  const entryModeId = `${baseId}-entry`;
  const weightedId = `${baseId}-weighted`;
  const prevToggleId = `${baseId}-prev`;
  const factorId = `${baseId}-factor`;
  const targetToggleId = `${baseId}-target`;

  const effectiveWeighted = showWeighted && weighted;

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-muted">
        Grades stay on this device — GPA and CGPA are calculated in your browser
        and never stored or sent anywhere.
      </p>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="gpa-input-heading"
          className="flex flex-col gap-4 lg:col-span-7"
        >
          {/* Settings card */}
          <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-panel p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h2
                id="gpa-input-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <GraduationCap
                  className={`size-5 ${mathTheme.text}`}
                  aria-hidden="true"
                />
                Scale &amp; entry
              </h2>
              <button
                type="button"
                onClick={handleReset}
                className="ui-label inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted transition hover:bg-background hover:text-foreground"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reset all
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={scaleSelectId}
                  className="text-[13px] font-semibold text-foreground"
                >
                  Grade scale
                </label>
                <select
                  id={scaleSelectId}
                  value={scaleId}
                  onChange={(event) =>
                    setScaleId(event.target.value as GradeScaleId)
                  }
                  className="rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                >
                  {SCALE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-relaxed text-muted">
                  {scaleId === "custom"
                    ? "Edit the table below to match your institution. Schools differ — confirm the official chart."
                    : GRADE_SCALES[scaleId].hint}
                </p>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="text-[13px] font-semibold text-foreground">
                  Grade entry
                </legend>
                <div
                  className="mt-1.5 inline-flex rounded-lg border border-border/80 bg-background p-0.5"
                  role="group"
                  aria-labelledby={entryModeId}
                >
                  <span id={entryModeId} className="sr-only">
                    Grade entry mode
                  </span>
                  {(
                    [
                      ["letter", "Letter grades"],
                      ["points", "Grade points"],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEntryMode(mode)}
                      aria-pressed={entryMode === mode}
                      className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${
                        entryMode === mode
                          ? "bg-cat-math text-white"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  Use grade points when your university publishes points per
                  course instead of letters.
                </p>
              </fieldset>

              {showWeighted && (
                <label
                  htmlFor={weightedId}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-3 sm:col-span-2"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground">
                      Weighted GPA
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Honors +0.5, AP/IB +1.0 on passing grades (F stays 0).
                      Schools vary.
                    </span>
                  </span>
                  <ThemeToggle
                    id={weightedId}
                    checked={weighted}
                    onChange={setWeighted}
                  />
                </label>
              )}
            </div>

            {scaleId === "custom" && (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[22rem] border-collapse text-left text-[13px]">
                  <caption className="border-b border-border bg-background/80 px-3 py-2 text-left text-[12px] text-muted">
                    Custom letter-to-points table (max {formatGpa(scale.max)})
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th
                        scope="col"
                        className="px-3 py-2 font-semibold text-foreground"
                      >
                        Letter
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 font-semibold text-foreground"
                      >
                        Points
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 font-semibold text-foreground"
                      >
                        Exclude
                      </th>
                      <th scope="col" className="px-3 py-2">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customRows.map((row, index) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-2 py-1.5">
                          <label className="sr-only" htmlFor={`${row.id}-letter`}>
                            Custom grade {index + 1} letter
                          </label>
                          <input
                            id={`${row.id}-letter`}
                            type="text"
                            value={row.letter}
                            onChange={(e) =>
                              updateCustomRow(row.id, {
                                letter: e.target.value,
                              })
                            }
                            className="w-full min-w-[4rem] rounded-md border border-border/80 bg-panel px-2 py-1.5 text-foreground outline-none focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <label className="sr-only" htmlFor={`${row.id}-pts`}>
                            Custom grade {index + 1} points
                          </label>
                          <input
                            id={`${row.id}-pts`}
                            type="text"
                            inputMode="decimal"
                            value={row.points}
                            disabled={row.excluded}
                            onChange={(e) =>
                              updateCustomRow(row.id, {
                                points: e.target.value,
                              })
                            }
                            className="w-full min-w-[4rem] rounded-md border border-border/80 bg-panel px-2 py-1.5 tabular-nums text-foreground outline-none focus:border-cat-math focus:ring-2 focus:ring-cat-math/20 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <label className="inline-flex items-center gap-2 text-muted">
                            <input
                              type="checkbox"
                              checked={row.excluded}
                              onChange={(e) =>
                                updateCustomRow(row.id, {
                                  excluded: e.target.checked,
                                })
                              }
                              className="size-4 rounded border-border text-cat-math focus:ring-cat-math/30"
                            />
                            <span className="text-[12px]">From GPA</span>
                          </label>
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => removeCustomRow(row.id)}
                            aria-label={`Remove custom grade ${index + 1}`}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-cat-math-soft hover:text-cat-math"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-border px-3 py-2">
                  <button
                    type="button"
                    onClick={addCustomRow}
                    disabled={customRows.length >= MAX_CUSTOM_GRADE_ROWS}
                    className="text-[13px] font-semibold text-cat-math hover:underline disabled:opacity-50"
                  >
                    Add grade row
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Semester blocks */}
          {semesters.map((semester, semIndex) => (
            <SemesterBlock
              key={semester.id}
              semester={semester}
              semIndex={semIndex}
              canRemove={semesters.length > 1}
              entryMode={entryMode}
              weighted={effectiveWeighted}
              letterOptions={letterOptions}
              nameRef={(el) => {
                semesterNameRefs.current[semester.id] = el;
              }}
              courseNameRef={(courseId, el) => {
                firstFieldRefs.current[courseId] = el;
              }}
              onRename={(name) => updateSemesterName(semester.id, name)}
              onRemoveSemester={() =>
                handleRemoveSemester(semester.id, semIndex)
              }
              onAddCourse={() => handleAddCourse(semester.id)}
              onUpdateCourse={(courseId, patch) =>
                updateCourse(semester.id, courseId, patch)
              }
              onRemoveCourse={(courseId, index) =>
                handleRemoveCourse(semester.id, courseId, index)
              }
              sgpa={
                result.ok
                  ? result.semesters.find((s) => s.id === semester.id)
                  : undefined
              }
            />
          ))}

          <button
            ref={addSemesterRef}
            type="button"
            onClick={handleAddSemester}
            disabled={semesters.length >= MAX_SEMESTERS}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-cat-math/40 bg-cat-math-soft/40 px-3.5 py-2.5 text-[13px] font-semibold text-cat-math transition hover:border-cat-math/60 hover:bg-cat-math-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add semester
            {semesters.length >= MAX_SEMESTERS
              ? ` (max ${MAX_SEMESTERS})`
              : ""}
          </button>

          <p className="text-xs text-muted">
            Uncheck Include on a course to leave out an older attempt after a
            retake — policies vary by school.
          </p>

          {/* Previous cumulative */}
          <div className="rounded-xl border border-border/80 bg-panel p-4 shadow-card sm:p-5">
            <label
              htmlFor={prevToggleId}
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  Include previous cumulative GPA / CGPA
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Combine entered semesters with credits you already completed.
                </span>
              </span>
              <ThemeToggle
                id={prevToggleId}
                checked={includePrevious}
                onChange={setIncludePrevious}
              />
            </label>

            {includePrevious && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`${baseId}-prev-gpa`}
                    className="text-[12px] font-semibold text-muted"
                  >
                    Current CGPA (0–{formatGpa(scale.max)})
                  </label>
                  <input
                    id={`${baseId}-prev-gpa`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={prevGpaRaw}
                    onChange={(event) => setPrevGpaRaw(event.target.value)}
                    className="rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] tabular-nums text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`${baseId}-prev-credits`}
                    className="text-[12px] font-semibold text-muted"
                  >
                    Credits completed
                  </label>
                  <input
                    id={`${baseId}-prev-credits`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={prevCreditsRaw}
                    onChange={(event) => setPrevCreditsRaw(event.target.value)}
                    className="rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] tabular-nums text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Target planner */}
          <div className="rounded-xl border border-border/80 bg-panel p-4 shadow-card sm:p-5">
            <button
              type="button"
              id={targetToggleId}
              aria-expanded={targetOpen}
              aria-controls={`${baseId}-target-panel`}
              onClick={() => setTargetOpen((o) => !o)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
            >
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  Target CGPA planner
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  What GPA do I need on remaining credits?
                </span>
              </span>
              <ChevronDown
                className={`size-5 shrink-0 text-muted transition-transform ${targetOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {targetOpen && (
              <div
                id={`${baseId}-target-panel`}
                className="mt-3 space-y-3 border-t border-border/70 pt-3"
              >
                <p className="text-xs leading-relaxed text-muted">
                  Needed GPA = (target × (credits done + credits left) − current
                  × credits done) ÷ credits left.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    id={`${baseId}-t-cur`}
                    label={`Current CGPA (0–${formatGpa(scale.max)})`}
                    value={targetCurrentRaw}
                    onChange={setTargetCurrentRaw}
                  />
                  <Field
                    id={`${baseId}-t-done`}
                    label="Credits completed"
                    value={targetDoneRaw}
                    onChange={setTargetDoneRaw}
                  />
                  <Field
                    id={`${baseId}-t-left`}
                    label="Credits still to take"
                    value={targetLeftRaw}
                    onChange={setTargetLeftRaw}
                  />
                  <Field
                    id={`${baseId}-t-goal`}
                    label="Target CGPA"
                    value={targetGoalRaw}
                    onChange={setTargetGoalRaw}
                  />
                </div>
                {targetResult &&
                  (targetResult.ok ? (
                    <p
                      className={`rounded-lg border px-3.5 py-2.5 text-[14px] ${mathTheme.borderSoft} ${mathTheme.soft} ${mathTheme.text}`}
                    >
                      {targetResult.alreadyMet
                        ? "You already meet or exceed that target on the credits entered — any non-negative GPA on remaining work keeps you at or above it."
                        : `You need a ${formatGpa(targetResult.neededGpa)} GPA across the remaining credits.`}
                    </p>
                  ) : (
                    <p
                      className={
                        targetResult.error === "unreachable"
                          ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900"
                          : "text-[13px] text-muted"
                      }
                    >
                      {targetResult.message}
                    </p>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section
          aria-labelledby="gpa-outcome-heading"
          className="flex min-h-72 flex-col gap-4 lg:col-span-5"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex min-h-72 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                id="gpa-outcome-heading"
                className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
              >
                Your CGPA
              </span>
              <span className="text-[12px] text-muted">
                {effectiveWeighted ? "Weighted" : "Unweighted"} · {scale.label}
              </span>
            </div>

            {result.ok ? (
              <div className="animate-fade-in flex flex-col gap-4">
                <div>
                  <p className="text-5xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-6xl">
                    {formatGpa(result.cgpa)}
                  </p>
                  <p className="mt-1 text-[15px] text-muted">
                    Overall CGPA · {result.letterBand}
                  </p>
                </div>

                <p
                  className={`rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed tabular-nums ${mathTheme.borderSoft} ${mathTheme.soft} ${mathTheme.text}`}
                >
                  <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                    Worked step
                  </span>
                  {result.working}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatQualityPoints(result.totalCredits)}
                    </span>
                    <span className="ui-label mt-0.5 text-[11px] text-muted">
                      Credits counted
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatQualityPoints(result.totalQualityPoints)}
                    </span>
                    <span className="ui-label mt-0.5 text-[11px] text-muted">
                      Quality points
                    </span>
                  </div>
                </div>

                {result.semesters.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-muted">
                      Per-semester SGPA
                    </p>
                    <ul className="flex flex-col gap-2">
                      {result.semesters.map((sem) => (
                        <li
                          key={sem.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                        >
                          <span className="min-w-0 truncate text-[13px] text-foreground">
                            {sem.name}
                          </span>
                          <span className="shrink-0 text-[14px] font-semibold tabular-nums text-foreground">
                            {formatGpa(sem.sgpa)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {showPercentConversion && (
                  <div
                    className={`rounded-xl border px-4 py-3 ${mathTheme.borderSoft} ${mathTheme.soft}`}
                  >
                    <label
                      htmlFor={factorId}
                      className={`text-[12px] font-semibold ${mathTheme.text}`}
                    >
                      Conversion factor (varies by university)
                    </label>
                    <input
                      id={factorId}
                      type="text"
                      inputMode="decimal"
                      value={percentFactorRaw}
                      onChange={(e) => setPercentFactorRaw(e.target.value)}
                      className="mt-1.5 w-full max-w-[8rem] rounded-lg border border-border/80 bg-panel px-3 py-2 text-[14px] tabular-nums text-foreground outline-none focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                    />
                    {result.estimatedPercentage !== null ? (
                      <p className="mt-2 text-[15px] text-foreground">
                        Estimated percentage:{" "}
                        <span className="font-bold tabular-nums">
                          {formatPercentage(result.estimatedPercentage)}%
                        </span>
                      </p>
                    ) : (
                      <p className="mt-2 text-[13px] text-muted">
                        Enter a valid conversion factor to estimate percentage.
                      </p>
                    )}
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      This percentage is an estimate. Your institution sets the
                      official CGPA-to-percentage formula.
                    </p>
                  </div>
                )}

                {!showPercentConversion && (
                  <p className="text-[12px] leading-relaxed text-muted">
                    No single CGPA-to-percentage formula fits this scale. See{" "}
                    <a
                      href="#cgpa-to-percentage"
                      className="font-semibold text-cat-math underline-offset-2 hover:underline"
                    >
                      How to Convert CGPA to Percentage
                    </a>{" "}
                    below.
                  </p>
                )}
              </div>
            ) : result.error === "empty" ? (
              <p className="text-[15px] text-muted">{result.message}</p>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
                {result.message}
              </p>
            )}

            <p className="text-[11px] text-muted">
              Pass/fail and withdrawn marks on US-style scales (P, NP, W) are
              excluded. On other scales, only grades you mark as excluded are
              left out.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] tabular-nums text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
      />
    </div>
  );
}

type SemesterBlockProps = {
  semester: SemesterState;
  semIndex: number;
  canRemove: boolean;
  entryMode: GradeEntryMode;
  weighted: boolean;
  letterOptions: string[];
  nameRef: (el: HTMLInputElement | null) => void;
  courseNameRef: (courseId: string, el: HTMLInputElement | null) => void;
  onRename: (name: string) => void;
  onRemoveSemester: () => void;
  onAddCourse: () => void;
  onUpdateCourse: (courseId: string, patch: Partial<CourseRowState>) => void;
  onRemoveCourse: (courseId: string, index: number) => void;
  sgpa?: { sgpa: number; working: string };
};

function SemesterBlock({
  semester,
  semIndex,
  canRemove,
  entryMode,
  weighted,
  letterOptions,
  nameRef,
  courseNameRef,
  onRename,
  onRemoveSemester,
  onAddCourse,
  onUpdateCourse,
  onRemoveCourse,
  sgpa,
}: SemesterBlockProps) {
  const semLabel = semester.name.trim() || `Semester ${semIndex + 1}`;
  const grid = weighted
    ? "md:grid-cols-[2rem_minmax(0,1.2fr)_6.5rem_5rem_7rem_2.5rem]"
    : "md:grid-cols-[2rem_minmax(0,1.4fr)_7rem_5.5rem_2.5rem]";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-panel p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
          <label
            htmlFor={`sem-${semester.id}-name`}
            className="text-[12px] font-semibold text-muted"
          >
            Semester name
          </label>
          <input
            ref={nameRef}
            id={`sem-${semester.id}-name`}
            type="text"
            value={semester.name}
            onChange={(e) => onRename(e.target.value)}
            className="rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] font-semibold text-foreground outline-none focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
          />
        </div>
        <div className="flex items-center gap-3">
          {sgpa && (
            <p className="text-[13px] text-muted">
              SGPA{" "}
              <span className="font-bold tabular-nums text-foreground">
                {formatGpa(sgpa.sgpa)}
              </span>
            </p>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={onRemoveSemester}
              aria-label={`Remove semester ${semIndex + 1}`}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-muted transition hover:bg-cat-math-soft hover:text-cat-math"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      <div
        className={`hidden gap-2 px-1 text-[11px] font-semibold text-muted md:grid ${grid}`}
      >
        <span title="Include in GPA">Inc.</span>
        <span>Course name</span>
        <span>{entryMode === "letter" ? "Grade" : "Points"}</span>
        <span>Credits</span>
        {weighted && <span>Course type</span>}
        <span className="sr-only">Remove</span>
      </div>

      <ul className="flex flex-col gap-3">
        {semester.courses.map((row, index) => (
          <CourseRow
            key={row.id}
            row={row}
            index={index}
            semesterLabel={semLabel}
            entryMode={entryMode}
            weighted={weighted}
            letterOptions={letterOptions}
            gridClass={grid}
            nameRef={(el) => courseNameRef(row.id, el)}
            onChange={(patch) => onUpdateCourse(row.id, patch)}
            onRemove={() => onRemoveCourse(row.id, index)}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={onAddCourse}
        disabled={semester.courses.length >= MAX_COURSE_ROWS_PER_SEMESTER}
        className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-border/80 bg-background px-3.5 py-2.5 text-[13px] font-semibold text-foreground transition hover:border-cat-math/45 hover:bg-cat-math-soft hover:text-cat-math disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add course
        {semester.courses.length >= MAX_COURSE_ROWS_PER_SEMESTER
          ? ` (max ${MAX_COURSE_ROWS_PER_SEMESTER})`
          : ""}
      </button>
    </div>
  );
}

type CourseRowProps = {
  row: CourseRowState;
  index: number;
  semesterLabel: string;
  entryMode: GradeEntryMode;
  weighted: boolean;
  letterOptions: string[];
  gridClass: string;
  nameRef: (el: HTMLInputElement | null) => void;
  onChange: (patch: Partial<CourseRowState>) => void;
  onRemove: () => void;
};

function CourseRow({
  row,
  index,
  semesterLabel,
  entryMode,
  weighted,
  letterOptions,
  gridClass,
  nameRef,
  onChange,
  onRemove,
}: CourseRowProps) {
  const n = index + 1;
  const prefix = `${semesterLabel}, course ${n}`;

  return (
    <li
      className={`grid grid-cols-1 gap-2 rounded-xl border border-border/70 bg-background/80 p-3 md:grid md:items-end md:gap-2 md:border-0 md:bg-transparent md:p-0 ${gridClass} ${!row.included ? "opacity-55" : ""}`}
    >
      <div className="flex items-center gap-2 md:justify-center md:pb-2">
        <input
          id={`course-${row.id}-inc`}
          type="checkbox"
          checked={row.included}
          onChange={(e) => onChange({ included: e.target.checked })}
          className="size-4 rounded border-border text-cat-math focus:ring-cat-math/30"
        />
        <label
          htmlFor={`course-${row.id}-inc`}
          className="text-[11px] font-semibold text-muted md:sr-only"
        >
          {prefix} include in GPA
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`course-${row.id}-name`}
          className="text-[11px] font-semibold text-muted md:sr-only"
        >
          {prefix} name
        </label>
        <input
          ref={nameRef}
          id={`course-${row.id}-name`}
          type="text"
          value={row.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={`Course ${n}`}
          aria-label={`${prefix} name`}
          className="w-full rounded-lg border border-border/80 bg-panel px-3 py-2 text-[14px] text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20 md:bg-background"
        />
      </div>

      {entryMode === "letter" ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`course-${row.id}-grade`}
            className="text-[11px] font-semibold text-muted md:sr-only"
          >
            {prefix} grade
          </label>
          <select
            id={`course-${row.id}-grade`}
            value={row.grade}
            onChange={(e) => onChange({ grade: e.target.value })}
            aria-label={`${prefix} grade`}
            className="w-full rounded-lg border border-border/80 bg-panel px-2 py-2 text-[14px] text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20 md:bg-background"
          >
            <option value="">Grade</option>
            {letterOptions.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`course-${row.id}-pts`}
            className="text-[11px] font-semibold text-muted md:sr-only"
          >
            {prefix} grade points
          </label>
          <input
            id={`course-${row.id}-pts`}
            type="text"
            inputMode="decimal"
            value={row.pointsRaw}
            onChange={(e) => onChange({ pointsRaw: e.target.value })}
            aria-label={`${prefix} grade points`}
            className="w-full rounded-lg border border-border/80 bg-panel px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20 md:bg-background"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`course-${row.id}-credits`}
          className="text-[11px] font-semibold text-muted md:sr-only"
        >
          {prefix} credits
        </label>
        <input
          id={`course-${row.id}-credits`}
          type="text"
          inputMode="decimal"
          value={row.credits}
          onChange={(e) => onChange({ credits: e.target.value })}
          aria-label={`${prefix} credits`}
          className="w-full rounded-lg border border-border/80 bg-panel px-3 py-2 text-[14px] tabular-nums text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20 md:bg-background"
        />
      </div>

      {weighted && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`course-${row.id}-weight`}
            className="text-[11px] font-semibold text-muted md:sr-only"
          >
            {prefix} type
          </label>
          <select
            id={`course-${row.id}-weight`}
            value={row.weight}
            onChange={(e) =>
              onChange({ weight: e.target.value as CourseWeight })
            }
            aria-label={`${prefix} type`}
            className="w-full rounded-lg border border-border/80 bg-panel px-2 py-2 text-[13px] text-foreground outline-none transition focus:border-cat-math focus:ring-2 focus:ring-cat-math/20 md:bg-background"
          >
            {WEIGHT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${prefix}`}
        className="inline-flex size-10 items-center justify-center self-end rounded-lg text-muted transition hover:bg-cat-math-soft hover:text-cat-math md:size-9 md:self-auto"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}
