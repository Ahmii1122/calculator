"use client";

import { useEffect, useId, useState } from "react";
import { Percent, RefreshCw } from "lucide-react";
import {
  COMPOUNDING_OPTIONS,
  CONTRIBUTION_FREQUENCY_OPTIONS,
  RATE_HIGH_WARNING,
  calculateCompoundInterest,
  type CompoundingFrequency,
  type ContributionFrequency,
  type ContributionTiming,
  type YearBreakdownRow,
} from "@/lib/utils/compound-interest";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  fromCents,
  parseDecimal,
  parseWhole,
} from "@/lib/utils/money";

const ACCENT = "#B45309";
const DISCLAIMER =
  "This calculator provides general information and illustrative estimates only. It is not financial or investment advice, and it does not predict future returns. Talk to a qualified financial adviser about your own situation.";

/**
 * Interactive compound interest / future-value calculator — contributions,
 * compounding frequency, optional inflation, yearly breakdown.
 */
export function CompoundInterestCalculator() {
  const [initial, setInitial] = useState("10000");
  const [contribution, setContribution] = useState("100");
  const [contribFreq, setContribFreq] =
    useState<ContributionFrequency>("monthly");
  const [timing, setTiming] = useState<ContributionTiming>("end");
  const [contribIncrease, setContribIncrease] = useState("0");
  const [rate, setRate] = useState("5");
  const [compounding, setCompounding] =
    useState<CompoundingFrequency>("monthly");
  const [years, setYears] = useState("10");
  const [months, setMonths] = useState("0");
  const [inflation, setInflation] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");
  /** Collapsed "More options" on small screens only; always expanded from md up. */
  const [moreOpen, setMoreOpen] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);

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

  const timingGroupId = useId();
  const initialId = useId();
  const contribId = useId();
  const contribFreqId = useId();
  const rateId = useId();
  const compoundingId = useId();
  const yearsId = useId();
  const monthsId = useId();
  const currencyIdInput = useId();
  const increaseId = useId();
  const inflationId = useId();

  const calc = calculateCompoundInterest({
    initialAmount: parseDecimal(initial),
    contribution: parseDecimal(contribution),
    contributionFrequency: contribFreq,
    contributionTiming: timing,
    contributionIncreasePercent: parseDecimal(contribIncrease) ?? 0,
    annualRatePercent: parseDecimal(rate),
    compounding,
    years: parseWhole(years),
    months: parseWhole(months),
    inflationPercent: inflation.trim() === "" ? null : parseDecimal(inflation),
  });

  function handleReset() {
    setInitial("10000");
    setContribution("100");
    setContribFreq("monthly");
    setTiming("end");
    setContribIncrease("0");
    setRate("5");
    setCompounding("monthly");
    setYears("10");
    setMonths("0");
    setInflation("");
    setCurrencyId("USD");
  }

  const money = (cents: number) => formatMoney(fromCents(cents), currencyId);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="ci-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="ci-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Percent className="size-5 text-[#B45309]" aria-hidden="true" />
              Growth details
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

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={initialId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Initial amount
              </label>
              <input
                id={initialId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={initial}
                onChange={(e) => setInitial(e.target.value)}
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

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={contribId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Contribution amount
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
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={contribFreqId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Contribution frequency
              </label>
              <select
                id={contribFreqId}
                value={contribFreq}
                onChange={(e) =>
                  setContribFreq(e.target.value as ContributionFrequency)
                }
                className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              >
                {CONTRIBUTION_FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                  { id: "end" as const, label: "End of each period" },
                  { id: "beginning" as const, label: "Beginning of each period" },
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
              An assumed rate you choose — real returns vary and can be
              negative.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={compoundingId}
              className="text-[12px] font-semibold text-zinc-600"
            >
              Compounded
            </label>
            <select
              id={compoundingId}
              value={compounding}
              onChange={(e) =>
                setCompounding(e.target.value as CompoundingFrequency)
              }
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
            >
              {COMPOUNDING_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

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
                  <OptionalFields
                    increaseId={increaseId}
                    inflationId={inflationId}
                    contribIncrease={contribIncrease}
                    setContribIncrease={setContribIncrease}
                    inflation={inflation}
                    setInflation={setInflation}
                  />
                </div>
              ) : null}
            </details>
          ) : (
            <div className="space-y-3.5">
              <OptionalFields
                increaseId={increaseId}
                inflationId={inflationId}
                contribIncrease={contribIncrease}
                setContribIncrease={setContribIncrease}
                inflation={inflation}
                setInflation={setInflation}
              />
            </div>
          )}

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Your numbers stay in your browser. Nothing is stored or sent.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="ci-outcome-heading"
        className="flex min-h-[28rem] flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-[28rem] flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="ci-outcome-heading"
              className="ui-label rounded-md bg-[#B45309] px-2.5 py-1 text-[11px] text-white"
            >
              Future value
            </span>
            <span className="text-[12px] text-zinc-600">
              {
                COMPOUNDING_OPTIONS.find((o) => o.id === compounding)?.label
              }{" "}
              compounding
            </span>
          </div>

          {calc.ok ? (
            <div className="animate-fade-in flex flex-col gap-5">
              {calc.result.highRateWarning ? (
                <p className="text-[13px] leading-relaxed text-zinc-700">
                  This assumed rate is above {RATE_HIGH_WARNING}%. That looks
                  unusually high for many long-term scenarios — results are
                  illustrative only.
                </p>
              ) : null}

              <div>
                <p className="text-[13px] font-semibold text-zinc-600">
                  Future value
                </p>
                <p
                  className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl"
                  style={{ color: ACCENT }}
                >
                  {money(calc.result.futureValueCents)}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Total deposited
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {money(calc.result.totalDepositedCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Total interest earned
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {money(calc.result.totalInterestCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Interest share of balance
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {calc.result.interestSharePercent.toLocaleString("en-US", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Effective annual yield (APY)
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {calc.result.apyPercent.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    %
                  </dd>
                </div>
              </dl>

              {calc.result.yearsToDouble !== null ? (
                <p className="text-[14px] leading-relaxed text-zinc-700">
                  At this rate, money roughly doubles in about{" "}
                  <strong className="font-semibold tabular-nums">
                    {calc.result.yearsToDouble.toLocaleString("en-US", {
                      maximumFractionDigits: 1,
                    })}
                  </strong>{" "}
                  years (ignoring contributions).
                </p>
              ) : null}

              {calc.result.inflationAdjustedCents !== null &&
              calc.result.inflationPercent !== null ? (
                <p className="text-[14px] leading-relaxed text-zinc-700">
                  About{" "}
                  <strong className="font-semibold tabular-nums">
                    {money(calc.result.inflationAdjustedCents)}
                  </strong>{" "}
                  in today&apos;s money, assuming{" "}
                  <strong className="font-semibold tabular-nums">
                    {calc.result.inflationPercent.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </strong>{" "}
                  yearly inflation.
                </p>
              ) : null}

              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                <span className="ui-label mb-0.5 block text-[11px] text-zinc-600">
                  Worked step
                </span>
                {calc.result.workingStep}
              </p>

              <GrowthChart
                yearly={calc.result.yearly}
                currencyId={currencyId}
                futureValue={money(calc.result.futureValueCents)}
                interest={money(calc.result.totalInterestCents)}
              />

              <YearlyTable yearly={calc.result.yearly} money={money} />

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

function OptionalFields({
  increaseId,
  inflationId,
  contribIncrease,
  setContribIncrease,
  inflation,
  setInflation,
}: {
  increaseId: string;
  inflationId: string;
  contribIncrease: string;
  setContribIncrease: (value: string) => void;
  inflation: string;
  setInflation: (value: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={increaseId}
          className="text-[12px] font-semibold text-zinc-600"
        >
          Increase contributions by (% each year)
        </label>
        <input
          id={increaseId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={contribIncrease}
          onChange={(e) => setContribIncrease(e.target.value)}
          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inflationId}
          className="text-[12px] font-semibold text-zinc-600"
        >
          Expected annual inflation (%) — optional
        </label>
        <input
          id={inflationId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={inflation}
          onChange={(e) => setInflation(e.target.value)}
          placeholder="Leave blank to skip"
          className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
        />
      </div>
    </>
  );
}

function GrowthChart({
  yearly,
  futureValue,
  interest,
}: {
  yearly: YearBreakdownRow[];
  currencyId: string;
  futureValue: string;
  interest: string;
}) {
  if (yearly.length === 0) return null;
  const max = Math.max(...yearly.map((y) => y.endingBalanceCents), 1);
  const last = yearly[yearly.length - 1]!;

  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold text-foreground">
        Balance growth by year
      </h3>
      <p className="sr-only">
        Stacked bar chart of deposits and interest over time. After year{" "}
        {last.year} the balance is {futureValue}, of which {interest} is
        interest.
      </p>
      <p className="text-[12px] text-zinc-600">
        After year {last.year} the balance is {futureValue}, of which {interest}{" "}
        is interest (solid = deposits, hatched = interest).
      </p>
      <div className="space-y-1.5" aria-hidden="true">
        {yearly.map((row) => {
          const width = (row.endingBalanceCents / max) * 100;
          const depositShare =
            row.endingBalanceCents > 0
              ? (row.depositedCents / row.endingBalanceCents) * 100
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
          Deposits
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
            Yearly compound interest summary: deposits, interest, and ending
            balance.
          </caption>
          <thead>
            <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
              <th scope="col" className="px-3 py-2">
                Year
              </th>
              <th scope="col" className="px-3 py-2">
                Total deposited
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
              <tr key={row.year} className="border-b border-border/60 last:border-0">
                <th
                  scope="row"
                  className="px-3 py-2 font-semibold tabular-nums text-foreground"
                >
                  {row.year}
                </th>
                <td className="px-3 py-2 tabular-nums text-zinc-800">
                  {money(row.depositedCents)}
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
