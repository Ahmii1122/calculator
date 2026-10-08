"use client";

import { useId, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import {
  calculateBmi,
  cmToFeetInches,
  feetInchesToCm,
  formatWeight,
  getScaleSegments,
  kgToLb,
  lbToKg,
  parseDecimal,
  type PopulationGuideline,
  type UnitSystem,
} from "@/lib/utils/bmi";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";

const healthTheme = CATEGORY_THEME[getCategoryTheme("health")];

/**
 * Interactive BMI calculator — metric/imperial, WHO or Asian cut-offs,
 * live result with a labeled scale (not color-only).
 */
export function BmiCalculator() {
  const [system, setSystem] = useState<UnitSystem>("metric");
  const [guideline, setGuideline] = useState<PopulationGuideline>("who");

  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("70");
  const [heightFeet, setHeightFeet] = useState("5");
  const [heightInches, setHeightInches] = useState("7");
  const [weightLb, setWeightLb] = useState("154");

  const unitGroupId = useId();
  const popGroupId = useId();
  const heightCmId = useId();
  const weightKgId = useId();
  const feetId = useId();
  const inchesId = useId();
  const weightLbId = useId();

  const result =
    system === "metric"
      ? calculateBmi(
          {
            system: "metric",
            heightCm: parseDecimal(heightCm),
            weightKg: parseDecimal(weightKg),
          },
          guideline,
        )
      : calculateBmi(
          {
            system: "imperial",
            heightFeet: parseDecimal(heightFeet),
            heightInches: parseDecimal(heightInches),
            weightLb: parseDecimal(weightLb),
          },
          guideline,
        );

  const segments = getScaleSegments(guideline);

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
      if (parseDecimal(heightFeet) !== null || parseDecimal(heightInches) !== null) {
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
    setGuideline("who");
    setHeightCm("170");
    setWeightKg("70");
    setHeightFeet("5");
    setHeightInches("7");
    setWeightLb("154");
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="bmi-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="bmi-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Activity
                className={`size-5 ${healthTheme.text}`}
                aria-hidden="true"
              />
              Your measurements
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
                  { id: "metric", label: "Metric (cm, kg)" },
                  { id: "imperial", label: "Imperial (ft, lb)" },
                ] as const
              ).map((option) => {
                const selected = system === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-[12px] font-semibold transition sm:text-[13px] ${
                      selected
                        ? "bg-zinc-900 text-white shadow-sm"
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
              Population cut-offs
            </legend>
            <div
              role="radiogroup"
              aria-label="BMI population guideline"
              className="grid grid-cols-2 gap-1.5"
            >
              {(
                [
                  { id: "who", label: "Standard (WHO)" },
                  { id: "asian", label: "Asian cut-offs" },
                ] as const
              ).map((option) => {
                const selected = guideline === option.id;
                return (
                  <label
                    key={option.id}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-[12px] font-semibold transition sm:text-[13px] ${
                      selected
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-background text-foreground hover:bg-stone-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={popGroupId}
                      value={option.id}
                      checked={selected}
                      onChange={() => setGuideline(option.id)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
              Asian cut-offs are an alternative guideline (overweight from 23.0,
              obesity from 27.5). Countries and health bodies may use slightly
              different thresholds.
            </p>
          </fieldset>

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

          <p className="text-[12px] leading-relaxed text-zinc-600">
            BMI uses the same formula for men and women — age and sex are not
            required for this calculation.
          </p>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Calculations run in your browser — nothing is stored or sent to a
            server.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="bmi-outcome-heading"
        className="flex min-h-96 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-96 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="bmi-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Your BMI
            </span>
            <span className="text-[12px] text-zinc-600">
              {guideline === "who" ? "Standard (WHO)" : "Asian cut-offs"}
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-4xl font-extrabold tracking-tight text-zinc-950 tabular-nums sm:text-5xl">
                  {result.display}{" "}
                  <span className="text-xl font-semibold text-zinc-700 sm:text-2xl">
                    {result.category.label}
                  </span>
                </p>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold text-zinc-600">
                  Adult BMI scale
                </p>
                <div
                  className="relative pt-1 pb-8"
                  role="img"
                  aria-label={result.scaleDescription}
                >
                  <div className="flex h-3 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                    {segments.map((segment, index) => (
                      <div
                        key={segment.id}
                        style={{ width: `${segment.widthPercent}%` }}
                        className={`h-full border-r border-white/80 last:border-0 ${
                          index % 2 === 0 ? "bg-stone-300" : "bg-stone-400"
                        }`}
                        title={segment.label}
                      />
                    ))}
                  </div>
                  <div
                    className="absolute top-0 z-10 -translate-x-1/2"
                    style={{ left: `${result.scalePercent}%` }}
                  >
                    <div className="mx-auto size-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-zinc-900" />
                    <span className="mt-1 block whitespace-nowrap text-center text-[11px] font-semibold text-zinc-900 tabular-nums">
                      {result.display}
                    </span>
                  </div>
                  <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-600">
                    {segments.map((segment) => (
                      <li key={segment.id}>{segment.label}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border/70 bg-background/80 px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                <p>
                  <span className="font-semibold text-foreground">
                    Weight range for a BMI of 18.5 to 24.9:{" "}
                  </span>
                  {formatWeight(result.healthyWeightMinKg, system)} –{" "}
                  {formatWeight(result.healthyWeightMaxKg, system)}
                </p>
                {result.deltaVsHealthyKg !== null && result.deltaDirection ? (
                  <p>
                    {formatWeight(result.deltaVsHealthyKg, system)}{" "}
                    {result.deltaDirection === "above"
                      ? "above the upper end of this range"
                      : "below the lower end of this range"}
                    .
                  </p>
                ) : null}
                <p className="tabular-nums text-zinc-600">{result.working}</p>
              </div>

              <p className="text-[12px] leading-relaxed text-zinc-600">
                For children and teens under 20, BMI is interpreted using age and
                sex percentiles, which this calculator does not provide. Please
                ask a healthcare professional.
              </p>

              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and is not medical
                advice or a diagnosis. Talk to a qualified healthcare
                professional about your health.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <p className="text-[15px] leading-relaxed text-zinc-600">
                {result.error === "empty"
                  ? "Enter height and weight to see your body mass index, category, and the weight range for a BMI of 18.5 to 24.9."
                  : result.message}
              </p>
              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and is not medical
                advice or a diagnosis.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
