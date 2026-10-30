"use client";

import { useId, useMemo, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";
import {
  CURRENCY_OPTIONS,
  formatMoney,
  parseDecimal,
} from "@/lib/utils/money";
import {
  PAY_PERIODS,
  calculateSalaryHourly,
  formatPayNumber,
  type PayPeriod,
} from "@/lib/utils/salary-hourly";

const financeTheme = CATEGORY_THEME[getCategoryTheme("finance")];

const RESULT_ROWS: { id: PayPeriod; label: string }[] = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Bi-weekly (every two weeks)" },
  { id: "semimonthly", label: "Semi-monthly (twice a month)" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

/**
 * Convert pay between hourly, salary, and other common periods (gross only).
 */
export function SalaryToHourlyCalculator() {
  const [amountRaw, setAmountRaw] = useState("20");
  const [period, setPeriod] = useState<PayPeriod>("hourly");
  const [hoursRaw, setHoursRaw] = useState("40");
  const [daysRaw, setDaysRaw] = useState("5");
  const [weeksRaw, setWeeksRaw] = useState("52");
  const [unpaidRaw, setUnpaidRaw] = useState("");
  const [currencyId, setCurrencyId] = useState("USD");

  const amountId = useId();
  const periodId = useId();
  const hoursId = useId();
  const daysId = useId();
  const weeksId = useId();
  const unpaidId = useId();
  const currencyIdInput = useId();

  const unpaidParsed = unpaidRaw.trim() === "" ? null : parseDecimal(unpaidRaw);

  const result = useMemo(
    () =>
      calculateSalaryHourly({
        amount: parseDecimal(amountRaw),
        period,
        hoursPerWeek: parseDecimal(hoursRaw),
        daysPerWeek: parseDecimal(daysRaw),
        weeksPerYear: parseDecimal(weeksRaw),
        unpaidWeeksOff: unpaidParsed,
      }),
    [amountRaw, period, hoursRaw, daysRaw, weeksRaw, unpaidParsed],
  );

  function handleReset() {
    setAmountRaw("20");
    setPeriod("hourly");
    setHoursRaw("40");
    setDaysRaw("5");
    setWeeksRaw("52");
    setUnpaidRaw("");
    setCurrencyId("USD");
  }

  const money = (value: number) => formatMoney(value, currencyId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="sth-input-heading"
          className="flex flex-col gap-4 lg:col-span-5"
        >
          <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2
                id="sth-input-heading"
                className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
              >
                <Wallet
                  className={`size-5 ${financeTheme.text}`}
                  aria-hidden="true"
                />
                Pay details
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={amountId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Pay amount
                </label>
                <input
                  id={amountId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value)}
                  className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={periodId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Pay period
                </label>
                <select
                  id={periodId}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as PayPeriod)}
                  className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                >
                  {PAY_PERIODS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={currencyIdInput}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Currency (display only)
                </label>
                <select
                  id={currencyIdInput}
                  value={currencyId}
                  onChange={(e) => setCurrencyId(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                >
                  {CURRENCY_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={hoursId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Hours per week
                </label>
                <input
                  id={hoursId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={hoursRaw}
                  onChange={(e) => setHoursRaw(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={daysId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Days per week
                </label>
                <input
                  id={daysId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={daysRaw}
                  onChange={(e) => setDaysRaw(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={weeksId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Weeks worked per year
                </label>
                <input
                  id={weeksId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={weeksRaw}
                  onChange={(e) => setWeeksRaw(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={unpaidId}
                  className="text-[12px] font-semibold text-zinc-700"
                >
                  Unpaid weeks off per year (optional)
                </label>
                <input
                  id={unpaidId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={unpaidRaw}
                  onChange={(e) => setUnpaidRaw(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-finance/40 focus:border-cat-finance focus:ring-2 focus:ring-cat-finance/20"
                />
              </div>
            </div>

            <p className="text-[12px] leading-relaxed text-zinc-700">
              Figures are gross pay estimates only. Your inputs stay in your
              browser. They are never sent to our servers or stored.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="sth-outcome-heading"
          className="flex min-h-88 flex-col gap-4 lg:col-span-7"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h2
                id="sth-outcome-heading"
                className="text-[15px] font-semibold text-foreground"
              >
                Converted pay
              </h2>
              <span
                className={`ui-label rounded-md px-2.5 py-1 text-[11px] text-white ${financeTheme.solid}`}
              >
                {PAY_PERIODS.find((item) => item.id === period)?.shortLabel}
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
                    Yearly (gross)
                  </p>
                  <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-5xl">
                    {money(result.amounts.yearly)}
                  </p>
                  <p className="mt-2 text-[15px] text-zinc-700">
                    Based on{" "}
                    <strong className="font-semibold tabular-nums text-foreground">
                      {formatPayNumber(result.hoursPerWeek)}
                    </strong>{" "}
                    hours/week,{" "}
                    <strong className="font-semibold tabular-nums text-foreground">
                      {formatPayNumber(result.daysPerWeek)}
                    </strong>{" "}
                    days/week, and{" "}
                    <strong className="font-semibold tabular-nums text-foreground">
                      {formatPayNumber(result.weeksWorked)}
                    </strong>{" "}
                    weeks worked.
                  </p>
                </div>

                <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                  {result.working}
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-[18rem] w-full border-collapse text-left text-[14px]">
                    <caption className="sr-only">
                      Pay converted to each common period
                    </caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 pr-3 font-semibold text-foreground">
                          Period
                        </th>
                        <th className="py-2 text-right font-semibold text-foreground">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {RESULT_ROWS.map((row) => {
                        const highlighted = row.id === result.inputPeriod;
                        const value = result.amounts[row.id];
                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-border/70 ${
                              highlighted ? "bg-cat-finance-soft" : ""
                            }`}
                          >
                            <td className="py-2.5 pr-3 text-zinc-700">
                              {row.label}
                              {highlighted ? (
                                <span className="ml-2 text-[11px] font-semibold text-cat-finance">
                                  Entered
                                </span>
                              ) : null}
                            </td>
                            <td className="py-2.5 text-right font-semibold tabular-nums text-foreground">
                              {money(value)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-[12px] leading-relaxed text-zinc-700">
                  General information and estimates only. Not financial, tax or
                  employment advice. Taxes, deductions, overtime, bonuses,
                  benefits, and unpaid leave rules are not included. Employers
                  may calculate pay differently.
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
