"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { format, subYears } from "date-fns";
import { Cake, CalendarDays, RefreshCw } from "lucide-react";
import { calculateAge, toDateInputValue } from "@/lib/age";
import { dayOfWeekLabel, parseDateInput } from "@/lib/date-span";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import { DatePickerField } from "@/components/ui/DatePickerField";

const dateTheme = CATEGORY_THEME[getCategoryTheme("date-time")];

/** Stable client "now" for defaults without hydration mismatch. */
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

/**
 * Interactive age calculator — DOB + age-at date, live results in the browser.
 */
export function AgeCalculator() {
  const clientNow = useClientNow();
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [ageAtDate, setAgeAtDate] = useState<string | null>(null);
  const [showAltUnits, setShowAltUnits] = useState(false);

  const effectiveAgeAt =
    ageAtDate ?? (clientNow ? toDateInputValue(clientNow) : "");
  const effectiveBirth = birthDate ?? "";

  const todayValue = clientNow ? toDateInputValue(clientNow) : undefined;

  const calculation = useMemo(() => {
    if (!effectiveBirth || !effectiveAgeAt) return null;
    return calculateAge(effectiveBirth, effectiveAgeAt, todayValue);
  }, [effectiveBirth, effectiveAgeAt, todayValue]);

  const birthBadge = effectiveBirth ? dayOfWeekLabel(effectiveBirth) : null;
  const ageAtBadge = effectiveAgeAt ? dayOfWeekLabel(effectiveAgeAt) : null;

  function handleReset() {
    const fresh = new Date();
    cachedClientNow = fresh;
    setBirthDate(null);
    setAgeAtDate(toDateInputValue(fresh));
    setShowAltUnits(false);
  }

  function applyPresetBirth(yearsAgo: number) {
    const base = clientNow ?? new Date();
    setBirthDate(toDateInputValue(subYears(base, yearsAgo)));
    if (!ageAtDate && clientNow) {
      setAgeAtDate(toDateInputValue(clientNow));
    }
  }

  const result = calculation?.ok ? calculation.result : null;
  const error = calculation && !calculation.ok ? calculation.error : null;

  return (
    <div className="space-y-6">
      <p className="text-[13px] leading-relaxed text-muted">
        Your dates stay on this device — age is calculated in your browser and
        never stored or sent anywhere.
      </p>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="age-input-heading"
          className="flex flex-col gap-4 lg:col-span-5"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="age-input-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <CalendarDays
                  className={`size-5 ${dateTheme.text}`}
                  aria-hidden="true"
                />
                Date of Birth
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
              id="date-of-birth-input"
              label="Date of Birth"
              value={effectiveBirth}
              onChange={setBirthDate}
              required
              labelAccessory={
                birthBadge ? (
                  <span className="rounded bg-background px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted">
                    {birthBadge}
                  </span>
                ) : null
              }
            />

            <DatePickerField
              id="age-at-date-input"
              label="Age at the Date of"
              value={effectiveAgeAt}
              onChange={setAgeAtDate}
              required
              labelAccessory={
                <div className="flex items-center gap-2">
                  {ageAtBadge && (
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${dateTheme.badge}`}
                    >
                      {ageAtBadge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAgeAtDate(toDateInputValue(new Date()))
                    }
                    className={`text-[12px] font-semibold hover:underline ${dateTheme.text}`}
                  >
                    Today
                  </button>
                </div>
              }
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="mr-0.5 text-[11px] font-medium text-muted">
                Quick DOB:
              </span>
              {[18, 25, 30, 40, 50].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => applyPresetBirth(years)}
                  className="rounded bg-background px-2.5 py-1 text-[12px] font-medium tabular-nums text-foreground transition hover:bg-cat-date-soft hover:text-cat-date"
                >
                  {years}y ago
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="age-outcome-heading"
          className="flex min-h-[22rem] flex-col gap-4 lg:col-span-7"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex min-h-[22rem] flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                id="age-outcome-heading"
                className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
              >
                Your age
              </span>
              <span className="text-[12px] tabular-nums text-muted">
                {result && parseDateInput(effectiveAgeAt)
                  ? `As of ${format(parseDateInput(effectiveAgeAt)!, "MMM d, yyyy")}`
                  : effectiveBirth
                    ? "Checking dates…"
                    : "Enter a date of birth to calculate"}
              </span>
            </div>

            {!effectiveBirth && (
              <p className="text-[15px] text-muted">
                Enter your date of birth to see how old you are in years,
                months, and days — plus days until your next birthday.
              </p>
            )}

            {error === "future_birth" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
                That date of birth is in the future. Enter a past date to
                calculate age.
              </p>
            )}

            {error === "age_at_before_birth" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
                “Age at the Date of” is earlier than the date of birth. Choose a
                date on or after the birth date.
              </p>
            )}

            {error === "invalid" && (
              <p className="text-[14px] font-medium text-amber-900">
                Enter valid dates to calculate age.
              </p>
            )}

            {result && (
              <div className="animate-fade-in flex flex-col gap-5">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                    {result.summary}
                  </p>
                  <p className="mt-2 text-[15px] text-muted">
                    Exact age from date of birth
                    {result.isBirthdayToday ? " — birthday today" : ""}.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div
                    className={`flex w-full flex-col items-center justify-center rounded-full border px-4 py-2.5 text-center ${dateTheme.borderSoft} ${dateTheme.soft}`}
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums ${dateTheme.text}`}
                    >
                      <Cake className="size-4" aria-hidden="true" />
                      {result.isBirthdayToday
                        ? "Today"
                        : `${result.daysUntilBirthday.toLocaleString()} ${result.daysUntilBirthday === 1 ? "day" : "days"}`}
                    </span>
                    <span className={`ui-label mt-0.5 text-[11px] ${dateTheme.text}`}>
                      Next birthday
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-4 py-2.5 text-center">
                    <span className="text-sm font-semibold text-foreground">
                      {result.nextBirthdayWeekday}
                    </span>
                    <span className="ui-label mt-0.5 text-[11px] text-muted">
                      {format(result.nextBirthday, "MMM d, yyyy")}
                      {result.nextBirthdayUsesMarch1 ? " (observed Mar 1)" : ""}
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-muted">
                  Born on a{" "}
                  <span className="font-semibold text-foreground">
                    {result.bornWeekday}
                  </span>
                  {" · "}
                  {result.totalDays.toLocaleString()}{" "}
                  {result.totalDays === 1 ? "day" : "days"} old
                </p>

                {result.nextBirthdayUsesMarch1 && (
                  <p className="text-[12px] text-muted">
                    Next birthday falls in a non-leap year, so Feb 29 is observed
                    on March 1.
                  </p>
                )}

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
                          {result.totalMonths.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Months lived
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.totalWeeks.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Weeks lived
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.totalDays.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Days lived
                        </span>
                      </div>
                      <div className="flex w-full flex-col items-center justify-center rounded-full border border-border/70 bg-background px-3 py-2.5 text-center">
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {result.totalHours.toLocaleString()}
                        </span>
                        <span className="ui-label mt-0.5 text-[11px] text-muted">
                          Hours
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
