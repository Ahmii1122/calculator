"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ArrowLeftRight, Ruler } from "lucide-react";
import {
  UNIT_CATEGORIES,
  convertUnits,
  getCategory,
  type UnitCategoryId,
} from "@/lib/utils/unit-conversion";
import { CATEGORY_THEME, getCategoryTheme } from "@/lib/calculators";

const mathTheme = CATEGORY_THEME[getCategoryTheme("math")];

const DEFAULT_UNITS: Record<
  UnitCategoryId,
  { from: string; to: string }
> = {
  length: { from: "cm", to: "in" },
  weight: { from: "kg", to: "lb" },
  volume: { from: "l", to: "gal" },
  temperature: { from: "c", to: "f" },
};

/**
 * Interactive unit converter — Length, Weight, Volume, Temperature.
 * Live conversion; US customary for cooking/liquid volume units.
 */
export function UnitConverter() {
  const [categoryId, setCategoryId] = useState<UnitCategoryId>("length");
  const [fromUnitId, setFromUnitId] = useState(DEFAULT_UNITS.length.from);
  const [toUnitId, setToUnitId] = useState(DEFAULT_UNITS.length.to);
  const [rawValue, setRawValue] = useState("1");

  const tablistId = useId();
  const valueId = useId();
  const fromId = useId();
  const toId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const category = getCategory(categoryId);
  const result = convertUnits({
    categoryId,
    fromUnitId,
    toUnitId,
    rawValue,
  });

  const selectCategory = useCallback((next: UnitCategoryId) => {
    setCategoryId(next);
    const defaults = DEFAULT_UNITS[next];
    setFromUnitId(defaults.from);
    setToUnitId(defaults.to);
  }, []);

  function handleSwap() {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const last = UNIT_CATEGORIES.length - 1;
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
    selectCategory(UNIT_CATEGORIES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section
        aria-labelledby="unit-input-heading"
        className="flex flex-col gap-4 lg:col-span-5"
      >
        <div className="flex flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2
              id="unit-input-heading"
              className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
            >
              <Ruler
                className={`size-5 ${mathTheme.text}`}
                aria-hidden="true"
              />
              Choose units
            </h2>
            {category.usesUsCustomary ? (
              <span className="ui-label rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                US units
              </span>
            ) : null}
          </div>

          <div
            id={tablistId}
            role="tablist"
            aria-label="Conversion category"
            className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2"
          >
            {UNIT_CATEGORIES.map((item, index) => {
              const selected = categoryId === item.id;
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
                  onClick={() => selectCategory(item.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`rounded-lg px-2.5 py-2 text-center text-[12px] font-semibold transition sm:text-[13px] ${
                    selected
                      ? `${mathTheme.solid} text-white shadow-sm`
                      : "bg-background text-foreground hover:bg-cat-math-soft hover:text-cat-math"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`${tablistId}-panel`}
            aria-labelledby={`${tablistId}-${categoryId}`}
            className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/70 p-4"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={valueId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                Value
              </label>
              <input
                id={valueId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={rawValue}
                onChange={(event) => setRawValue(event.target.value)}
                className="w-full rounded-lg border border-border/80 bg-panel px-3 py-2.5 text-[15px] tabular-nums text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={fromId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                From
              </label>
              <select
                id={fromId}
                value={fromUnitId}
                onChange={(event) => setFromUnitId(event.target.value)}
                className="w-full rounded-lg border border-border/80 bg-panel px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              >
                {category.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label} — {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative z-10 -my-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap units"
                aria-label="Swap from and to units"
                className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-white shadow-card transition hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
              >
                <ArrowLeftRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={toId}
                className="text-[12px] font-semibold text-zinc-600"
              >
                To
              </label>
              <select
                id={toId}
                value={toUnitId}
                onChange={(event) => setToUnitId(event.target.value)}
                className="w-full rounded-lg border border-border/80 bg-panel px-3 py-2.5 text-[14px] text-foreground outline-none transition hover:border-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/15"
              >
                {category.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label} — {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="border-t border-border/70 pt-3 text-[12px] leading-relaxed text-zinc-600">
            Calculations run in your browser — nothing is stored or sent to a
            server.
            {category.usesUsCustomary
              ? " Cups, spoons, fl oz, and gallons use US customary sizes."
              : ""}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="unit-outcome-heading"
        className="flex min-h-72 flex-col gap-4 lg:col-span-7"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-h-72 flex-col gap-5 rounded-xl border border-border/80 bg-panel p-5 shadow-card sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="unit-outcome-heading"
              className="ui-label rounded-md bg-accent-strong px-2.5 py-1 text-[11px] text-white"
            >
              Converted value
            </span>
            <span className="text-[12px] text-zinc-600">{category.label}</span>
          </div>

          {result.ok ? (
            <div className="animate-fade-in flex flex-col gap-3">
              <p className="text-4xl font-extrabold tracking-tight text-zinc-950 tabular-nums sm:text-5xl">
                {result.display}{" "}
                <span className="text-2xl font-bold text-zinc-700 sm:text-3xl">
                  {result.toUnit.label}
                </span>
              </p>
              <p className="text-[14px] text-zinc-600">
                {rawValue.trim() || "0"} {result.fromUnit.label} ={" "}
                {result.display} {result.toUnit.name}
              </p>
              <p className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2.5 text-[13px] tabular-nums text-zinc-700">
                <span className="ui-label mb-0.5 block text-[11px] text-zinc-500">
                  Formula used
                </span>
                {result.formula}
              </p>
            </div>
          ) : result.error === "empty" ? (
            <p className="text-[15px] leading-relaxed text-zinc-600">
              Enter a number to convert between {category.label.toLowerCase()}{" "}
              units — for example cm to inches, kg to lbs, or Celsius to
              Fahrenheit.
            </p>
          ) : (
            <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] font-medium text-zinc-800">
              {result.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
