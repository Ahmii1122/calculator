"use client";

import { useId, useState } from "react";
import { ChevronDown, Flame, RefreshCw } from "lucide-react";
import {
  ACTIVITY_LEVELS,
  SAFETY_FLOORS,
  calculateCalories,
  cmToFeetInches,
  estimateGoalCalories,
  feetInchesToCm,
  formatCalories,
  kgToLb,
  lbToKg,
  parseDecimal,
  type GoalMode,
  type SexForFormula,
  type UnitSystem,
} from "@/lib/utils/calories";
/** Site amber accent for selected toggles and the primary maintenance figure. */
const ACCENT = "#B45309";

/**
 * Interactive calorie calculator — Mifflin–St Jeor BMR and TDEE,
 * activity comparison, optional gradual goal ranges with safety floors.
 */
export function CalorieCalculator() {
  const [system, setSystem] = useState<UnitSystem>("metric");
  const [sex, setSex] = useState<SexForFormula>("male");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("70");
  const [heightFeet, setHeightFeet] = useState("5");
  const [heightInches, setHeightInches] = useState("9");
  const [weightLb, setWeightLb] = useState("154");
  const [activityId, setActivityId] = useState("moderate");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalMode, setGoalMode] = useState<GoalMode>("maintain");

  const unitGroupId = useId();
  const sexGroupId = useId();
  const goalGroupId = useId();
  const ageId = useId();
  const heightCmId = useId();
  const weightKgId = useId();
  const feetId = useId();
  const inchesId = useId();
  const weightLbId = useId();
  const activitySelectId = useId();
  const goalPanelId = useId();

  const resolvedHeightCm =
    system === "metric"
      ? parseDecimal(heightCm)
      : (() => {
          const feet = parseDecimal(heightFeet);
          const inches = parseDecimal(heightInches);
          if (feet === null && inches === null) return null;
          return feetInchesToCm(feet ?? 0, inches ?? 0);
        })();

  const resolvedWeightKg =
    system === "metric"
      ? parseDecimal(weightKg)
      : (() => {
          const lb = parseDecimal(weightLb);
          return lb === null ? null : lbToKg(lb);
        })();

  const result = calculateCalories({
    age: parseDecimal(age),
    sex,
    heightCm: resolvedHeightCm,
    weightKg: resolvedWeightKg,
    activityId,
  });

  const goalEstimate =
    result.ok
      ? estimateGoalCalories(result.tdee, sex, goalMode)
      : null;

  function switchSystem(next: UnitSystem) {
    if (next === system) return;
    if (next === "imperial") {
      const cm = parseDecimal(heightCm);
      const kg = parseDecimal(weightKg);
      if (cm !== null) {
        const { feet, inches } = cmToFeetInches(cm);
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
      }
      if (kg !== null) setWeightLb(String(kgToLb(kg)));
    } else {
      const feet = parseDecimal(heightFeet) ?? 0;
      const inches = parseDecimal(heightInches) ?? 0;
      const lb = parseDecimal(weightLb);
      if (
        parseDecimal(heightFeet) !== null ||
        parseDecimal(heightInches) !== null
      ) {
        const cm = Math.round(feetInchesToCm(feet, inches) * 10) / 10;
        setHeightCm(String(cm));
      }
      if (lb !== null) {
        setWeightKg(String(Math.round(lbToKg(lb) * 10) / 10));
      }
    }
    setSystem(next);
  }

  function handleReset() {
    setSystem("metric");
    setSex("male");
    setAge("30");
    setHeightCm("175");
    setWeightKg("70");
    setHeightFeet("5");
    setHeightInches("9");
    setWeightLb("154");
    setActivityId("moderate");
    setGoalOpen(false);
    setGoalMode("maintain");
  }

  const selectedActivity = ACTIVITY_LEVELS.find((a) => a.id === activityId);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="calorie-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="calorie-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Flame
                className="size-5 text-[#B45309]"
                aria-hidden="true"
              />
              Your details
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="ui-label inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-2 text-[12px] font-semibold text-zinc-600">
              Units
            </legend>
            <div
              role="radiogroup"
              aria-label="Unit system"
              className="grid grid-cols-2 gap-1.5"
            >
              {(
                [
                  { id: "metric" as const, label: "Metric (cm, kg)" },
                  { id: "imperial" as const, label: "Imperial (ft, lb)" },
                ]
              ).map((option) => {
                const selected = system === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-[12px] font-semibold transition sm:text-[13px] ${
                      selected
                        ? "bg-[#B45309] text-white shadow-sm"
                        : "bg-background text-foreground hover:bg-stone-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={unitGroupId}
                      value={option.id}
                      checked={selected}
                      onChange={() => switchSystem(option.id)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-2 text-[12px] font-semibold text-zinc-600">
              Sex used in the formula
            </legend>
            <div
              role="radiogroup"
              aria-label="Sex used in the Mifflin-St Jeor formula"
              className="grid grid-cols-2 gap-1.5"
            >
              {(
                [
                  { id: "male" as const, label: "Male" },
                  { id: "female" as const, label: "Female" },
                ]
              ).map((option) => {
                const selected = sex === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-[12px] font-semibold transition sm:text-[13px] ${
                      selected
                        ? "bg-[#B45309] text-white shadow-sm"
                        : "bg-background text-foreground hover:bg-stone-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={sexGroupId}
                      value={option.id}
                      checked={selected}
                      onChange={() => setSex(option.id)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
              The Mifflin–St Jeor equation uses different constants for each
              option, so this field changes the estimate.
            </p>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={ageId}
              className="text-[12px] font-semibold text-zinc-600"
            >
              Age (years)
            </label>
            <input
              id={ageId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>

          {system === "metric" ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={heightCmId}
                  className="text-[12px] font-semibold text-zinc-600"
                >
                  Height (cm)
                </label>
                <input
                  id={heightCmId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={weightKgId}
                  className="text-[12px] font-semibold text-zinc-600"
                >
                  Weight (kg)
                </label>
                <input
                  id={weightKgId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={feetId}
                    className="text-[12px] font-semibold text-zinc-600"
                  >
                    Height (ft)
                  </label>
                  <input
                    id={feetId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={inchesId}
                    className="text-[12px] font-semibold text-zinc-600"
                  >
                    Height (in)
                  </label>
                  <input
                    id={inchesId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={weightLbId}
                  className="text-[12px] font-semibold text-zinc-600"
                >
                  Weight (lb)
                </label>
                <input
                  id={weightLbId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={activitySelectId}
              className="text-[12px] font-semibold text-zinc-600"
            >
              Activity level
            </label>
            <select
              id={activitySelectId}
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label} — {level.description}
                </option>
              ))}
            </select>
            {selectedActivity ? (
              <p className="text-[12px] leading-relaxed text-zinc-600">
                Multiplier ×{selectedActivity.multiplier}. If you are unsure,
                choose the lower option — people often overestimate activity.
              </p>
            ) : null}
          </div>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Calculations run in your browser — nothing is stored or sent to a
            server.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="calorie-outcome-heading"
        className="flex min-h-96 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-96 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="calorie-outcome-heading"
              className="ui-label rounded-md bg-[#B45309] px-2.5 py-1 text-[11px] text-white"
            >
              Daily energy estimate
            </span>
            {result.ok ? (
              <span className="text-[12px] text-zinc-600">
                {result.activity.label}
              </span>
            ) : null}
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold text-zinc-600">
                  Estimated maintenance calories
                </p>
                <p
                  className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl"
                  style={{ color: ACCENT }}
                >
                  {result.tdeeDisplay}{" "}
                  <span className="text-xl font-semibold text-zinc-700 sm:text-2xl">
                    kcal/day
                  </span>
                </p>
                <p className="mt-2 text-[14px] text-zinc-700">
                  Calories your body uses at rest (BMR):{" "}
                  <strong className="font-semibold tabular-nums text-foreground">
                    {result.bmrDisplay} kcal/day
                  </strong>
                </p>
              </div>

              <p className="text-[13px] leading-relaxed text-zinc-600">
                Most people&apos;s real needs fall within about 10% of this
                estimate, and it can vary day to day.
              </p>

              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                <span className="ui-label mb-0.5 block text-[11px] text-zinc-600">
                  Worked step
                </span>
                {result.working}
              </p>

              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-foreground">
                  Maintenance calories by activity level
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border/70">
                  <table className="min-w-[20rem] w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
                        <th scope="col" className="px-3 py-2">
                          Activity
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Est. kcal/day
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.byActivity.map((row) => (
                        <tr
                          key={row.activity.id}
                          className={`border-b border-border/60 last:border-0 ${
                            row.selected ? "bg-stone-100" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-zinc-800">
                            {row.activity.label}
                            {row.selected ? (
                              <span className="ml-1.5 text-[11px] font-semibold text-zinc-600">
                                (selected)
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 font-semibold tabular-nums text-foreground">
                            {formatCalories(row.tdee)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-stone-50/80">
                <button
                  type="button"
                  aria-expanded={goalOpen}
                  aria-controls={goalPanelId}
                  onClick={() => setGoalOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-[13px] font-semibold text-zinc-800"
                >
                  Adjusting for a goal
                  <ChevronDown
                    className={`size-4 shrink-0 text-zinc-500 transition-transform ${
                      goalOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {goalOpen && goalEstimate ? (
                  <div
                    id={goalPanelId}
                    className="space-y-3 border-t border-border/60 px-3.5 py-3"
                  >
                    <div
                      role="radiogroup"
                      aria-label="Goal adjustment"
                      className="grid grid-cols-1 gap-1.5 sm:grid-cols-3"
                    >
                      {(
                        [
                          { id: "maintain" as const, label: "Maintain" },
                          { id: "loss" as const, label: "Gradual loss" },
                          { id: "gain" as const, label: "Gradual gain" },
                        ]
                      ).map((option) => {
                        const selected = goalMode === option.id;
                        return (
                          <label
                            key={option.id}
                            className={`cursor-pointer rounded-lg px-3 py-2 text-center text-[12px] font-semibold transition ${
                              selected
                                ? "bg-[#B45309] text-white"
                                : "bg-white text-zinc-800 hover:bg-stone-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name={goalGroupId}
                              value={option.id}
                              checked={selected}
                              onChange={() => setGoalMode(option.id)}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>

                    <p className="text-[13px] leading-relaxed text-zinc-700">
                      {goalMode === "maintain" ? (
                        <>
                          Estimated range for maintaining weight:{" "}
                          <strong className="font-semibold tabular-nums">
                            {formatCalories(goalEstimate.low)} kcal/day
                          </strong>
                          .
                        </>
                      ) : goalMode === "loss" ? (
                        <>
                          Estimated range for gradual loss (about 250–500 kcal
                          below maintenance):{" "}
                          <strong className="font-semibold tabular-nums">
                            {formatCalories(goalEstimate.low)}–
                            {formatCalories(goalEstimate.high)} kcal/day
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          Estimated range for gradual gain (about 250–500 kcal
                          above maintenance):{" "}
                          <strong className="font-semibold tabular-nums">
                            {formatCalories(goalEstimate.low)}–
                            {formatCalories(goalEstimate.high)} kcal/day
                          </strong>
                          .
                        </>
                      )}
                    </p>

                    {goalEstimate.floored ? (
                      <p className="text-[13px] leading-relaxed text-zinc-700">
                        This estimate is already low. Eating much less than this
                        is generally not recommended without medical
                        supervision. Please talk to a doctor or registered
                        dietitian. (Floor used:{" "}
                        {SAFETY_FLOORS[sex].toLocaleString("en-US")} kcal/day for
                        the {sex} formula setting.)
                      </p>
                    ) : null}

                    <p className="text-[12px] leading-relaxed text-zinc-600">
                      Rate of change depends on many factors. Large, fast
                      changes are not recommended for most people.
                    </p>
                  </div>
                ) : null}
              </div>

              <p className="text-[12px] leading-relaxed text-zinc-600">
                Not intended for pregnancy, breastfeeding, or people with a
                medical condition affecting metabolism. Ask a healthcare
                professional for personal guidance.
              </p>

              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and is not medical
                or nutritional advice. Talk to a qualified healthcare
                professional or registered dietitian about your diet.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <p className="text-[15px] leading-relaxed text-zinc-600">
                {result.message}
              </p>
              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and is not medical
                or nutritional advice.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
