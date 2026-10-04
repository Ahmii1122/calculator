"use client";

import { useEffect, useState } from "react";
import { CALCULATOR_CATEGORIES, LIVE_CALCULATORS } from "@/lib/calculators";

type HomeCategoryNavProps = {
  liveCount: number;
  plannedCount: number;
};

/**
 * Sticky category jump links. Active tab uses amber (not black).
 */
export function HomeCategoryNav({
  liveCount,
  plannedCount,
}: HomeCategoryNavProps) {
  const [activeId, setActiveId] = useState(CALCULATOR_CATEGORIES[0]?.id ?? "");

  useEffect(() => {
    const sections = CALCULATOR_CATEGORIES.map((category) =>
      document.getElementById(category.id),
    ).filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio,
          );
        const top = visible[0]?.target.id;
        if (top) setActiveId(top);
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Tool Categories"
      className="sticky top-16 z-30 border-b border-stone-200 bg-[#FAF9F6]/95 py-2.5 backdrop-blur-md"
      id="all-calculators"
    >
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {CALCULATOR_CATEGORIES.map((category) => {
            const total = category.calculators.length;
            const live = category.calculators.filter((c) =>
              Boolean(c.href),
            ).length;
            const isActive = activeId === category.id;
            return (
              <a
                key={category.id}
                href={`#${category.id}`}
                className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-zinc-700 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {category.title} ({live}/{total})
              </a>
            );
          })}
        </div>
        <div className="hidden items-center text-xs text-zinc-500 lg:flex">
          <span>
            {liveCount} of {plannedCount} tools live now
          </span>
          <span className="sr-only">
            {LIVE_CALCULATORS.length} live calculators listed
          </span>
        </div>
      </div>
    </nav>
  );
}
