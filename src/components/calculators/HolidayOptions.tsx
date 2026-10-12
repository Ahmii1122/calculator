"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ALL_SEVEN_REJECT_MESSAGE,
  WEEKDAY_LABELS,
  canSetNonWorkingWeekdays,
  type CompactHoliday,
  type Weekday,
} from "@/lib/utils/business-days";
import {
  HOLIDAY_TYPE_OPTIONS,
  POPULAR_COUNTRY_CODES,
  loadCountries,
  loadHolidayFile,
  loadRegionsIndex,
  rangeOutsideHolidayYears,
  type CountryOption,
  type HolidayFileMeta,
  type RegionOption,
} from "@/lib/holidays/load-holidays";

export type HolidayOptionsValue = {
  countryCode: string;
  regionCode: string;
  nonWorkingWeekdays: Set<Weekday>;
  includePublic: boolean;
  includeBank: boolean;
  customDates: string[];
  holidays: CompactHoliday[];
  meta: HolidayFileMeta | null;
  loading: boolean;
  error: string | null;
  countrySelected: boolean;
};

export type HolidayOptionsProps = {
  /** Optional date range for the coverage warning. */
  startDate?: string;
  endDate?: string;
  value: HolidayOptionsValue;
  onChange: (
    next:
      | HolidayOptionsValue
      | ((prev: HolidayOptionsValue) => HolidayOptionsValue),
  ) => void;
};

export function createDefaultHolidayOptions(): HolidayOptionsValue {
  return {
    countryCode: "",
    regionCode: "",
    nonWorkingWeekdays: new Set<Weekday>([0, 6]),
    includePublic: true,
    includeBank: false,
    customDates: [],
    holidays: [],
    meta: null,
    loading: false,
    error: null,
    countrySelected: false,
  };
}

const PRESETS: { id: string; label: string; days: Weekday[] }[] = [
  { id: "sat-sun", label: "Sat–Sun", days: [6, 0] },
  { id: "fri-sat", label: "Fri–Sat", days: [5, 6] },
  { id: "sun", label: "Sun only", days: [0] },
];

/**
 * Shared holiday / weekend options for business-day modes.
 * Fetches static JSON from /data/holidays — never imports date-holidays.
 */
