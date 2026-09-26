import Link from "next/link";
import type { CalculatorListing, CategoryTheme } from "@/lib/calculators";
import { CATEGORY_THEME } from "@/lib/calculators";

type CalculatorCardProps = {
  calculator: CalculatorListing;
  theme: CategoryTheme;
};

/** Reusable calculator listing card for the homepage directory. */
export function CalculatorCard({ calculator, theme }: CalculatorCardProps) {
  const Icon = calculator.icon;
  const colors = CATEGORY_THEME[theme];
  const isComingSoon = calculator.badge === "coming-soon" || !calculator.href;
  const isPopular = calculator.badge === "popular";

  const content = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`flex size-10 items-center justify-center rounded-lg ${colors.icon}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {isPopular && (
          <span className="ui-label rounded-full bg-accent-strong px-2 py-0.5 text-[10px] text-white">
            Try it
          </span>
        )}
        {isComingSoon && (
          <span
            className={`ui-label rounded-full px-2 py-0.5 text-[10px] ${colors.badge}`}
          >
            Coming soon
          </span>
        )}
      </div>
      <span
        className={`block text-[15px] font-semibold ${
          isComingSoon ? "text-foreground/70" : "text-foreground"
        }`}
      >
        {calculator.name}
      </span>
      <span className="mt-1 block text-sm text-muted">
        {calculator.description}
      </span>
    </>
  );

  if (isComingSoon) {
    return (
      <div
        aria-disabled="true"
        className="rounded-xl border border-border/80 bg-panel p-4 opacity-90 shadow-card"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={calculator.href!}
      className={`block rounded-xl border border-border/80 bg-panel p-4 shadow-card transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card-hover ${colors.hoverBorder}`}
    >
      {content}
    </Link>
  );
}
