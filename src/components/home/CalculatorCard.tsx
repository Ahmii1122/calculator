import Link from "next/link";
import type { CalculatorListing, CategoryTheme } from "@/lib/calculators";

type CalculatorCardProps = {
  calculator: CalculatorListing;
  /** Kept for call-site compatibility; theme is monochrome site-wide. */
  theme?: CategoryTheme;
};

/** Editorial calculator card — monochrome chrome, emerald live badge. */
export function CalculatorCard({ calculator }: CalculatorCardProps) {
  const Icon = calculator.icon;
  const isComingSoon = calculator.badge === "coming-soon" || !calculator.href;
  const isLive = !isComingSoon;

  const content = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-zinc-800">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Live Tool
          </span>
        ) : (
          <span className="rounded border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
            Coming soon
          </span>
        )}
      </div>
      <span
        className={`block text-[15px] font-semibold ${
          isComingSoon ? "text-zinc-700" : "text-zinc-900"
        }`}
      >
        {calculator.name}
      </span>
      <span className="mt-1 block text-sm text-zinc-600">
        {calculator.description}
      </span>
    </>
  );

  if (isComingSoon) {
    return (
      <div
        aria-disabled="true"
        className="rounded-xl border border-stone-200 bg-white p-5 shadow-card"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={calculator.href!}
      className="card-transition block rounded-xl border border-stone-200 bg-white p-5 shadow-card hover:border-zinc-400 hover:shadow-card-hover"
    >
      {content}
    </Link>
  );
}
