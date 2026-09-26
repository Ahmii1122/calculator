"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  addDays,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  Copy,
  Link2,
  RefreshCw,
  Share2,
  Zap,
} from "lucide-react";
import {
  calculateDateSpan,
  dayOfWeekLabel,
  formatNaturalBreakdown,
  formatRangeLabel,
  toDateInputValue,
} from "@/lib/date-span";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { SITE_NAME } from "@/lib/site";
import { DatePickerField } from "@/components/ui/DatePickerField";

const dateTheme = CATEGORY_THEME[getCategoryTheme("date-time")];

/** Stable client "now" for defaults/presets without hydration mismatch. */
let cachedClientNow: Date | null = null;

function getClientNow(): Date {
  if (!cachedClientNow) cachedClientNow = new Date();
  return cachedClientNow;
}

function useClientNow(): Date | null {
  return useSyncExternalStore(
    () => () => {},
    () => getClientNow(),
    () => null,
  );
}

type Preset = {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  daysLabel: string;
};

function buildPresets(now: Date): Preset[] {
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const qStart = startOfQuarter(now);
  const qEnd = endOfQuarter(now);
  const nextNewYear = startOfYear(addDays(endOfYear(now), 1));
  const ninetyEnd = addDays(now, 90);

  const inclusiveDays = (start: Date, end: Date) =>
    calculateDateSpan(
      toDateInputValue(start),
      toDateInputValue(end),
      true,
    )?.totalDays ?? 0;

  return [
    {
      id: "full-year",
      title: `Full Calendar Year ${format(now, "yyyy")}`,
      description: `${format(yearStart, "MMM d, yyyy")} → ${format(yearEnd, "MMM d, yyyy")}`,
      start: toDateInputValue(yearStart),
      end: toDateInputValue(yearEnd),
      daysLabel: `${inclusiveDays(yearStart, yearEnd).toLocaleString()} Days`,
    },
    {
      id: "quarter",
      title: `Current Quarter (${format(qStart, "QQQ yyyy")})`,
      description: `${format(qStart, "MMM d")} → ${format(qEnd, "MMM d, yyyy")}`,
      start: toDateInputValue(qStart),
      end: toDateInputValue(qEnd),
      daysLabel: `${inclusiveDays(qStart, qEnd).toLocaleString()} Days`,
    },
    {
      id: "new-year",
      title: "Countdown to New Year",
      description: `${format(now, "MMM d, yyyy")} → ${format(nextNewYear, "MMM d, yyyy")}`,
      start: toDateInputValue(now),
      end: toDateInputValue(nextNewYear),
      daysLabel: `${inclusiveDays(now, nextNewYear).toLocaleString()} Days`,
    },
    {
      id: "ninety",
      title: "90-Day Window",
      description: "HR probation, warranty, and trial periods",
      start: toDateInputValue(now),
      end: toDateInputValue(ninetyEnd),
      daysLabel: `${inclusiveDays(now, ninetyEnd).toLocaleString()} Days`,
    },
  ];
}

function defaultStart(now: Date) {
  return toDateInputValue(now);
}

function defaultEnd(now: Date) {
  return toDateInputValue(addDays(now, 30));
}

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
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3">
      <span className="pr-2">
        <span className="block text-[13px] font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`h-6 w-11 rounded-full bg-border transition peer-focus-visible:ring-2 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 ${dateTheme.toggle}`}
        />
      </span>
    </label>
  );
}

/**
 * Feature-rich days-between-dates tool.
 * Live-recalculates on input and option changes.
 */
