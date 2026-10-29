"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChartColumn, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  HolidayOptions,
  createDefaultHolidayOptions,
  holidayTypesFromOptions,
  type HolidayOptionsValue,
} from "@/components/calculators/HolidayOptions";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { buildHolidaySet } from "@/lib/utils/business-days";
import {
  calculateAveragePerDay,
  parseAmountInput,
  parseDayCountInput,
  sanitizeUnitLabel,
  type AveragePerDayMode,
  type DurationUnit,
  type PeriodKind,
} from "@/lib/utils/average-per-day";

const mathTheme = CATEGORY_THEME[getCategoryTheme("math")];

const MODES: { id: AveragePerDayMode; label: string; shortLabel: string }[] = [
  {
    id: "daily-average",
    label: "Find the daily average",
    shortLabel: "Daily average",
  },
  {
    id: "find-total",
    label: "Find the total",
    shortLabel: "Find total",
  },
];

const DURATION_UNITS: { id: DurationUnit; label: string }[] = [
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
  { id: "years", label: "Years" },
];


function ToggleSwitch({
  id,
  checked,
  onChange,
  title,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3"
    >
      <span className="pr-2">
        <span className="block text-[13px] font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-zinc-700">{description}</span>
      </span>
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
    </label>
  );
}

/**
 * Average per day / cost per day calculator — calendar or working days.
 */
