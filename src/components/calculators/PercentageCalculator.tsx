"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Percent, RefreshCw } from "lucide-react";
import {
  calculatePercentage,
  parseDecimalInput,
  type AdjustDirection,
  type PercentageMode,
} from "@/lib/utils/percentage";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";

const mathTheme = CATEGORY_THEME[getCategoryTheme("math")];

const MODES: {
  id: PercentageMode;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: "percent-of",
    label: "What is X% of Y?",
    shortLabel: "% of a number",
  },
  {
    id: "is-what-percent",
    label: "X is what % of Y?",
    shortLabel: "X is what %",
  },
  {
    id: "percent-change",
    label: "% change from X to Y",
    shortLabel: "% change",
  },
  {
    id: "adjust-by-percent",
    label: "Increase / decrease X by Y%",
    shortLabel: "Add or subtract %",
  },
  {
    id: "find-whole",
    label: "X is Y% of what?",
    shortLabel: "Find the whole",
  },
];

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
};

function NumberField({ id, label, value, onChange, suffix }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-semibold text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-lg border border-border/80 bg-background px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-cat-math/40 focus:border-cat-math focus:bg-panel focus:ring-2 focus:ring-cat-math/20 ${suffix ? "pr-9" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] font-medium text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Interactive percentage calculator — five sentence-style modes, live results.
 */
export function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>("percent-of");
  const [xRaw, setXRaw] = useState("");
  const [yRaw, setYRaw] = useState("");
  const [direction, setDirection] = useState<AdjustDirection>("increase");
  const tablistId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const x = parseDecimalInput(xRaw);
  const y = parseDecimalInput(yRaw);
  const result = calculatePercentage({ mode, x, y, direction });

  const selectMode = useCallback((next: PercentageMode) => {
    setMode(next);
  }, []);

  function handleReset() {
    setXRaw("");
    setYRaw("");
    setDirection("increase");
    setMode("percent-of");
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
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
    selectMode(MODES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  const panel = renderModeFields(mode, xRaw, yRaw, setXRaw, setYRaw, direction, setDirection);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="pct-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="pct-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Percent
                className={`size-5 ${mathTheme.text}`}
                aria-hidden="true"
              />
              Choose a calculation
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

          <div
            id={tablistId}
            role="tablist"
            aria-label="Percentage calculation modes"
            className="flex flex-col gap-1.5"
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
                  className={`rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                    selected
                      ? `${mathTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-math-soft hover:text-cat-math"
                  }`}
                >
                  <span className="block">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-[11px] font-medium ${
                      selected ? "text-white/80" : "text-muted"
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
            {panel}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="pct-outcome-heading"
        className="flex min-h-88 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-88 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="pct-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Result
            </span>
            <span className="text-[12px] text-muted">
              {MODES.find((m) => m.id === mode)?.label}
            </span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-4">
              <p className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-5xl">
                {result.display}
              </p>
              <p
                className={`rounded-lg border px-3.5 py-2.5 text-[14px] leading-relaxed tabular-nums ${mathTheme.borderSoft} ${mathTheme.soft} ${mathTheme.text}`}
              >
                <span className="ui-label mb-0.5 block text-[11px] opacity-80">
                  Worked step
                </span>
                {result.working}
              </p>
            </div>
          ) : result.error === "empty" ? (
            <p className="text-[15px] text-muted">
              Fill in both numbers to see the percentage result and a worked
              step with your values.
            </p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] font-medium text-amber-900">
              {result.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function renderModeFields(
  mode: PercentageMode,
  xRaw: string,
  yRaw: string,
  setXRaw: (v: string) => void,
  setYRaw: (v: string) => void,
  direction: AdjustDirection,
  setDirection: (d: AdjustDirection) => void,
) {
  switch (mode) {
    case "percent-of":
      return (
        <SentenceRow>
          <span className="text-[14px] text-foreground">What is</span>
          <NumberField
            id="pct-x"
            label="Percent"
            value={xRaw}
            onChange={setXRaw}
            suffix="%"
          />
          <span className="text-[14px] text-foreground">of</span>
          <NumberField
            id="pct-y"
            label="Number"
            value={yRaw}
            onChange={setYRaw}
          />
          <span className="text-[14px] text-foreground">?</span>
        </SentenceRow>
      );
    case "is-what-percent":
      return (
        <SentenceRow>
          <NumberField
            id="pct-x"
            label="Part"
            value={xRaw}
            onChange={setXRaw}
          />
          <span className="text-[14px] text-foreground">is what % of</span>
          <NumberField
            id="pct-y"
            label="Whole"
            value={yRaw}
            onChange={setYRaw}
          />
          <span className="text-[14px] text-foreground">?</span>
        </SentenceRow>
      );
    case "percent-change":
      return (
        <SentenceRow>
          <span className="text-[14px] text-foreground">% change from</span>
          <NumberField
            id="pct-x"
            label="Starting value"
            value={xRaw}
            onChange={setXRaw}
          />
          <span className="text-[14px] text-foreground">to</span>
          <NumberField
            id="pct-y"
            label="Ending value"
            value={yRaw}
            onChange={setYRaw}
          />
        </SentenceRow>
      );
    case "adjust-by-percent":
      return (
        <div className="flex flex-col gap-3">
          <div
            role="group"
            aria-label="Increase or decrease"
            className="flex gap-1.5"
          >
            {(["increase", "decrease"] as const).map((dir) => {
              const selected = direction === dir;
              return (
                <button
                  key={dir}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDirection(dir)}
                  className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold capitalize transition ${
                    selected
                      ? `${mathTheme.solid} text-white`
                      : "bg-background text-foreground hover:bg-cat-math-soft"
                  }`}
                >
                  {dir}
                </button>
              );
            })}
          </div>
          <SentenceRow>
            <span className="text-[14px] capitalize text-foreground">
              {direction}
            </span>
            <NumberField
              id="pct-x"
              label="Number"
              value={xRaw}
              onChange={setXRaw}
            />
            <span className="text-[14px] text-foreground">by</span>
            <NumberField
              id="pct-y"
              label="Percent"
              value={yRaw}
              onChange={setYRaw}
              suffix="%"
            />
          </SentenceRow>
        </div>
      );
    case "find-whole":
      return (
        <SentenceRow>
          <NumberField
            id="pct-x"
            label="Part"
            value={xRaw}
            onChange={setXRaw}
          />
          <span className="text-[14px] text-foreground">is</span>
          <NumberField
            id="pct-y"
            label="Percent"
            value={yRaw}
            onChange={setYRaw}
            suffix="%"
          />
          <span className="text-[14px] text-foreground">of what number?</span>
        </SentenceRow>
      );
  }
}

function SentenceRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end">
      {children}
    </div>
  );
}
