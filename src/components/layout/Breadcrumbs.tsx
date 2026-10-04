import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategoryTheme } from "@/lib/calculators";
import { CATEGORY_THEME } from "@/lib/calculators";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** Optional category theme for the current-page pill (defaults to brand amber). */
  theme?: CategoryTheme;
};

/** Shared breadcrumb trail. */
export function Breadcrumbs({ items, theme }: BreadcrumbsProps) {
  const currentClasses = theme
    ? CATEGORY_THEME[theme].badge
    : "bg-accent-soft text-accent-text";

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted/70"
                  aria-hidden="true"
                />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-zinc-950"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? `rounded-md px-2 py-0.5 font-semibold ${currentClasses}`
                      : undefined
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
