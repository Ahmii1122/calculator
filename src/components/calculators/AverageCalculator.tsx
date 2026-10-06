"use client";

import { useId, useState } from "react";
import { RefreshCw, Sigma } from "lucide-react";
import {
  calculateAverageStats,
  formatStatNumber,
  parseNumberList,
  type AverageStats,
} from "@/lib/utils/average";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";

const mathTheme = CATEGORY_THEME[getCategoryTheme("math")];

type StatCellProps = {
  label: string;
  value: string;
  hint?: string;
};

function StatCell({ label, value, hint }: StatCellProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-3">
      <dt className="text-[12px] font-semibold text-zinc-600">{label}</dt>
      <dd className="mt-1 text-[17px] font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </dd>
      {hint ? (
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function buildAnnouncement(stats: AverageStats): string {
  return [
    `Mean ${formatStatNumber(stats.mean)}`,
    `median ${formatStatNumber(stats.median)}`,
    `mode ${stats.mode.label}`,
    `range ${formatStatNumber(stats.range)}`,
    `${stats.count} numbers`,
  ].join(", ");
}

/**
 * Interactive average / mean–median–mode calculator — live stats from a number list.
 */
export function AverageCalculator() {
  const [raw, setRaw] = useState("");
  const inputId = useId();
  const helperId = useId();
  const skipId = useId();

  const { numbers, skipped } = parseNumberList(raw);
  const stats = calculateAverageStats(raw);

  function handleReset() {
    setRaw("");
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="avg-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="avg-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Sigma
                className={`size-5 ${mathTheme.text}`}
                aria-hidden="true"
              />
              Enter your numbers
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="ui-label inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={inputId}
              className="text-[13px] font-semibold text-foreground"
            >
              Number list
            </label>
            <textarea
              id={inputId}
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              rows={8}
              spellCheck={false}
              autoComplete="off"
              aria-describedby={`${helperId}${skipped > 0 ? ` ${skipId}` : ""}`}
              placeholder={"e.g. 12, 15, 18, 21\nor one number per line"}
              className="w-full resize-y rounded-lg border border-border/80 bg-background px-3.5 py-3 font-mono text-[14px] leading-relaxed text-foreground outline-none transition placeholder:text-zinc-500 hover:border-zinc-400 focus:border-zinc-900 focus:bg-panel focus:ring-2 focus:ring-zinc-900/15"
            />
            <p id={helperId} className="text-[12px] leading-relaxed text-zinc-600">
              Separate numbers with commas, spaces, or new lines. Blank lines and
              non-numeric tokens are skipped.
            </p>
            {skipped > 0 ? (
              <p
                id={skipId}
                className="text-[12px] font-medium text-zinc-600"
                role="status"
              >
                {skipped === 1
                  ? "1 value skipped"
                  : `${skipped} values skipped`}
              </p>
            ) : null}
            {numbers.length > 0 ? (
              <p className="text-[12px] font-semibold text-zinc-700">
                {numbers.length} valid{" "}
                {numbers.length === 1 ? "number" : "numbers"} entered
              </p>
            ) : null}
          </div>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Calculations run in your browser — nothing is stored or sent to a
            server.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="avg-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="avg-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Results
            </span>
            {stats ? (
              <span className="text-[12px] text-zinc-600">
                Live from {stats.count}{" "}
                {stats.count === 1 ? "value" : "values"}
              </span>
            ) : null}
          </div>

          {stats ? (
            <div className="animate-fade-in flex flex-col gap-5">
              <p className="sr-only">{buildAnnouncement(stats)}</p>

              <div>
                <p className="text-[13px] font-semibold text-zinc-600">
                  Mean (average)
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-950 tabular-nums sm:text-5xl">
                  {formatStatNumber(stats.mean)}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <StatCell
                  label="Median"
                  value={formatStatNumber(stats.median)}
                />
                <StatCell label="Mode" value={stats.mode.label} />
                <StatCell
                  label="Range"
                  value={formatStatNumber(stats.range)}
                  hint="Max − min"
                />
                <StatCell label="Count" value={String(stats.count)} />
                <StatCell label="Sum" value={formatStatNumber(stats.sum)} />
                <StatCell label="Min" value={formatStatNumber(stats.min)} />
                <StatCell label="Max" value={formatStatNumber(stats.max)} />
                <StatCell
                  label="Geometric mean"
                  value={
                    stats.geometricMean !== null
                      ? formatStatNumber(stats.geometricMean)
                      : "N/A"
                  }
                  hint={
                    stats.geometricMean === null
                      ? "Requires all positive numbers"
                      : undefined
                  }
                />
                <StatCell
                  label="Population std. dev."
                  value={formatStatNumber(stats.populationStdDev)}
                  hint="÷ n (whole set)"
                />
                <StatCell
                  label="Sample std. dev."
                  value={
                    stats.sampleStdDev !== null
                      ? formatStatNumber(stats.sampleStdDev)
                      : "N/A"
                  }
                  hint={
                    stats.sampleStdDev === null
                      ? "Needs 2+ numbers (÷ n−1)"
                      : "÷ n−1 (sample)"
                  }
                />
                <StatCell
                  label="Population variance"
                  value={formatStatNumber(stats.populationVariance)}
                />
                <StatCell
                  label="Sample variance"
                  value={
                    stats.sampleVariance !== null
                      ? formatStatNumber(stats.sampleVariance)
                      : "N/A"
                  }
                />
              </dl>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed text-zinc-600">
              Enter a list of numbers to see the mean (average), median, mode,
              range, geometric mean, and standard deviation update live.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
