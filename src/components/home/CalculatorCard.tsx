import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  isCalculatorLive,
  isCalculatorNew,
  type CalculatorListing,
  type CategoryTheme,
} from "@/lib/calculators";

type CalculatorCardProps = {
  calculator: CalculatorListing;
  /** Kept for call-site compatibility; theme is monochrome site-wide. */
  theme?: CategoryTheme;
};

/**
 * Category-page calculator card. Live tools are a single real link; coming-soon
 * tools render a non-link muted card with a Coming soon label.
 */
export function CalculatorCard({ calculator }: CalculatorCardProps) {
  const Icon = calculator.icon;
  const live = isCalculatorLive(calculator);
  const showNew = isCalculatorNew(calculator);

  const body = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-zinc-800">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {live ? (
          showNew ? (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
              New
            </span>
          ) : null
        ) : (
          <span className="rounded-md border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
            Coming soon
          </span>
        )}
      </div>
      <span
        className={`block text-[15px] font-semibold leading-snug ${
          live ? "text-zinc-900" : "text-zinc-800"
        }`}
      >
        {calculator.name}
      </span>
      <span
        className={`mt-1.5 line-clamp-2 block text-sm leading-relaxed ${
          live ? "text-zinc-600" : "text-zinc-700"
        }`}
      >
        {calculator.description}
      </span>
      {live ? (
        <span className="mt-auto block pt-4" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors group-hover:bg-zinc-800">
            Open tool
            <ArrowRight className="size-3.5" />
          </span>
        </span>
      ) : null}
    </>
  );

  if (!live) {
    return (
      <div
        aria-disabled="true"
        className="flex h-full flex-col rounded-xl border border-stone-200 bg-stone-50 p-5 shadow-card"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={calculator.href}
      className="card-transition group flex h-full flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-card outline-none hover:border-zinc-400 hover:shadow-card-hover focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/30"
    >
      {body}
    </Link>
  );
}
