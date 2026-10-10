"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Baby, RefreshCw } from "lucide-react";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  CYCLE_LENGTH_DEFAULT,
  CYCLE_LENGTH_MAX,
  CYCLE_LENGTH_MIN,
  EMBRYO_OPTIONS,
  PREGNANCY_MODES,
  TRIMESTERS,
  ULTRASOUND_WEEKS_MAX,
  ULTRASOUND_WEEKS_MIN,
  calculatePregnancy,
  type PregnancyMode,
} from "@/lib/utils/pregnancy";

const ACCENT = "#B45309";

function parseWholeNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/**
 * Interactive pregnancy due date calculator — LMP, conception, IVF, ultrasound.
 * "Today" is set after mount to avoid baking the build date into static HTML.
 */
export function PregnancyDueDateCalculator() {
  const [mode, setMode] = useState<PregnancyMode>("lmp");
  const [today, setToday] = useState<Date | null>(null);

  const [lmpDate, setLmpDate] = useState("");
  const [cycleLength, setCycleLength] = useState(String(CYCLE_LENGTH_DEFAULT));

  const [conceptionDate, setConceptionDate] = useState("");

  const [transferDate, setTransferDate] = useState("");
  const [embryoId, setEmbryoId] = useState(EMBRYO_OPTIONS[1]?.id ?? "day-5");

  const [scanDate, setScanDate] = useState("");
  const [ultrasoundWeeks, setUltrasoundWeeks] = useState("8");
  const [ultrasoundDays, setUltrasoundDays] = useState("0");

  const tablistId = useId();
  const cycleId = useId();
  const embryoSelectId = useId();
  const usWeeksId = useId();
  const usDaysId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const result = calculatePregnancy({
    mode,
    lmpDate,
    cycleLength: parseWholeNumber(cycleLength),
    conceptionDate,
    transferDate,
    embryoId,
    scanDate,
    ultrasoundWeeks: parseWholeNumber(ultrasoundWeeks),
    ultrasoundDays: parseWholeNumber(ultrasoundDays),
    today,
  });

  const selectMode = useCallback((next: PregnancyMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setMode("lmp");
    setLmpDate("");
    setCycleLength(String(CYCLE_LENGTH_DEFAULT));
    setConceptionDate("");
    setTransferDate("");
    setEmbryoId(EMBRYO_OPTIONS[1]?.id ?? "day-5");
    setScanDate("");
    setUltrasoundWeeks("8");
    setUltrasoundDays("0");
    setToday(new Date());
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = PREGNANCY_MODES.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = last;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    selectMode(PREGNANCY_MODES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="pregnancy-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="pregnancy-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Baby className="size-5 text-[#B45309]" aria-hidden="true" />
              Dating method
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

          <div
            id={tablistId}
            role="tablist"
            aria-label="Due date calculation modes"
            className="grid grid-cols-2 gap-1.5"
          >
            {PREGNANCY_MODES.map((item, index) => {
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
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`rounded-lg px-2.5 py-2.5 text-left text-[12px] font-semibold transition sm:text-[13px] ${
                    selected
                      ? "bg-[#B45309] text-white shadow-sm"
                      : "bg-background text-foreground hover:bg-stone-100"
                  }`}
                >
                  <span className="block leading-snug">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] font-medium ${
                      selected ? "text-white/85" : "text-zinc-600"
                    }`}
                  >
                    {item.shortLabel}
                  </span>
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
            {mode === "lmp" ? (
              <>
                <DatePickerField
                  id="pregnancy-lmp-date"
                  label="First day of last period"
                  value={lmpDate}
                  onChange={setLmpDate}
                />
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={cycleId}
                    className="text-[12px] font-semibold text-zinc-600"
                  >
                    Average cycle length (days)
                  </label>
                  <input
                    id={cycleId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={cycleLength}
                    onChange={(e) => setCycleLength(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                  />
                  <p className="text-[12px] leading-relaxed text-zinc-600">
                    Default {CYCLE_LENGTH_DEFAULT} days. Allowed range{" "}
                    {CYCLE_LENGTH_MIN}–{CYCLE_LENGTH_MAX}.
                  </p>
                </div>
              </>
            ) : null}

            {mode === "conception" ? (
              <DatePickerField
                id="pregnancy-conception-date"
                label="Conception date"
                value={conceptionDate}
                onChange={setConceptionDate}
              />
            ) : null}

            {mode === "ivf" ? (
              <>
                <DatePickerField
                  id="pregnancy-transfer-date"
                  label="Embryo transfer date"
                  value={transferDate}
                  onChange={setTransferDate}
                />
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={embryoSelectId}
                    className="text-[12px] font-semibold text-zinc-600"
                  >
                    Embryo age at transfer
                  </label>
                  <select
                    id={embryoSelectId}
                    value={embryoId}
                    onChange={(e) => setEmbryoId(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                  >
                    {EMBRYO_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            {mode === "ultrasound" ? (
              <>
                <DatePickerField
                  id="pregnancy-scan-date"
                  label="Ultrasound scan date"
                  value={scanDate}
                  onChange={setScanDate}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={usWeeksId}
                      className="text-[12px] font-semibold text-zinc-600"
                    >
                      Gestational weeks
                    </label>
                    <input
                      id={usWeeksId}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={ultrasoundWeeks}
                      onChange={(e) => setUltrasoundWeeks(e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={usDaysId}
                      className="text-[12px] font-semibold text-zinc-600"
                    >
                      Extra days (0–6)
                    </label>
                    <input
                      id={usDaysId}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={ultrasoundDays}
                      onChange={(e) => setUltrasoundDays(e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                    />
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed text-zinc-600">
                  Gestational age on the scan date, typically between{" "}
                  {ULTRASOUND_WEEKS_MIN} and {ULTRASOUND_WEEKS_MAX} weeks.
                </p>
              </>
            ) : null}
          </div>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Your dates stay in your browser. Nothing is stored or sent.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="pregnancy-outcome-heading"
        className="flex min-h-96 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-96 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="pregnancy-outcome-heading"
              className="ui-label rounded-md bg-[#B45309] px-2.5 py-1 text-[11px] text-white"
            >
              Estimated due date
            </span>
            <span className="text-[12px] text-zinc-600">
              {PREGNANCY_MODES.find((item) => item.id === mode)?.label}
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold text-zinc-600">
                  Estimated due date
                </p>
                <p
                  className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl"
                  style={{ color: ACCENT }}
                >
                  {result.eddWeekdayDisplay}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
                  This is an estimate used for dating a pregnancy, not a
                  prediction of the birth date.
                </p>
              </div>

              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                <span className="ui-label mb-0.5 block text-[11px] text-zinc-600">
                  Worked step
                </span>
                {result.working}
              </p>

              {!result.todayReady ? (
                <div className="min-h-16 space-y-2" aria-hidden="true">
                  <div className="h-4 w-48 rounded bg-stone-100" />
                  <div className="h-4 w-64 rounded bg-stone-100" />
                </div>
              ) : result.isPast ? (
                <p className="text-[13px] leading-relaxed text-zinc-600">
                  This estimated due date is in the past. Key dates below are
                  still shown for reference.
                </p>
              ) : (
                <div className="space-y-3">
                  {result.gestationalAgeDisplay ? (
                    <p className="text-[14px] text-zinc-800">
                      Gestational age today:{" "}
                      <strong className="font-semibold tabular-nums text-foreground">
                        {result.gestationalAgeDisplay}
                      </strong>
                      {result.trimester ? (
                        <>
                          {" "}
                          · {result.trimester.label}
                          <span className="mt-1 block text-[12px] font-normal text-zinc-600">
                            Sources define trimesters slightly differently.
                          </span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {result.daysRemaining !== null ? (
                    <p className="text-[14px] text-zinc-800">
                      {result.daysRemaining === 0
                        ? "The estimated due date is today."
                        : `${result.daysRemaining.toLocaleString("en-US")} ${
                            result.daysRemaining === 1 ? "day" : "days"
                          } remaining until the estimated due date.`}
                    </p>
                  ) : null}
                </div>
              )}

              {result.estimatedConceptionDisplay ? (
                <p className="text-[14px] text-zinc-700">
                  Approximate conception date:{" "}
                  <strong className="font-semibold tabular-nums text-foreground">
                    {result.estimatedConceptionDisplay}
                  </strong>
                </p>
              ) : null}

              {result.todayReady &&
              !result.isPast &&
              result.timelineWeek !== null ? (
                <PregnancyTimeline
                  currentWeek={result.timelineWeek}
                  gestationalLabel={result.gestationalAgeDisplay}
                />
              ) : (
                <div className="min-h-20" aria-hidden={!result.todayReady} />
              )}

              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-foreground">
                  Key dates from the estimated due date
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border/70">
                  <table className="min-w-[22rem] w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
                        <th scope="col" className="px-3 py-2">
                          Milestone
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Gestational age
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.keyDates.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-3 py-2 text-zinc-800">
                            {row.label}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-zinc-700">
                            {row.gestationalLabel}
                          </td>
                          <td className="px-3 py-2 font-semibold tabular-nums text-foreground">
                            {row.dateDisplay}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
                  Most births happen between {result.birthWindowStartDisplay}{" "}
                  and {result.birthWindowEndDisplay}.
                </p>
              </div>

              <p className="text-[13px] leading-relaxed text-zinc-600">
                Only a small percentage of babies are born on their estimated
                due date. Most arrive between 37 and 42 weeks.
              </p>

              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and is not medical
                advice. Your healthcare provider will confirm your due date and
                care plan.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <p className="text-[15px] leading-relaxed text-zinc-600">
                {result.message}
              </p>
              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and is not medical
                advice.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PregnancyTimeline({
  currentWeek,
  gestationalLabel,
}: {
  currentWeek: number;
  gestationalLabel: string | null;
}) {
  const markerPercent = (currentWeek / 40) * 100;

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold text-foreground">
        40-week pregnancy timeline
      </p>
      <p className="sr-only">
        Timeline marker at week {currentWeek}
        {gestationalLabel ? ` (gestational age ${gestationalLabel})` : ""}.
        First trimester weeks 0 to 13, second trimester weeks 14 to 27, third
        trimester weeks 28 to 40.
      </p>
      <div className="relative pt-1.5" aria-hidden="true">
        <div className="relative h-10 overflow-hidden rounded-lg border border-border/70 bg-stone-50">
          <div className="absolute inset-0 flex text-[10px] font-semibold text-zinc-700">
            {TRIMESTERS.map((trimester) => {
              const startWeek = Math.floor(trimester.startDays / 7);
              const endWeek =
                trimester.endDays === null
                  ? 40
                  : Math.floor(trimester.endDays / 7) + 1;
              const width = ((endWeek - startWeek) / 40) * 100;
              return (
                <div
                  key={trimester.id}
                  style={{ width: `${width}%` }}
                  className={`flex items-center justify-center border-r border-border/60 last:border-r-0 ${
                    trimester.id === "first"
                      ? "bg-stone-100"
                      : trimester.id === "second"
                        ? "bg-stone-200/80"
                        : "bg-stone-300/70"
                  }`}
                >
                  <span className="px-1 text-center leading-tight">
                    {trimester.label.replace(" trimester", "")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Marker sits above the clipped track so the dot is never cut off. */}
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{
            left: `clamp(0.375rem, ${markerPercent}%, calc(100% - 0.375rem))`,
          }}
        >
          <div className="absolute top-0 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-zinc-950 bg-[#B45309]" />
          <div className="absolute top-2 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-zinc-950" />
        </div>
      </div>
      <p className="text-[12px] text-zinc-600">
        Marker at week {currentWeek}
        {gestationalLabel ? ` · ${gestationalLabel}` : ""}. Segments are labeled
        first, second, and third trimester (patterned, not color-only).
      </p>
    </div>
  );
}
