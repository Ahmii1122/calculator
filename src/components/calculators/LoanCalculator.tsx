"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { DollarSign, RefreshCw } from "lucide-react";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  CURRENCY_OPTIONS,
  RATE_HIGH_WARNING,
  addMonthsLocal,
  calculateLoan,
  firstOfNextMonth,
  formatMoney,
  fromCents,
  parseDecimal,
  parseWhole,
  type InterestMethod,
  type LoanScheduleResult,
} from "@/lib/utils/loan";

function toDateInputValueLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ACCENT = "#B45309";

/**
 * Interactive loan / EMI calculator — reducing or flat rate, optional extras,
 * yearly amortization with expandable months.
 */
export function LoanCalculator() {
  const [amount, setAmount] = useState("100000");
  const [currencyId, setCurrencyId] = useState("USD");
  const [rate, setRate] = useState("6");
  const [years, setYears] = useState("30");
  const [months, setMonths] = useState("0");
  const [method, setMethod] = useState<InterestMethod>("reducing");
  const [extra, setExtra] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [startReady, setStartReady] = useState(false);

  const methodGroupId = useId();
  const amountId = useId();
  const currencyIdInput = useId();
  const rateId = useId();
  const yearsId = useId();
  const monthsId = useId();
  const extraId = useId();

  useEffect(() => {
    const next = firstOfNextMonth(new Date());
    setStartDate(toDateInputValueLocal(next));
    setStartReady(true);
  }, []);

  const result = calculateLoan({
    amount: parseDecimal(amount),
    annualRatePercent: parseDecimal(rate),
    years: parseWhole(years),
    months: parseWhole(months),
    method,
    extraMonthly: parseDecimal(extra) ?? 0,
  });

  const startParsed = useMemo(() => {
    if (!startDate) return null;
    const [y, m, d] = startDate.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }, [startDate]);

  function handleReset() {
    setAmount("100000");
    setCurrencyId("USD");
    setRate("6");
    setYears("30");
    setMonths("0");
    setMethod("reducing");
    setExtra("0");
    setStartDate(toDateInputValueLocal(firstOfNextMonth(new Date())));
  }

  const money = (cents: number) => formatMoney(fromCents(cents), currencyId);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="loan-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="loan-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <DollarSign className="size-5 text-[#B45309]" aria-hidden="true" />
              Loan details
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
              Interest method
            </legend>
            <div
              role="radiogroup"
              aria-label="Interest calculation method"
              className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
            >
              {(
                [
                  {
                    id: "reducing" as const,
                    label: "Reducing balance (standard)",
                  },
                  { id: "flat" as const, label: "Flat rate" },
                ]
              ).map((option) => {
                const selected = method === option.id;
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
                      name={methodGroupId}
                      value={option.id}
                      checked={selected}
                      onChange={() => setMethod(option.id)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
              Reducing balance charges interest on the remaining principal each
              month. Flat rate charges interest on the original amount for the
              full term, then divides that total into equal payments.
            </p>
          </fieldset>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label
                htmlFor={amountId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Loan amount
              </label>
              <input
                id={amountId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={yearsId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Term (years)
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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={extraId}
              className="text-[12px] font-semibold text-zinc-600"
            >
              Extra monthly payment (optional)
            </label>
            <input
              id={extraId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>

          <div className="min-h-[4.5rem]">
            {startReady ? (
              <DatePickerField
                id="loan-start-date"
                label="First payment date (optional)"
                value={startDate}
                onChange={setStartDate}
              />
            ) : (
              <div className="space-y-1.5" aria-hidden="true">
                <div className="h-3 w-40 rounded bg-stone-100" />
                <div className="h-10 rounded-lg border border-border/80 bg-background" />
              </div>
            )}
          </div>

          <p className="text-[12px] leading-relaxed text-zinc-600">
            Payments are monthly only.
          </p>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Your inputs stay in your browser. They are never sent to our servers
            or stored.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="loan-outcome-heading"
        className="flex min-h-[28rem] flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-[28rem] flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="loan-outcome-heading"
              className="ui-label rounded-md bg-[#B45309] px-2.5 py-1 text-[11px] text-white"
            >
              Monthly payment
            </span>
            <span className="text-[12px] text-zinc-600">
              {method === "reducing" ? "Reducing balance" : "Flat rate"}
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-5">
              {result.highRateWarning ? (
                <p className="text-[13px] leading-relaxed text-zinc-700">
                  This rate is above {RATE_HIGH_WARNING}%. That looks unusually
                  high for many consumer loans — double-check the figure.
                </p>
              ) : null}

              <div>
                <p className="text-[13px] font-semibold text-zinc-600">
                  Monthly payment
                </p>
                <p
                  className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl"
                  style={{ color: ACCENT }}
                >
                  {money(result.schedule.monthlyPaymentCents)}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Total interest
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.schedule.totalInterestCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Total amount paid
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {money(result.schedule.totalPaidCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Number of payments
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {result.schedule.paymentCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-zinc-600">
                    Payoff date
                  </dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                    {startParsed
                      ? format(
                          addMonthsLocal(
                            startParsed,
                            result.schedule.paymentCount - 1,
                          ),
                          "MMM d, yyyy",
                        )
                      : "Add a start date"}
                  </dd>
                </div>
              </dl>

              {result.monthsSaved !== null &&
              result.interestSavedCents !== null ? (
                <p className="text-[14px] leading-relaxed text-zinc-700">
                  With the extra monthly payment: about{" "}
                  <strong className="font-semibold tabular-nums">
                    {result.monthsSaved}
                  </strong>{" "}
                  {result.monthsSaved === 1 ? "month" : "months"} sooner and{" "}
                  <strong className="font-semibold tabular-nums">
                    {money(result.interestSavedCents)}
                  </strong>{" "}
                  less interest than the baseline schedule.
                </p>
              ) : null}

              {result.schedule.equivalentReducingRatePercent !== null ? (
                <p className="text-[13px] leading-relaxed text-zinc-600">
                  Estimated equivalent reducing-balance rate: about{" "}
                  <strong className="font-semibold tabular-nums text-foreground">
                    {result.schedule.equivalentReducingRatePercent.toLocaleString(
                      "en-US",
                      { maximumFractionDigits: 3 },
                    )}
                    %
                  </strong>{" "}
                  per year (approximate).
                </p>
              ) : null}

              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                <span className="ui-label mb-0.5 block text-[11px] text-zinc-600">
                  Worked step
                </span>
                {result.schedule.workingStep}
              </p>

              <PaymentChart
                yearly={result.schedule.yearly}
                currencyId={currencyId}
              />

              <AmortizationTable
                schedule={result.schedule}
                startDate={startParsed}
                money={money}
              />

              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and estimates only.
                It is not financial advice or a loan offer. Check the terms with
                your lender or a qualified financial adviser.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-center gap-3">
              <p className="text-[15px] leading-relaxed text-zinc-600">
                {result.message}
              </p>
              <p className="text-[12px] leading-relaxed text-zinc-600">
                This calculator provides general information and estimates only.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PaymentChart({
  yearly,
  currencyId,
}: {
  yearly: { year: number; principalCents: number; interestCents: number }[];
  currencyId: string;
}) {
  if (yearly.length === 0) return null;
  const max = Math.max(
    ...yearly.map((y) => y.principalCents + y.interestCents),
    1,
  );
  const first = yearly[0]!;
  const firstTotal = first.principalCents + first.interestCents || 1;
  const firstPrincipalPct = Math.round(
    (first.principalCents / firstTotal) * 100,
  );

  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold text-foreground">
        Principal vs interest by year
      </h3>
      <p className="sr-only">
        Stacked bar chart of principal and interest paid each year. In year{" "}
        {first.year}, about {firstPrincipalPct}% of payments go to principal.
      </p>
      <p className="text-[12px] text-zinc-600">
        In year {first.year}, about {firstPrincipalPct}% of payments go to
        principal (solid bars = principal, hatched = interest).
      </p>
      <div className="space-y-1.5" aria-hidden="true">
        {yearly.map((row) => {
          const total = row.principalCents + row.interestCents;
          const width = (total / max) * 100;
          const principalShare =
            total > 0 ? (row.principalCents / total) * 100 : 0;
          return (
            <div key={row.year} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-zinc-600">
                Y{row.year}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-stone-100">
                <div
                  className="flex h-full"
                  style={{ width: `${width}%` }}
                >
                  <div
                    className="h-full bg-zinc-800"
                    style={{ width: `${principalShare}%` }}
                    title={`Principal ${formatMoney(fromCents(row.principalCents), currencyId)}`}
                  />
                  <div
                    className="h-full bg-stone-400"
                    style={{
                      width: `${100 - principalShare}%`,
                      backgroundImage:
                        "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
                    }}
                    title={`Interest ${formatMoney(fromCents(row.interestCents), currencyId)}`}
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
          Principal
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

function AmortizationTable({
  schedule,
  startDate,
  money,
}: {
  schedule: LoanScheduleResult;
  startDate: Date | null;
  money: (cents: number) => string;
}) {
  const [openYears, setOpenYears] = useState<Set<number>>(() => new Set());

  function toggleYear(year: number, open: boolean) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (open) next.add(year);
      else next.delete(year);
      return next;
    });
  }

  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold text-foreground">
        Amortization schedule
      </h3>
      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="min-w-[28rem] w-full border-collapse text-left text-[13px]">
          <caption className="sr-only">
            Yearly loan amortization summary. Expand a year for monthly rows.
          </caption>
          <thead>
            <tr className="border-b border-border bg-stone-50 text-[11px] font-semibold text-zinc-700">
              <th scope="col" className="px-3 py-2">
                Year
              </th>
              <th scope="col" className="px-3 py-2">
                Principal
              </th>
              <th scope="col" className="px-3 py-2">
                Interest
              </th>
              <th scope="col" className="px-3 py-2">
                Ending balance
              </th>
            </tr>
          </thead>
          <tbody>
            {schedule.yearly.map((year) => {
              const isOpen = openYears.has(year.year);
              return (
                <tr key={year.year} className="border-b border-border/60">
                  <td colSpan={4} className="p-0">
                    <details
                      className="group"
                      open={isOpen}
                      onToggle={(e) =>
                        toggleYear(year.year, e.currentTarget.open)
                      }
                    >
                      <summary className="grid cursor-pointer list-none grid-cols-4 gap-0 px-0 py-0 [&::-webkit-details-marker]:hidden">
                        <span
                          role="rowheader"
                          className="px-3 py-2 font-semibold tabular-nums text-foreground"
                        >
                          Year {year.year}
                        </span>
                        <span className="px-3 py-2 tabular-nums text-zinc-800">
                          {money(year.principalCents)}
                        </span>
                        <span className="px-3 py-2 tabular-nums text-zinc-800">
                          {money(year.interestCents)}
                        </span>
                        <span className="px-3 py-2 font-semibold tabular-nums text-foreground">
                          {money(year.endingBalanceCents)}
                        </span>
                      </summary>
                      {isOpen ? (
                        <YearMonthRows
                          schedule={schedule}
                          year={year}
                          startDate={startDate}
                          money={money}
                        />
                      ) : null}
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function YearMonthRows({
  schedule,
  year,
  startDate,
  money,
}: {
  schedule: LoanScheduleResult;
  year: LoanScheduleResult["yearly"][number];
  startDate: Date | null;
  money: (cents: number) => string;
}) {
  const monthRows = schedule.schedule.filter(
    (row) =>
      row.paymentNumber >= year.fromPayment &&
      row.paymentNumber <= year.toPayment,
  );

  return (
    <div className="overflow-x-auto border-t border-border/50 bg-stone-50/80">
      <table className="min-w-[32rem] w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-border/60 text-[10px] font-semibold text-zinc-600">
            <th scope="col" className="px-3 py-1.5">
              #
            </th>
            {startDate ? (
              <th scope="col" className="px-3 py-1.5">
                Date
              </th>
            ) : null}
            <th scope="col" className="px-3 py-1.5">
              Payment
            </th>
            <th scope="col" className="px-3 py-1.5">
              Principal
            </th>
            <th scope="col" className="px-3 py-1.5">
              Interest
            </th>
            <th scope="col" className="px-3 py-1.5">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {monthRows.map((row) => (
            <tr
              key={row.paymentNumber}
              className="border-b border-border/40 last:border-0"
            >
              <th
                scope="row"
                className="px-3 py-1.5 font-medium tabular-nums text-zinc-700"
              >
                {row.paymentNumber}
              </th>
              {startDate ? (
                <td className="px-3 py-1.5 tabular-nums text-zinc-700">
                  {format(
                    addMonthsLocal(startDate, row.monthIndex),
                    "MMM d, yyyy",
                  )}
                </td>
              ) : null}
              <td className="px-3 py-1.5 tabular-nums text-zinc-800">
                {money(row.paymentCents)}
              </td>
              <td className="px-3 py-1.5 tabular-nums text-zinc-800">
                {money(row.principalCents)}
              </td>
              <td className="px-3 py-1.5 tabular-nums text-zinc-800">
                {money(row.interestCents)}
              </td>
              <td className="px-3 py-1.5 font-semibold tabular-nums text-foreground">
                {money(row.balanceCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
