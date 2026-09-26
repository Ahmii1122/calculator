import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { CategoryTheme } from "@/lib/calculators";
import { CATEGORY_THEME } from "@/lib/calculators";

type CalculatorPageShellProps = {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  intro: string;
  calculator: ReactNode;
  children: ReactNode;
  /** Category theme for accents (never brand amber). */
  theme?: CategoryTheme;
};

/**
 * Reusable layout for hub calculator pages.
 * Category accents come from `theme`; brand amber stays in Header/CTAs only.
 */
export function CalculatorPageShell({
  breadcrumbs,
  title,
  intro,
  calculator,
  children,
  theme = "date",
}: CalculatorPageShellProps) {
  const colors = CATEGORY_THEME[theme];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-5 sm:py-10">
        <Breadcrumbs items={breadcrumbs} theme={theme} />

        <header className={`border-l-4 pl-4 ${colors.border}`}>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
            {intro}
          </p>
        </header>

        <section aria-label="Calculator" className="py-7">
          {calculator}
        </section>

        <div
          className={`h-0.5 w-full ${colors.solid} opacity-25`}
          role="separator"
          aria-hidden="true"
        />

        <article className="space-y-10 pt-10 text-[15px] leading-relaxed text-foreground/85 sm:space-y-12 sm:text-base">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