export function DaysBetweenDatesCalculator() {
  const clientNow = useClientNow();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [includeEndDate, setIncludeEndDate] = useState(true);
  const [businessDaysOnly, setBusinessDaysOnly] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [showAltUnits, setShowAltUnits] = useState(false);

  const effectiveStart =
    startDate ?? (clientNow ? defaultStart(clientNow) : "");
  const effectiveEnd = endDate ?? (clientNow ? defaultEnd(clientNow) : "");

  const presets = useMemo(
    () => (clientNow ? buildPresets(clientNow) : []),
    [clientNow],
  );

  const result = useMemo(
    () => calculateDateSpan(effectiveStart, effectiveEnd, includeEndDate),
    [effectiveStart, effectiveEnd, includeEndDate],
  );

  const startBadge = dayOfWeekLabel(effectiveStart);
  const endBadge = dayOfWeekLabel(effectiveEnd);

  const primaryCount = result
    ? businessDaysOnly
      ? result.businessDays
      : result.totalDays
    : null;

  const primaryLabel = businessDaysOnly ? "business workdays" : "total elapsed";

  function ensureStartDate(): string {
    if (effectiveStart) return effectiveStart;
    const today = defaultStart(new Date());
    setStartDate(today);
    return today;
  }

  function applyEndFromStart(getEnd: (start: Date) => Date) {
    const startValue = ensureStartDate();
    const start = new Date(`${startValue}T00:00:00`);
    setEndDate(toDateInputValue(getEnd(start)));
  }

  function handleSwap() {
    setStartDate(effectiveEnd);
    setEndDate(effectiveStart);
  }

  function handleReset() {
    const fresh = new Date();
    cachedClientNow = fresh;
    setStartDate(defaultStart(fresh));
    setEndDate(defaultEnd(fresh));
    setIncludeEndDate(true);
    setBusinessDaysOnly(false);
  }

  function handlePreset(preset: Preset) {
    setStartDate(preset.start);
    setEndDate(preset.end);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCopySummary() {
    if (!result || primaryCount === null) return;
    const text = `${SITE_NAME} Calculation: ${effectiveStart} to ${effectiveEnd} = ${primaryCount.toLocaleString()} ${businessDaysOnly ? "business days" : "days"} (${result.businessDays} workdays, ${result.weekendDays} weekend days).`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("idle");
    }
  }

  async function handleShare() {
    const shareData = {
      title: "Days Between Two Dates Calculator",
      text: `Date duration: ${effectiveStart} to ${effectiveEnd}`,
      url: window.location.href,
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 2000);
      } catch {
        setShareState("idle");
      }
    }
  }

  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            disabled={!result}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3.5 py-2 text-[13px] font-semibold text-foreground shadow-card transition hover:bg-cat-date-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyState === "copied" ? (
              <Check className={`size-4 ${dateTheme.text}`} aria-hidden="true" />
            ) : (
              <Copy className={`size-4 ${dateTheme.text}`} aria-hidden="true" />
            )}
            {copyState === "copied" ? "Copied!" : "Copy Summary"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3.5 py-2 text-[13px] font-semibold text-foreground shadow-card transition hover:bg-cat-date-soft"
          >
            {shareState === "copied" ? (
              <Link2 className={`size-4 ${dateTheme.text}`} aria-hidden="true" />
            ) : (
              <Share2 className="size-4" aria-hidden="true" />
            )}
            {shareState === "copied" ? "Link Copied" : "Share"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="input-heading"
          className="flex flex-col gap-4 lg:col-span-5"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="input-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <CalendarDays className={`size-5 ${dateTheme.text}`} aria-hidden="true" />
                Select Range
              </h2>
              <button
                type="button"
                onClick={handleReset}
                className="ui-label inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted transition hover:bg-background hover:text-foreground"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            <DatePickerField
              id="start-date-input"
              label="Start Date"
              value={effectiveStart}
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
                    onClick={() => setStartDate(toDateInputValue(new Date()))}
                    className={`text-[12px] font-semibold hover:underline ${dateTheme.text}`}
                  >
                    Today
                  </button>
                </div>
              }
            />

            <div className="relative z-10 -my-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap start and end dates"
                aria-label="Swap start and end dates"
                className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-card transition hover:bg-cat-date hover:text-white"
              >
                <ArrowUpDown className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <DatePickerField
                id="end-date-input"
                label="End Date"
                value={effectiveEnd}
                onChange={setEndDate}
                required
                labelAccessory={
                  endBadge ? (
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${dateTheme.badge}`}
                    >
                      {endBadge}
                    </span>
                  ) : null
                }
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="mr-0.5 text-[11px] font-medium text-muted">
                  Quick Add:
                </span>
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => applyEndFromStart((start) => addDays(start, days))}
                    className="rounded bg-background px-2.5 py-1 text-[12px] font-medium tabular-nums text-foreground transition hover:bg-cat-date-soft hover:text-cat-date"
                  >
                    +{days}d
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => applyEndFromStart((start) => endOfMonth(start))}
                  className="rounded bg-background px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-cat-date-soft"
                >
                  End of Month
                </button>
                <button
                  type="button"
                  onClick={() => applyEndFromStart((start) => endOfYear(start))}
                  className="rounded bg-background px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-cat-date-soft"
                >
                  End of Year
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 rounded-xl border border-border/60 bg-background/70 p-4">
              <ToggleSwitch
                id="toggle-include-end"
                checked={includeEndDate}
                onChange={setIncludeEndDate}
                title="Include End Date in Count"
                description="Count both start and finish dates (+1 day)"
              />
              <div className="h-px bg-border/70" />
              <ToggleSwitch
                id="toggle-business-only"
                checked={businessDaysOnly}
                onChange={setBusinessDaysOnly}
                title="Count Business Days Only"
                description="Automatically exclude Saturdays and Sundays"
              />
            </div>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-[15px] font-semibold text-white shadow-card transition hover:bg-accent/90 active:scale-[0.99]"
              onClick={() => {
                document
                  .getElementById("outcome-heading")
                  ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
            >
              <Zap className="size-5" aria-hidden="true" />
              Calculate Difference
            </button>
          </div>
        </section>

        <section
          aria-labelledby="outcome-heading"
          className="flex min-h-[22rem] flex-col gap-4 lg:col-span-7"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                id="outcome-heading"
                className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
              >
                Outcome result
              </span>
              <span className="text-[12px] tabular-nums text-muted">
                {result
                  ? formatRangeLabel(result.orderedStart, result.orderedEnd)
                  : "Select both dates to calculate"}
              </span>
            </div>

            {result && primaryCount !== null ? (
              <div className="animate-fade-in flex flex-col gap-5">
                {result.wasSwapped && (
                  <p className="text-[13px] font-medium text-amber-800">
                    End date was before start date — results use chronological
                    order.
                  </p>
                )}

                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-6xl">
                      {primaryCount.toLocaleString()}{" "}
                      <span className="text-[0.55em] font-bold">
                        {primaryCount === 1 ? "Day" : "Days"}
                      </span>
                    </span>
                    <span className="text-lg font-medium text-muted">
                      {primaryLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-muted">
                    <span>Equivalent to</span>
                    <span className="font-semibold text-foreground">
                      {formatNaturalBreakdown(
                        result.years,
                        result.months,
                        result.days,
                      )}
                    </span>
                    <span className="text-[12px] tabular-nums text-muted">
                      {includeEndDate
                        ? "(Terminal day included)"
                        : "(Terminal day excluded)"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div
                    className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2.5 text-center"
                    title={`${result.totalDays.toLocaleString()} continuous 24h days`}
                  >
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {result.weeks}w + {result.weekRemainderDays}d
                    </span>
                    <span className="ui-label mt-0.5 text-[11px] text-muted">
                      Weeks &amp; days
                    </span>
                  </div>
                  <div
                    className={`flex w-full flex-col items-center justify-center rounded-full border px-4 py-2.5 text-center ${dateTheme.borderSoft} ${dateTheme.soft}`}
                    title="Monday through Friday"
                  >
                    <span
                      className={`text-sm font-semibold tabular-nums ${dateTheme.text}`}
                    >
                      {result.businessDays.toLocaleString()} workdays
                    </span>
                    <span className={`ui-label mt-0.5 text-[11px] ${dateTheme.text}`}>
                      Business days
                    </span>
                  </div>
                  <div
                    className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2.5 text-center"
                    title="Saturdays and Sundays"
                  >
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {result.weekendDays.toLocaleString()} weekend days
                    </span>
                    <span className="ui-label mt-0.5 text-[11px] text-muted">
                      Weekend days
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className={`text-[13px] font-medium hover:underline ${dateTheme.text}`}
                    aria-expanded={showAltUnits}
                    onClick={() => setShowAltUnits((open) => !open)}
                  >
                    {showAltUnits ? "Hide more units" : "Show more units"}
                  </button>
                  {showAltUnits && (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.hours.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Hours
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.minutes.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Minutes
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.seconds.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Seconds
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.yearPercent}%
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Of year
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-muted">
                Pick a start date and an end date to see total days, business
                days, and weekend breakdown.
              </p>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="presets-heading" className="pt-6">
        <div className="mb-4">
          <h2
            id="presets-heading"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            Popular Date Calculation Presets &amp; Examples
          </h2>
          <p className="mt-1 text-sm text-muted">
            Click any common benchmark to populate the calculator instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset)}
              className="group inline-flex min-w-[10.5rem] flex-1 flex-col items-center justify-center rounded-full border border-border bg-panel px-5 py-3 text-center transition hover:border-cat-date/45 hover:bg-cat-date-soft sm:min-w-[12rem] sm:flex-none"
            >
              <span className="text-[13px] font-semibold text-foreground group-hover:text-cat-date">
                {preset.title}
              </span>
              <span className="mt-0.5 text-xs text-muted">{preset.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