export function HolidayOptions({
  startDate = "",
  endDate = "",
  value,
  onChange,
}: HolidayOptionsProps) {
  const baseId = useId();
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [regionsByCountry, setRegionsByCountry] = useState<
    Record<string, RegionOption[]>
  >({});
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [customDraft, setCustomDraft] = useState("");
  const [weekendMessage, setWeekendMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    Promise.all([loadCountries(ac.signal), loadRegionsIndex(ac.signal)])
      .then(([c, r]) => {
        setCountries(c.countries);
        setRegionsByCountry(r.regions);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        setCountriesError(
          err instanceof Error ? err.message : "Could not load countries.",
        );
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    if (!value.countryCode) {
      onChange((prev) => ({
        ...prev,
        regionCode: "",
        holidays: [],
        meta: null,
        loading: false,
        error: null,
        countrySelected: false,
      }));
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;
    const countryCode = value.countryCode;
    const regionCode = value.regionCode;

    onChange((prev) => ({
      ...prev,
      loading: true,
      error: null,
      countrySelected: true,
    }));

    const region =
      regionCode &&
      (regionsByCountry[countryCode] ?? []).some((r) => r.code === regionCode)
        ? regionCode
        : null;

    loadHolidayFile(countryCode, region, ac.signal)
      .then((file) => {
        if (ac.signal.aborted) return;
        onChange((prev) => ({
          ...prev,
          holidays: file.h,
          meta: file.meta,
          loading: false,
          error: null,
          countrySelected: true,
        }));
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        onChange((prev) => ({
          ...prev,
          holidays: [],
          meta: null,
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Could not load holidays. Using weekends only.",
          countrySelected: true,
        }));
      });

    return () => ac.abort();
    // Fetch only when country/region (or region index) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.countryCode, value.regionCode, regionsByCountry]);

  const popular = useMemo(() => {
    const byCode = new Map(countries.map((c) => [c.code, c]));
    return POPULAR_COUNTRY_CODES.map((code) => byCode.get(code)).filter(
      (c): c is CountryOption => Boolean(c),
    );
  }, [countries]);

  const regions = regionsByCountry[value.countryCode] ?? [];

  const coverageWarning =
    value.meta &&
    rangeOutsideHolidayYears(
      startDate,
      endDate,
      value.meta.firstYear,
      value.meta.lastYear,
    )
      ? `Holiday data covers ${value.meta.firstYear} to ${value.meta.lastYear}; years outside that range are counted without holidays`
      : null;

  function patch(partial: Partial<HolidayOptionsValue>) {
    onChange((prev) => ({ ...prev, ...partial }));
  }

  function toggleWeekday(day: Weekday) {
    const next = new Set(value.nonWorkingWeekdays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    const check = canSetNonWorkingWeekdays(next);
    if (!check.ok) {
      setWeekendMessage(check.message);
      return;
    }
    setWeekendMessage(null);
    patch({ nonWorkingWeekdays: check.value });
  }

  function applyPreset(days: Weekday[]) {
    const check = canSetNonWorkingWeekdays(days);
    if (!check.ok) {
      setWeekendMessage(check.message);
      return;
    }
    setWeekendMessage(null);
    patch({ nonWorkingWeekdays: check.value });
  }

  function addCustomDate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(customDraft)) return;
    if (value.customDates.includes(customDraft)) {
      setCustomDraft("");
      return;
    }
    patch({ customDates: [...value.customDates, customDraft].sort() });
    setCustomDraft("");
  }

  function removeCustomDate(date: string) {
    patch({ customDates: value.customDates.filter((d) => d !== date) });
  }

  return (
    <div className="space-y-4 text-[13px] text-foreground">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${baseId}-country`}
          className="font-semibold text-foreground"
        >
          Country holidays
        </label>
        <select
          id={`${baseId}-country`}
          value={value.countryCode}
          onChange={(e) =>
            patch({
              countryCode: e.target.value,
              regionCode: "",
            })
          }
          className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] text-foreground outline-none focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
        >
          <option value="">None, weekends only</option>
          {popular.length > 0 && (
            <optgroup label="Popular">
              {popular.map((c) => (
                <option key={`pop-${c.code}`} value={c.code}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="All countries">
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </select>
        {countriesError && (
          <p className="text-[12px] text-amber-900" role="status">
            {countriesError}
          </p>
        )}
      </div>

      {regions.length > 0 && value.countryCode ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${baseId}-region`}
            className="font-semibold text-foreground"
          >
            Region / state
          </label>
          <select
            id={`${baseId}-region`}
            value={value.regionCode}
            onChange={(e) => patch({ regionCode: e.target.value })}
            className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] text-foreground outline-none focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
          >
            <option value="">National holidays only</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div
        className="min-h-[1.25rem] text-[12px] leading-snug text-zinc-700"
        aria-live="polite"
      >
        {value.loading
          ? "Loading holidays…"
          : value.error
            ? `${value.error} Falling back to weekends only.`
            : coverageWarning
              ? coverageWarning
              : value.countrySelected && value.meta
                ? `Loaded holidays for ${value.meta.firstYear}–${value.meta.lastYear}.`
                : "\u00a0"}
      </div>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-foreground">
          Non-working weekdays
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.days)}
              className="rounded-md border border-border/80 bg-background px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-cat-date-soft"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {WEEKDAY_LABELS.map(({ day, short, long }) => {
            const id = `${baseId}-wd-${day}`;
            const checked = value.nonWorkingWeekdays.has(day);
            return (
              <label
                key={day}
                htmlFor={id}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border px-1 py-2 text-center text-[12px] ${
                  checked
                    ? "border-cat-date/50 bg-cat-date-soft font-semibold text-foreground"
                    : "border-border/70 bg-background text-foreground"
                }`}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleWeekday(day)}
                  className="size-3.5 accent-cat-date"
                  aria-label={`${long} non-working`}
                />
                <span>{short}</span>
              </label>
            );
          })}
        </div>
        {weekendMessage && (
          <p className="text-[12px] text-amber-900" role="status">
            {weekendMessage === ALL_SEVEN_REJECT_MESSAGE
              ? weekendMessage
              : weekendMessage}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-foreground">Holiday types</legend>
        {HOLIDAY_TYPE_OPTIONS.map((opt) => {
          const id = `${baseId}-type-${opt.id}`;
          const checked =
            opt.id === "public" ? value.includePublic : value.includeBank;
          return (
            <label
              key={opt.id}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 text-foreground"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  patch(
                    opt.id === "public"
                      ? { includePublic: e.target.checked }
                      : { includeBank: e.target.checked },
                  )
                }
                className="size-3.5 accent-cat-date"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="space-y-2">
        <label
          htmlFor={`${baseId}-custom`}
          className="font-semibold text-foreground"
        >
          Custom days off
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id={`${baseId}-custom`}
            type="date"
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            className="rounded-lg border border-border/80 bg-background px-3 py-2 text-[14px] text-foreground outline-none focus:border-cat-date focus:ring-2 focus:ring-cat-date/20"
          />
          <button
            type="button"
            onClick={addCustomDate}
            className="rounded-lg border border-border/80 bg-background px-3 py-2 text-[13px] font-semibold text-foreground transition hover:bg-cat-date-soft"
          >
            Add
          </button>
        </div>
        {value.customDates.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {value.customDates.map((d) => (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => removeCustomDate(d)}
                  className="rounded-md bg-background px-2 py-1 text-[12px] font-medium text-foreground ring-1 ring-border/80 hover:bg-cat-date-soft"
                  aria-label={`Remove ${d}`}
                >
                  {d} ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[12px] leading-relaxed text-zinc-700">
        Holiday dates come from an open-source dataset and may not include
        local, regional or one-off holidays. Confirm important deadlines.
      </p>
    </div>
  );
}

/** Build the filtered HolidaySet inputs from HolidayOptionsValue. */
export function holidayTypesFromOptions(value: HolidayOptionsValue): string[] {
  const types: string[] = [];
  if (value.includePublic) types.push("public");
  if (value.includeBank) types.push("bank");
  return types;
}
