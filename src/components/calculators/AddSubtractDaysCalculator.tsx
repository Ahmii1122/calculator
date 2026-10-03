"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, RefreshCw } from "lucide-react";
import {
  MAX_SHIFT_AMOUNT,
  parseAmountInput,
  shiftDate,
  toDateInputValue,
  type ShiftOperation,
  type ShiftUnit,
} from "@/lib/date-shift";
import { dayOfWeekLabel } from "@/lib/date-span";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { DatePickerField } from "@/components/ui/DatePickerField";

const dateTheme = CATEGORY_THEME[getCategoryTheme("date-time")];

const UNITS: { id: ShiftUnit; label: string }[] = [
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
  { id: "years", label: "Years" },
];

const PRESETS: { label: string; days: number }[] = [
  { label: "+30 days", days: 30 },
  { label: "+60 days", days: 60 },
  { label: "+90 days", days: 90 },
  { label: "+180 days", days: 180 },
  { label: "−30 days", days: -30 },
];

/**
 * Add or subtract days, weeks, months, or years from a start date.
 * "Today" is set after mount to avoid stale SSR dates / hydration mismatches.
 */
export function AddSubtractDaysCalculator() {
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState("");
  const [amountRaw, setAmountRaw] = useState("30");
  const [unit, setUnit] = useState<ShiftUnit>("days");
  const [operation, setOperation] = useState<ShiftOperation>("add");
  const [businessDaysOnly, setBusinessDaysOnly] = useState(false);
  const opGroupId = useId();
  const unitId = useId();
  const amountId = useId();
  const businessId = useId();

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setStartDate(toDateInputValue(now));
    setReady(true);
  }, []);

  const amount = parseAmountInput(amountRaw);
  const calculation = useMemo(() => {
    if (!ready || !startDate) return null;
    return shiftDate({
      startValue: startDate,
      amountRaw: amount,
      unit,
      operation,
      businessDaysOnly: unit === "days" ? businessDaysOnly : false,
    });
  }, [ready, startDate, amount, unit, operation, businessDaysOnly]);

  const startBadge = startDate ? dayOfWeekLabel(startDate) : null;

  function handleReset() {
    const now = new Date();
    setToday(now);
    setStartDate(toDateInputValue(now));
    setAmountRaw("30");
    setUnit("days");
    setOperation("add");
    setBusinessDaysOnly(false);
  }

  function applyPreset(days: number) {
    const base = today ?? new Date();
    setStartDate(toDateInputValue(base));
    setUnit("days");
    setBusinessDaysOnly(false);
    if (days < 0) {
      setOperation("subtract");
      setAmountRaw(String(Math.abs(days)));
    } else {
      setOperation("add");
      setAmountRaw(String(days));
    }
  }

  const result = calculation?.ok ? calculation : null;
  const error =
    calculation && !calculation.ok && calculation.error !== "empty"
      ? calculation
      : null;
  const waiting =
    !ready ||
    (calculation && !calculation.ok && calculation.error === "empty");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" aria-label="Days from today presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={!ready}
            onClick={() => applyPreset(preset.days)}
            className="cursor-pointer rounded-full border border-border/80 bg-panel px-3.5 py-1.5 text-[12px] font-semibold text-foreground shadow-card transition hover:border-cat-date/45 hover:bg-cat-date-soft hover:text-cat-date disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="shift-input-heading"
          className="flex flex-col gap-4 lg:col-span-5"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="shift-input-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <CalendarPlus
                  className={`size-5 ${dateTheme.text}`}
                  aria-hidden="true"
                />
                Shift a date
              </h2>
              <button
                type="button"
                onClick={handleReset}
                className="ui-label inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] text-muted transition hover:bg-background hover:text-foreground"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            <DatePickerField
              id="shift-start-date"
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              required
              labelAccessory={
                <div className="flex items-center gap-2">
                  {startBadge && (
                    <span className="rounded bg-background px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted">
                      {startBadge}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() =>
                      setStartDate(toDateInputValue(new Date()))
                    }
                    className={`cursor-pointer text-[12px] font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${dateTheme.text}`}
                  >
                    Today
                  </button>
                </div>
              }
            />

            <div
              role="radiogroup"
              aria-labelledby={`${opGroupId}-label`}
              className="flex flex-col gap-1.5"
            >
              <span
                id={`${opGroupId}-label`}
                className="text-[13px] font-semibold text-foreground"
              >
                Operation
              </span>
              <div className="flex gap-1.5">
                {(["add", "subtract"] as const).map((op) => {
                  const selected = operation === op;
                  return (
                    <label
                      key={op}
                      className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-[13px] font-semibold capitalize transition ${
                        selected
                          ? `${dateTheme.solid} text-white`
                          : "bg-background text-foreground hover:bg-cat-date-soft"
                      }`}
                    >
                      <input
                        type="radio"
                        name={opGroupId}
                        value={op}
                        checked={selected}
                        onChange={() => setOperation(op)}
                        className="sr-only"
                      />
                      {op}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={amountId}
                  className="text-[13px] font-semibold text-foreground"
                >
                  Amount
                </label>
                <input
                  id={amountId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amountRaw}
                  onChange={(event) => setAmountRaw(event.target.value)}
                  className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:bg-panel focus:ring-2 focus:ring-cat-date/20`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={unitId}
                  className="text-[13px] font-semibold text-foreground"
                >
                  Unit
                </label>
                <select
                  id={unitId}
                  value={unit}
                  onChange={(event) => {
                    const next = event.target.value as ShiftUnit;
                    setUnit(next);
                    if (next !== "days") setBusinessDaysOnly(false);
                  }}
                  className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-date/40 focus:border-cat-date focus:bg-panel focus:ring-2 focus:ring-cat-date/20"
                >
                  {UNITS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {unit === "days" && (
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <label
                  htmlFor={businessId}
                  className="flex cursor-pointer items-start justify-between gap-3"
                >
                  <span>
                    <span className="block text-[13px] font-semibold text-foreground">
                      Business days only
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Skip Saturdays and Sundays. Public holidays are not
                      excluded.
                    </span>
                  </span>
                  <span className="relative inline-block h-6 w-11 shrink-0">
                    <input
                      id={businessId}
                      type="checkbox"
                      checked={businessDaysOnly}
                      onChange={(event) =>
                        setBusinessDaysOnly(event.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-full bg-border transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${dateTheme.toggle}`}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out peer-checked:translate-x-5"
                    />
                  </span>
                </label>
              </div>
            )}

            <p className="text-[12px] text-muted">
              Amounts up to {MAX_SHIFT_AMOUNT.toLocaleString()}. A negative
              amount flips Add and Subtract; the count is always the absolute
              value.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="shift-outcome-heading"
          className="flex min-h-88 flex-col gap-4 lg:col-span-7"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                id="shift-outcome-heading"
                className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
              >
                Resulting date
              </span>
              <span className="text-[12px] text-muted">
                {ready && today
                  ? `Today is ${format(today, "MMM d, yyyy")}`
                  : "Loading today’s date…"}
              </span>
            </div>

            {!ready && (
              <div className="space-y-3" aria-hidden="true">
                <div className="h-12 w-3/4 max-w-sm rounded-lg bg-border/40" />
                <div className="h-5 w-1/2 rounded bg-border/30" />
                <div className="h-5 w-2/3 rounded bg-border/30" />
              </div>
            )}

            {ready && waiting && !error && (
              <p className="text-[15px] text-muted">
                Enter a start date and amount to see the date after adding or
                subtracting.
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
                {error.message}
              </p>
            )}

            {result && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
                    {result.displayLong}
                  </p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${dateTheme.text}`}>
                    {result.displayYear}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div
                    className={`flex w-full flex-col items-center justify-center rounded-full border px-4 py-2.5 text-center ${dateTheme.borderSoft} ${dateTheme.soft}`}
                  >
                    <span
                      className={`text-sm font-semibold ${dateTheme.text}`}
                    >
                      {result.weekday}
                    </span>
                    <span className={`ui-label mt-0.5 text-[11px] ${dateTheme.text}`}>
                      Day of week
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2.5 text-center">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatDeltaLabel(result.calendarDaysDelta)}
                    </span>
                    <span className="ui-label mt-0.5 text-[11px] text-muted">
                      From start date
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-muted">
                  {result.operation === "add" ? "Added" : "Subtracted"}{" "}
                  <span className="font-semibold text-foreground">
                    {result.amount.toLocaleString()}{" "}
                    {unitLabel(result.unit, result.amount)}
                  </span>
                  {result.businessDaysOnly ? " (business days)" : ""} from{" "}
                  {format(result.start, "MMM d, yyyy")}.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function unitLabel(unit: ShiftUnit, amount: number): string {
  const singular =
    unit === "days"
      ? "day"
      : unit === "weeks"
        ? "week"
        : unit === "months"
          ? "month"
          : "year";
  return amount === 1 ? singular : `${singular}s`;
}

function formatDeltaLabel(delta: number): string {
  if (delta === 0) return "Same calendar day";
  const abs = Math.abs(delta).toLocaleString();
  const unit = Math.abs(delta) === 1 ? "day" : "days";
  return delta > 0 ? `${abs} ${unit} later` : `${abs} ${unit} earlier`;
}
