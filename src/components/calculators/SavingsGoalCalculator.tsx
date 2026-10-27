"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { addMonths, format } from "date-fns";
import { PiggyBank, RefreshCw } from "lucide-react";
import {
  COMPOUNDING_OPTIONS,
  RATE_HIGH_WARNING,
  calculateSavingsGoal,
  type CompoundingFrequency,
  type ContributionTiming,
  type SavingsMode,
  type YearBreakdownRow,
} from "@/lib/utils/savings-goal";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  fromCents,
  parseDecimal,
  parseWhole,
} from "@/lib/utils/money";

const ACCENT = "#B45309";
const DISCLAIMER =
  "This calculator provides general information and illustrative estimates only. It is not financial advice. Talk to a qualified financial adviser about your own situation.";

const MODES: {
  id: SavingsMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "monthly",
    label: "How much to save",
    shortLabel: "Monthly amount for a goal and time frame",
  },
  {
    id: "duration",
    label: "How long it will take",
    shortLabel: "Time to reach a goal at your monthly saving",
  },
];

/**
 * Interactive savings goal calculator — required monthly amount or time to goal.
 */
export function SavingsGoalCalculator() {
  const [mode, setMode] = useState<SavingsMode>("monthly");
  const [goal, setGoal] = useState("10000");
  const [starting, setStarting] = useState("0");
  const [years, setYears] = useState("5");
  const [months, setMonths] = useState("0");
  const [contribution, setContribution] = useState("200");
  const [rate, setRate] = useState("0");
  const [compounding, setCompounding] =
    useState<CompoundingFrequency>("monthly");
  const [timing, setTiming] = useState<ContributionTiming>("end");
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [inflation, setInflation] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");
  const [startMonthLabel, setStartMonthLabel] = useState("");
  const [completionLabel, setCompletionLabel] = useState("");
  const [moreOpen, setMoreOpen] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);

  const tablistId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const timingGroupId = useId();
  const goalId = useId();
  const startingId = useId();
  const yearsId = useId();
  const monthsId = useId();
  const contribId = useId();
  const rateId = useId();
  const compoundingId = useId();
  const currencyIdInput = useId();
  const inflationCheckId = useId();
  const inflationId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      const narrow = mq.matches;
      setIsNarrow(narrow);
      setMoreOpen(!narrow);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const calc = calculateSavingsGoal({
    mode,
    goal: parseDecimal(goal),
    starting: parseDecimal(starting),
    years: parseWhole(years),
    months: parseWhole(months),
    contribution: parseDecimal(contribution),
    annualRatePercent: parseDecimal(rate),
    compounding,
    timing,
    adjustForInflation: adjustInflation,
    inflationPercent:
      inflation.trim() === "" ? null : parseDecimal(inflation),
  });

  useEffect(() => {
    if (!calc.ok || calc.durationMonths === null || calc.unreachable || calc.overCap) {
      setStartMonthLabel("");
      setCompletionLabel("");
      return;
    }
    const start = new Date();
    const startLabel = format(start, "MMMM yyyy");
    const end = addMonths(start, Math.max(0, calc.durationMonths));
    setStartMonthLabel(startLabel);
    setCompletionLabel(format(end, "MMMM yyyy"));
  }, [calc]);

  const selectMode = useCallback((next: SavingsMode) => {
    setMode(next);
  }, []);

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = MODES.length - 1;
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
    selectMode(MODES[nextIndex]!.id);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleReset() {
    setMode("monthly");
    setGoal("10000");
    setStarting("0");
    setYears("5");
    setMonths("0");
    setContribution("200");
    setRate("0");
    setCompounding("monthly");
    setTiming("end");
    setAdjustInflation(false);
    setInflation("");
    setCurrencyId("USD");
  }

  const money = (cents: number) => formatMoney(fromCents(cents), currencyId);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="sg-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="sg-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <PiggyBank className="size-5 text-[#B45309]" aria-hidden="true" />
              Savings plan
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
            aria-label="Savings goal calculation modes"
            className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
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
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold transition sm:text-[13px] ${
                    selected
                      ? "bg-[#B45309] text-white shadow-sm"
                      : "bg-background text-foreground hover:bg-stone-100"
                  }`}
                >
                  <span className="block">{item.label}</span>
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
            id={`${tablistId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tablistId}-${mode}`}
            className="flex flex-col gap-3.5"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={goalId}
                  className="text-[12px] font-semibold text-zinc-600"
                >
                  Savings goal
                </label>
                <input
                  id={goalId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={currencyIdInput}
                  className="text-[12px] font-semibold text-zinc-600"
                >
                  Currency (display only)
                </label>
                <select
                  id={currencyIdInput}
                  value={currencyId}
                  onChange={(e) => setCurrencyId(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={startingId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Starting amount
              </label>
              <input
                id={startingId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={starting}
                onChange={(e) => setStarting(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>

            {mode === "monthly" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={yearsId}
                    className="text-[12px] font-semibold text-zinc-600"
                  >
                    Time (years)
                  </label>
                  <input
                    id={yearsId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={monthsId}
                    className="text-[12px] font-semibold text-zinc-600"
                  >
                    Extra months (0–11)
                  </label>
                  <input
                    id={monthsId}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={contribId}
                  className="text-[12px] font-semibold text-zinc-600"
                >
                  Monthly contribution
                </label>
                <input
                  id={contribId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={rateId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Annual interest rate (%)
              </label>
              <input
                id={rateId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              />
              <p className="text-[12px] leading-relaxed text-zinc-600">
                Enter 0 if you are saving without interest. The rate is an
                assumption you choose — real rates change.
              </p>
            </div>

            <p className="text-[12px] leading-relaxed text-zinc-600">
              Contributions are monthly only.
            </p>

            {isNarrow ? (
              <details
                className="rounded-lg border border-border/70 bg-background/60"
                open={moreOpen}
                onToggle={(e) => setMoreOpen(e.currentTarget.open)}
              >
                <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  More options
                </summary>
                {moreOpen ? (
                  <div className="space-y-3.5 px-3 pb-3">
                    <MoreOptionsFields
                      timingGroupId={timingGroupId}
                      timing={timing}
                      setTiming={setTiming}
                      compoundingId={compoundingId}
                      compounding={compounding}
                      setCompounding={setCompounding}
                      inflationCheckId={inflationCheckId}
                      adjustInflation={adjustInflation}
                      setAdjustInflation={setAdjustInflation}
                      inflationId={inflationId}
                      inflation={inflation}
                      setInflation={setInflation}
                    />
                  </div>
                ) : null}
              </details>
            ) : (
              <div className="space-y-3.5">
                <MoreOptionsFields
                  timingGroupId={timingGroupId}
                  timing={timing}
                  setTiming={setTiming}
                  compoundingId={compoundingId}
                  compounding={compounding}
                  setCompounding={setCompounding}
                  inflationCheckId={inflationCheckId}
                  adjustInflation={adjustInflation}
                  setAdjustInflation={setAdjustInflation}
                  inflationId={inflationId}
                  inflation={inflation}
                  setInflation={setInflation}
                />
              </div>
            )}
          </div>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Your inputs stay in your browser. They are never sent to our servers
            or stored.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="sg-outcome-heading"
        className="flex min-h-[28rem] flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-[28rem] flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="sg-outcome-heading"
              className="ui-label rounded-md bg-[#B45309] px-2.5 py-1 text-[11px] text-white"
            >
              {mode === "monthly"
                ? "Required monthly savings"
                : "Time to reach your goal"}
            </span>
          </div>

          {calc.ok ? (
            <div className="animate-fade-in flex flex-col gap-5">
              {calc.highRateWarning ? (
                <p className="text-[13px] leading-relaxed text-zinc-700">
                  This assumed rate is above {RATE_HIGH_WARNING}%. That looks
                  unusually high — results are illustrative only.
                </p>
              ) : null}

              {calc.message ? (
                <p className="text-[15px] leading-relaxed text-zinc-700">
                  {calc.message}
                </p>
              ) : null}

              {!calc.unreachable && !calc.overCap ? (
                <>
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-600">
                      {mode === "monthly"
                        ? "Required monthly savings"
                        : "Time to reach your goal"}
                    </p>
                    <p
                      className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl"
                      style={{ color: ACCENT }}
                    >
                      {mode === "monthly"
                        ? money(calc.monthlyContributionCents)
                        : (calc.durationLabel ?? "—")}
                    </p>
                    {mode === "duration" && calc.durationMonths !== null ? (
                      <p className="mt-1 text-[13px] tabular-nums text-zinc-600">
                        {calc.durationMonths}{" "}
                        {calc.durationMonths === 1 ? "month" : "months"} total
                      </p>
                    ) : null}
                    {mode === "monthly" &&
                    calc.weeklyApproxCents !== null &&
                    calc.monthlyContributionCents > 0 ? (
                      <p className="mt-1 text-[13px] tabular-nums text-zinc-600">
                        Roughly {money(calc.weeklyApproxCents)} per week
                        (approximate)
                      </p>
                    ) : null}
                  </div>

                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[12px] font-semibold text-zinc-600">
                        Goal
                      </dt>
                      <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                        {money(calc.goalCents)}
                      </dd>
                    </div>
                    {calc.inflationEnabled ? (
                      <div>
                        <dt className="text-[12px] font-semibold text-zinc-600">
                          Inflated target
                        </dt>
                        <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                          {money(calc.targetCents)}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-[12px] font-semibold text-zinc-600">
                        Starting amount
                      </dt>
                      <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                        {money(calc.startingCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-semibold text-zinc-600">
                        Total contributions
                      </dt>
                      <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                        {money(calc.simulation.totalContributedCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-semibold text-zinc-600">
                        Total interest earned
                      </dt>
                      <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                        {money(calc.simulation.totalInterestCents)}
                      </dd>
                    </div>
                  </dl>

                  <p className="text-[13px] leading-relaxed text-zinc-700">
                    Of the ending balance, about{" "}
                    <strong className="font-semibold tabular-nums">
                      {calc.startingSharePercent.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                      %
                    </strong>{" "}
                    is the starting amount,{" "}
                    <strong className="font-semibold tabular-nums">
                      {calc.contributionSharePercent.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                      %
                    </strong>{" "}
                    contributions, and{" "}
                    <strong className="font-semibold tabular-nums">
                      {calc.interestSharePercent.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                      %
                    </strong>{" "}
                    interest.
                  </p>

                  <div className="min-h-[2.75rem]">
                    {startMonthLabel && completionLabel ? (
                      <p className="text-[14px] leading-relaxed text-zinc-700">
                        If you start in {startMonthLabel}, you would reach the
                        goal around {completionLabel}{" "}
                        <span className="text-zinc-600">(estimate)</span>.
                      </p>
                    ) : (
                      <p className="text-[14px] text-transparent" aria-hidden="true">
                        Placeholder for completion date
                      </p>
                    )}
                  </div>

                  <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                    <span className="ui-label mb-0.5 block text-[11px] text-zinc-600">
                      Worked step
                    </span>
                    {calc.workingStep}
                  </p>

                  {calc.simulation.yearly.length > 0 ? (
                    <>
                      <GrowthChart
                        yearly={calc.simulation.yearly}
                        startingCents={calc.simulation.startingCents}
                        money={money}
                      />
                      <YearlyTable
                        yearly={calc.simulation.yearly}
                        money={money}
                      />
                    </>
                  ) : null}
                </>
              ) : null}

              <p className="text-[12px] leading-relaxed text-zinc-600">
                {DISCLAIMER}
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <p className="text-[15px] leading-relaxed text-zinc-600">
                {calc.message}
              </p>
              <p className="text-[12px] leading-relaxed text-zinc-600">
                {DISCLAIMER}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MoreOptionsFields({
  timingGroupId,
  timing,
  setTiming,
  compoundingId,
  compounding,
  setCompounding,
  inflationCheckId,
  adjustInflation,
  setAdjustInflation,
  inflationId,
  inflation,
  setInflation,
}: {
  timingGroupId: string;
  timing: ContributionTiming;
  setTiming: (value: ContributionTiming) => void;
  compoundingId: string;
  compounding: CompoundingFrequency;
  setCompounding: (value: CompoundingFrequency) => void;
  inflationCheckId: string;
  adjustInflation: boolean;
  setAdjustInflation: (value: boolean) => void;
  inflationId: string;
  inflation: string;
  setInflation: (value: string) => void;
}) {
  return (
    <>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 text-[12px] font-semibold text-zinc-600">
          Contributions are made at the
        </legend>
        <div
          role="radiogroup"
          aria-label="Contribution timing"
          className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
        >
          {(
            [
              { id: "end" as const, label: "End of each month" },
              { id: "beginning" as const, label: "Beginning of each month" },
            ]
          ).map((option) => {
            const selected = timing === option.id;
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
                  name={timingGroupId}
                  value={option.id}
                  checked={selected}
                  onChange={() => setTiming(option.id)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={compoundingId}
          className="text-[12px] font-semibold text-zinc-600"
        >
          Interest is compounded
        </label>
        <select
          id={compoundingId}
          value={compounding}
          onChange={(e) =>
            setCompounding(e.target.value as CompoundingFrequency)
          }
          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
        >
          {COMPOUNDING_OPTIONS.filter((o) => o.id !== "semiannually").map(
            (o) => (
              <option key={o.id} value={o.id}>
                {o.label.replace(" (365)", "")}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-[13px] text-foreground">
          <input
            id={inflationCheckId}
            type="checkbox"
            checked={adjustInflation}
            onChange={(e) => setAdjustInflation(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border text-[#B45309] focus:ring-[#B45309]"
          />
          <span>Adjust my goal for inflation</span>
        </label>
        {adjustInflation ? (
          <div className="flex flex-col gap-1.5 pl-6">
            <label
              htmlFor={inflationId}
              className="text-[12px] font-semibold text-zinc-600"
            >
              Annual inflation (%)
            </label>
            <input
              id={inflationId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={inflation}
              onChange={(e) => setInflation(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

function GrowthChart({
  yearly,
  startingCents,
  money,
}: {
  yearly: YearBreakdownRow[];
  startingCents: number;
  money: (cents: number) => string;
}) {
  if (yearly.length === 0) return null;
  const max = Math.max(...yearly.map((y) => y.endingBalanceCents), 1);
  const last = yearly[yearly.length - 1]!;
  const interestTotal = yearly.reduce((s, r) => s + r.interestCents, 0);

  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold text-foreground">
        Savings growth by year
      </h3>
      <p className="sr-only">
        Stacked bar chart of starting amount, contributions, and interest. After{" "}
        {last.year} {last.year === 1 ? "year" : "years"} your savings reach{" "}
        {money(last.endingBalanceCents)}: {money(last.contributedCents)} from
        contributions and {money(interestTotal)} from interest.
      </p>
      <p className="text-[12px] text-zinc-600">
        After {last.year} {last.year === 1 ? "year" : "years"} your savings
        reach {money(last.endingBalanceCents)}: {money(last.contributedCents)}{" "}
        from contributions and {money(interestTotal)} from interest (solid =
        deposits, hatched = interest).
      </p>
      <div className="space-y-1.5" aria-hidden="true">
        {yearly.map((row) => {
          const width = (row.endingBalanceCents / max) * 100;
          const depositShare =
            row.endingBalanceCents > 0
              ? ((startingCents + row.contributedCents) /
                  row.endingBalanceCents) *
                100
              : 0;
          return (
            <div key={row.year} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-zinc-600">
                Y{row.year}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-stone-100">
                <div className="flex h-full" style={{ width: `${width}%` }}>
                  <div
                    className="h-full bg-zinc-800"
                    style={{ width: `${Math.min(100, depositShare)}%` }}
                  />
                  <div
                    className="h-full bg-stone-400"
                    style={{
                      width: `${Math.max(0, 100 - depositShare)}%`,
                      backgroundImage:
                        "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-zinc-600">
        <span className="mr-3 inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 bg-zinc-800" aria-hidden="true" />
          Starting + contributions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 bg-stone-400"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
            }}
            aria-hidden="true"
          />
          Interest
        </span>
      </p>
    </div>
  );
}

function YearlyTable({
  yearly,
  money,
}: {
  yearly: YearBreakdownRow[];
  money: (cents: number) => string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold text-foreground">
        Yearly breakdown
      </h3>
      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="min-w-[28rem] w-full border-collapse text-left text-[13px]">
          <caption className="sr-only">
            Yearly savings summary: contributions, interest, and ending balance.
          </caption>
          <thead>
            <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
              <th scope="col" className="px-3 py-2">
                Year
              </th>
              <th scope="col" className="px-3 py-2">
                Total contributed
              </th>
              <th scope="col" className="px-3 py-2">
                Interest that year
              </th>
              <th scope="col" className="px-3 py-2">
                Ending balance
              </th>
            </tr>
          </thead>
          <tbody>
            {yearly.map((row) => (
              <tr
                key={row.year}
                className="border-b border-border/60 last:border-0"
              >
                <th
                  scope="row"
                  className="px-3 py-2 font-semibold tabular-nums text-foreground"
                >
                  {row.year}
                </th>
                <td className="px-3 py-2 tabular-nums text-zinc-800">
                  {money(row.contributedCents)}
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-800">
                  {money(row.interestCents)}
                </td>
                <td className="px-3 py-2 font-semibold tabular-nums text-foreground">
                  {money(row.endingBalanceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