export function AveragePerDayCalculator() {
  const [mode, setMode] = useState<AveragePerDayMode>("daily-average");
  const [totalRaw, setTotalRaw] = useState("");
  const [dailyRaw, setDailyRaw] = useState("");
  const [unitRaw, setUnitRaw] = useState("");
  const [periodKind, setPeriodKind] = useState<PeriodKind>("duration");
  const [periodAmountRaw, setPeriodAmountRaw] = useState("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeEnd, setIncludeEnd] = useState(true);
  const [workingDaysOnly, setWorkingDaysOnly] = useState(false);
  const [holidayOptions, setHolidayOptions] = useState<HolidayOptionsValue>(
    createDefaultHolidayOptions,
  );
  const [clientReady, setClientReady] = useState(false);

  const tablistId = useId();
  const totalId = useId();
  const dailyId = useId();
  const unitId = useId();
  const periodAmountId = useId();
  const durationUnitId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);


  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    setStartDate((prev) => prev || today);
    setEndDate((prev) => prev || today);
    setClientReady(true);
  }, []);

  const holidaySet = useMemo(() => {
    const list =
      holidayOptions.error || holidayOptions.loading
        ? []
        : holidayOptions.holidays;
    return buildHolidaySet(list, {
      types: holidayTypesFromOptions(holidayOptions),
      customDates: holidayOptions.customDates,
    });
  }, [holidayOptions]);

  const result = useMemo(() => {
    return calculateAveragePerDay({
      mode,
      total: parseAmountInput(totalRaw),
      dailyAverage: parseAmountInput(dailyRaw),
      periodKind,
      periodAmount: parseDayCountInput(periodAmountRaw),
      durationUnit,
      startDate,
      endDate,
      includeEnd,
      workingDaysOnly: periodKind === "date-range" && workingDaysOnly,
      businessOptions: {
        nonWorkingWeekdays: holidayOptions.nonWorkingWeekdays,
        holidaySet,
      },
      unitLabel: sanitizeUnitLabel(unitRaw),
    });
  }, [
    mode,
    totalRaw,
    dailyRaw,
    periodKind,
    periodAmountRaw,
    durationUnit,
    startDate,
    endDate,
    includeEnd,
    workingDaysOnly,
    holidayOptions.nonWorkingWeekdays,
    holidaySet,
    unitRaw,
  ]);


  function selectMode(next: AveragePerDayMode) {
    setMode(next);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = MODES.length - 1;
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = last;
    } else {
      return;
    }
    selectMode(MODES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  function resetAll() {
    setTotalRaw("");
    setDailyRaw("");
    setUnitRaw("");
    setPeriodKind("duration");
    setPeriodAmountRaw("");
    setDurationUnit("days");
    setIncludeEnd(true);
    setWorkingDaysOnly(false);
    setHolidayOptions(createDefaultHolidayOptions());
    if (clientReady) {
      const today = format(new Date(), "yyyy-MM-dd");
      setStartDate(today);
      setEndDate(today);
    }
  }


  const unitShown = sanitizeUnitLabel(unitRaw);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="apd-input-heading"
          className="flex flex-col gap-4 lg:col-span-5"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="apd-input-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <ChartColumn
                  className="size-5 text-cat-math"
                  aria-hidden="true"
                />
                Inputs
              </h2>
              <button
                type="button"
                onClick={resetAll}
                className="ui-label inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            <div
              id={tablistId}
              role="tablist"
              aria-label="Average per day modes"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {MODES.map((item, index) => {
                const selected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`${tablistId}-${item.id}`}
                    aria-selected={selected}
                    aria-controls={`${tablistId}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectMode(item.id)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cat-math ${
                      selected
                        ? "border-cat-math bg-cat-math text-white shadow-sm"
                        : "border-border/80 bg-background text-foreground hover:bg-cat-math-soft"
                    }`}
                  >
                    <span className="block leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`${tablistId}-panel`}
              aria-labelledby={`${tablistId}-${mode}`}
              className="flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/70 p-4"
            >
              {mode === "daily-average" ? (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={totalId}
                    className="text-[12px] font-semibold text-zinc-700"
                  >
                    Total amount
                  </label>
                  <input
                    id={totalId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={totalRaw}
                    onChange={(e) => setTotalRaw(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={dailyId}
                    className="text-[12px] font-semibold text-zinc-700"
                  >
                    Daily average
                  </label>
                  <input
                    id={dailyId}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={dailyRaw}
                    onChange={(e) => setDailyRaw(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={unitId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Unit label (optional)
                </label>
                <input
                  id={unitId}
                  type="text"
                  autoComplete="off"
                  maxLength={12}
                  value={unitRaw}
                  onChange={(e) => setUnitRaw(sanitizeUnitLabel(e.target.value))}
                  placeholder="e.g. USD, km, pts"
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                />
                <p className="text-[12px] leading-relaxed text-zinc-700">
                  Shown as plain text next to results (max 12 characters).
                </p>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-[12px] font-semibold text-zinc-700">
                  Period
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "duration", label: "Duration" },
                      { id: "date-range", label: "Date range" },
                    ] as const
                  ).map((item) => (
                    <label
                      key={item.id}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
                        periodKind === item.id
                          ? "border-cat-math bg-cat-math-soft text-foreground"
                          : "border-border/80 bg-background text-zinc-700 hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="apd-period"
                        checked={periodKind === item.id}
                        onChange={() => {
                          setPeriodKind(item.id);
                          if (item.id !== "date-range") setWorkingDaysOnly(false);
                        }}
                        className="size-3.5 accent-[var(--cat-math)]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {periodKind === "duration" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={periodAmountId}
                      className="text-[12px] font-semibold text-zinc-700"
                    >
                      Length
                    </label>
                    <input
                      id={periodAmountId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={periodAmountRaw}
                      onChange={(e) => setPeriodAmountRaw(e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={durationUnitId}
                      className="text-[12px] font-semibold text-zinc-700"
                    >
                      Unit
                    </label>
                    <select
                      id={durationUnitId}
                      value={durationUnit}
                      onChange={(e) =>
                        setDurationUnit(e.target.value as DurationUnit)
                      }
                      className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:ring-2 focus:ring-cat-math/20"
                    >
                      {DURATION_UNITS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[12px] leading-relaxed text-zinc-700 sm:col-span-2">
                    Months use 365 ÷ 12 days and years use 365 days — the same
                    factors as the pace figures below.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <DatePickerField
                    id="apd-start"
                    label="Start date"
                    value={startDate}
                    onChange={setStartDate}
                  />
                  <DatePickerField
                    id="apd-end"
                    label="End date"
                    value={endDate}
                    onChange={setEndDate}
                  />
                  <div className="rounded-xl border border-border/60 bg-background p-3.5">
                    <ToggleSwitch
                      id="apd-include-end"
                      checked={includeEnd}
                      onChange={setIncludeEnd}
                      title="Include the end date"
                      description="Count both start and finish dates (+1 day)"
                    />
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-3.5">
                    <ToggleSwitch
                      id="apd-working-only"
                      checked={workingDaysOnly}
                      onChange={setWorkingDaysOnly}
                      title="Per working day only"
                      description="Use weekends and optional holidays from More options"
                    />
                  </div>
                  {workingDaysOnly ? (
                    <details className="rounded-lg border border-border/70 bg-background/60">
                      <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                        More options
                      </summary>
                      <div className="px-3 pb-3">
                        <HolidayOptions
                          startDate={startDate}
                          endDate={endDate}
                          value={holidayOptions}
                          onChange={setHolidayOptions}
                        />
                      </div>
                    </details>
                  ) : null}
                </div>
              )}
            </div>

            <p className="text-[12px] leading-relaxed text-zinc-700">
              Your inputs stay in your browser. They are never sent to our
              servers or stored.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="apd-outcome-heading"
          className="flex min-h-88 flex-col gap-4 lg:col-span-7"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h2
                id="apd-outcome-heading"
                className="text-[15px] font-semibold text-foreground"
              >
                Result
              </h2>
              <span className="ui-label rounded-md bg-cat-math px-2.5 py-1 text-[11px] text-white">
                {MODES.find((item) => item.id === mode)?.shortLabel}
              </span>
            </div>

            {!result.ok ? (
              <p className="text-[15px] leading-relaxed text-zinc-700">
                {result.message}
              </p>
            ) : (
              <>
                <div>
                  <p className="text-[12px] font-semibold text-zinc-700">
                    {mode === "find-total" ? "Total" : "Average per day"}
                  </p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-5xl">
                    {mode === "find-total"
                      ? result.displayTotal
                      : result.displayPerDay}
                    {unitShown ? (
                      <span className="ml-2 text-xl font-semibold text-zinc-700 sm:text-2xl">
                        {unitShown}
                      </span>
                    ) : null}
                  </p>
                  {mode === "find-total" ? (
                    <p className="mt-2 text-[15px] text-zinc-700">
                      From{" "}
                      <strong className="font-semibold tabular-nums text-foreground">
                        {result.displayPerDay}
                        {unitShown ? ` ${unitShown}` : ""}
                      </strong>{" "}
                      per day over{" "}
                      <strong className="font-semibold tabular-nums text-foreground">
                        {result.dayCount}
                      </strong>{" "}
                      {result.usedWorkingDays ? "working days" : "days"}.
                    </p>
                  ) : (
                    <p className="mt-2 text-[15px] text-zinc-700">
                      Across{" "}
                      <strong className="font-semibold tabular-nums text-foreground">
                        {result.dayCount}
                      </strong>{" "}
                      {result.usedWorkingDays ? "working days" : "days"}.
                    </p>
                  )}
                </div>

                <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                  {result.working}
                </p>

                <div>
                  <p className="mb-2 text-[12px] font-semibold text-zinc-700">
                    At the same pace
                  </p>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold text-zinc-700">
                        Per week (× 7)
                      </dt>
                      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
                        {result.displayPerWeek}
                        {unitShown ? ` ${unitShown}` : ""}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold text-zinc-700">
                        Per month (× 365 ÷ 12)
                      </dt>
                      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
                        {result.displayPerMonth}
                        {unitShown ? ` ${unitShown}` : ""}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold text-zinc-700">
                        Per year (× 365)
                      </dt>
                      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">
                        {result.displayPerYear}
                        {unitShown ? ` ${unitShown}` : ""}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-[12px] leading-relaxed text-zinc-700">
                    Week, month, and year figures assume a steady pace — they
                    scale the daily average, they are not calendar forecasts.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
