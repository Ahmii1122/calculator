import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { CategoryTheme } from "@/lib/calculators";

type CalculatorPageShellProps = {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  intro: string;
  calculator: ReactNode;
  children: ReactNode;
  /** Kept for compatibility; accents are monochrome site-wide. */
  theme?: CategoryTheme;
};

/**
 * Reusable layout for hub calculator pages — editorial monochrome chrome.
 */
export function CalculatorPageShell({
  breadcrumbs,
  title,
  intro,
  calculator,
  children,
  theme = "date",
}: CalculatorPageShellProps) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-5 sm:py-10">
        <Breadcrumbs items={breadcrumbs} theme={theme} />

        <header className="border-l-4 border-zinc-900 pl-4">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-zinc-950 sm:text-[2rem]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
            {intro}
          </p>
        </header>

        <section aria-label="Calculator" className="py-7">
          {calculator}
        </section>

        <div
          className="h-0.5 w-full bg-zinc-900 opacity-20"
          role="separator"
          aria-hidden="true"
        />

        <article className="space-y-10 pt-10 text-[15px] leading-relaxed text-zinc-800 sm:space-y-12 sm:text-base">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
