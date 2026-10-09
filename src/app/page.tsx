import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Info,
  Percent,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { HomeCategoryNav } from "@/components/home/HomeCategoryNav";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeToolCard } from "@/components/home/HomeToolCard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  CALCULATOR_CATEGORIES,
  LIVE_CALCULATORS,
} from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_TITLE = "Free Online Calculators for Dates, GPA & Math";
const PAGE_DESCRIPTION =
  "Free, instant online calculators for date differences, age, business days, GPA/CGPA, and percentages. Client-side and private — no signup, no data stored.";

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: PAGE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${SITE_NAME} live calculators`,
  numberOfItems: LIVE_CALCULATORS.length,
  itemListElement: LIVE_CALCULATORS.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url: `${SITE_URL}${item.href}`,
    description: item.description,
  })),
};

const CARD_DETAILS: Record<
  string,
  { detail: string; meta: string }
> = {
  "days-between-dates": {
    detail:
      "Calculate total elapsed days, weeks, months, and hours between any two start and end calendar dates.",
    meta: "Instant · Realtime",
  },
  "age-calculator": {
    detail:
      "Determine chronological age down to precise years, months, and days, with a clear days-old total.",
    meta: "Detailed breakdown",
  },
  "business-days": {
    detail:
      "Count official working days between two dates, automatically excluding Saturdays and Sundays.",
    meta: "Weekends excluded",
  },
  "add-subtract-days": {
    detail:
      "Add or subtract exact quantities of days, weeks, months, or years from any starting date.",
    meta: "Forward & backward",
  },
  percentage: {
    detail:
      "Find percentage of a number, percent change, and increase or decrease — with a clear worked step.",
    meta: "Multi-mode math",
  },
  gpa: {
    detail:
      "Semester SGPA and overall CGPA with common 4.0, 5.0, and 10-point scales, plus a target planner.",
    meta: "College & school",
  },
  "loan-payment": {
    detail:
      "Estimate monthly payments, principal vs. interest breakdown, and complete amortization schedules.",
    meta: "Amortization tables",
  },
  "compound-interest": {
    detail:
      "Simulate growth with recurring contributions and custom compounding frequency.",
    meta: "Yield modeling",
  },
  "savings-goal": {
    detail:
      "Discover the monthly deposit needed to reach a savings target by a deadline.",
    meta: "Target timeline",
  },
  bmi: {
    detail:
      "Body mass index from height and weight — metric or imperial, with WHO adult categories and optional Asian cut-offs.",
    meta: "Adult screening",
  },
  calorie: {
    detail:
      "Estimate BMR and TDEE (maintenance calories) with Mifflin–St Jeor and activity levels — metric or imperial.",
    meta: "TDEE · BMR",
  },
  "due-date": {
    detail:
      "Estimate a due date from the first day of the last menstrual period using Naegele’s rule.",
    meta: "Trimester helper",
  },
  average: {
    detail:
      "Compute mean, median, mode, range, geometric mean, and standard deviation from any list of numbers.",
    meta: "Mean · Median · Mode",
  },
  "unit-converter": {
    detail:
      "Convert length, weight, volume, and temperature — cm to inches, kg to lbs, Celsius to Fahrenheit, and more.",
    meta: "Metric · US customary",
  },
};

const POPULAR_IDS = [
  "days-between-dates",
  "age-calculator",
  "percentage",
  "business-days",
] as const;

const POPULAR_ICONS = {
  "days-between-dates": CalendarRange,
  "age-calculator": CalendarDays,
  percentage: Percent,
  "business-days": Briefcase,
} as const;

const FREQUENT_LINKS = [
  { href: "/date-time/days-between-dates", label: "Days Between Dates" },
  { href: "/date-time/age-calculator", label: "Age Calculator" },
  { href: "/math/percentage-calculator", label: "Percentage" },
  { href: "/date-time/business-days-calculator", label: "Business Days" },
  { href: "/math/gpa-calculator", label: "GPA & CGPA" },
] as const;

const FAQ_ITEMS: {
  icon: LucideIcon;
  question: string;
  answer: ReactNode;
}[] = [
  {
    icon: ShieldCheck,
    question: "Are my inputs kept completely private?",
    answer:
      "Yes, 100%. All arithmetic operations and date calculations run exclusively inside your web browser’s JavaScript engine. No figures, financial parameters, or personal dates are ever transmitted to external servers.",
  },
  {
    icon: CalendarDays,
    question: "How does the Days Between Dates tool handle leap years?",
    answer:
      "Our date logic adopts the Gregorian calendar standard, fully factoring in leap years (years divisible by 4, except century years not divisible by 400). Calculations use local calendar dates only — there is no timezone conversion to UTC — so you avoid the off-by-one-day errors that UTC conversion can introduce around daylight saving boundaries.",
  },
  {
    icon: CircleDollarSign,
    question: "What formulas will the financial and loan calculators use?",
    answer: (
      <>
        Loan Payment, Compound Interest, and Savings Goal are planned tools and
        are not live yet. When they ship, loan payments will use the standard
        amortization formula{" "}
        <code className="rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800">
          M = P[r(1+r)^n] / [(1+r)^n − 1]
        </code>
        . Compound interest will support common compounding intervals (daily,
        monthly, annually). Until then, treat this as a preview of the planned
        feature — not an active calculator.
      </>
    ),
  },
  {
    icon: Info,
    question: "Is Calculator Hub free for commercial and educational use?",
    answer:
      "Yes. Every live tool on Calculator Hub is permanently unrestricted and free for students, engineers, financial planners, and researchers without any subscription barriers or account signups.",
  },
];

function categoryStatusLabel(live: number, total: number): string {
  if (live === 0) return `${total} Tools · In production`;
  if (live === total) return `${total} Tools · ${live} live`;
  return `${total} Tools · ${live} live`;
}

export default function HomePage() {
  const liveCount = LIVE_CALCULATORS.length;
  const plannedCount = CALCULATOR_CATEGORIES.reduce(
    (sum, category) => sum + category.calculators.length,
    0,
  );

  const popularTools = POPULAR_IDS.map((id) =>
    LIVE_CALCULATORS.find((tool) => tool.id === id),
  ).filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto w-full max-w-7xl flex-grow space-y-12 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex text-xs text-zinc-500">
            <ol className="inline-flex items-center space-x-1 sm:space-x-2">
              <li className="inline-flex items-center">
                <span className="font-semibold text-zinc-900">Home</span>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-1 text-zinc-300" aria-hidden="true">
                    /
                  </span>
                  <span className="font-semibold text-zinc-900">
                    Calculator Directory
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <header className="mx-auto max-w-3xl space-y-5 pt-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-stone-200/80 px-3 py-1 text-xs font-medium text-zinc-800">
              <span className="size-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
              <span>100% Private, Client-Side Calculations</span>
            </div>
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-[#09090B] sm:text-4xl lg:text-5xl">
              Free Online Calculators{" "}
              <br className="hidden sm:inline" />
              <span className="font-bold text-stone-600">
                Fast, Accurate &amp; Zero-Friction
              </span>{" "}
              Utility Tools
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              Ad-light, instant computation for calendar dates, GPA and
              percentages, and everyday planning. No accounts — formulas kept
              transparent.
            </p>

            <HomeSearch variant="hero" />

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-xs font-semibold text-zinc-500">
                Frequent:
              </span>
              {FREQUENT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:border-zinc-400 hover:text-zinc-950"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </header>

          <section
            aria-labelledby="popular-strip-heading"
            className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-card sm:p-5"
          >
            <div className="flex flex-col justify-between gap-3 border-b border-stone-100 pb-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-zinc-900" />
                <h2
                  className="text-xs font-bold tracking-wider text-zinc-900 uppercase"
                  id="popular-strip-heading"
                >
                  Popular Right Now
                </h2>
                <span className="text-xs font-normal text-stone-500">
                  | High-demand daily utilities
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2
                  className="size-3.5 text-emerald-600"
                  aria-hidden="true"
                />
                {liveCount} tools live · calculations stay on-device
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-4">
              {popularTools.map((tool) => {
                const Icon =
                  POPULAR_ICONS[tool.id as keyof typeof POPULAR_ICONS] ??
                  Scale;
                return (
                  <Link
                    key={tool.id}
                    href={tool.href!}
                    className="group flex items-start gap-3 rounded-xl border border-stone-200/90 bg-stone-50 p-3 transition-all hover:border-stone-300 hover:bg-stone-100/90"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-zinc-800 transition-transform group-hover:scale-105">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-zinc-900 group-hover:text-zinc-950">
                        {tool.name}
                      </div>
                      <div className="truncate text-[11px] text-zinc-500">
                        {tool.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <HomeCategoryNav
            liveCount={liveCount}
            plannedCount={plannedCount}
          />

          {CALCULATOR_CATEGORIES.map((category) => {
            const liveInCategory = category.calculators.filter((c) =>
              Boolean(c.href),
            ).length;
            const Icon = category.icon;
            return (
              <section
                key={category.id}
                id={category.id}
                aria-labelledby={`heading-${category.id}`}
                className="scroll-mt-28 space-y-4"
              >
                <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-3 sm:flex-row sm:items-end">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-xs">
                      <Icon
                        className="size-5 text-stone-200"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-bold tracking-tight text-zinc-950"
                        id={`heading-${category.id}`}
                      >
                        {category.title} Calculators
                      </h2>
                      <p className="text-xs text-zinc-600 sm:text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    {categoryStatusLabel(
                      liveInCategory,
                      category.calculators.length,
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {category.calculators.map((calculator) => {
                    const extras = CARD_DETAILS[calculator.id];
                    return (
                      <HomeToolCard
                        key={calculator.id}
                        calculator={calculator}
                        detail={extras?.detail}
                        meta={extras?.meta}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          <section
            aria-labelledby="faq-heading"
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card sm:p-8 lg:p-10"
            id="faq"
          >
            <div className="max-w-3xl">
              <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                Knowledge Base &amp; Methodology
              </span>
              <h2
                className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-[1.75rem]"
                id="faq-heading"
              >
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                Learn how Calculator Hub guarantees numerical precision,
                protects client data privacy, and determines formula standards.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 md:gap-y-10">
              {FAQ_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.question} className="min-w-0">
                    <h3 className="flex items-start gap-2 text-[15px] font-bold text-zinc-950">
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-zinc-500"
                        aria-hidden="true"
                        strokeWidth={2}
                      />
                      <span>{item.question}</span>
                    </h3>
                    <p className="mt-2 pl-6 text-sm leading-relaxed text-zinc-600">
                      {item.answer}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="cta-heading"
            className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-zinc-800/80 bg-[#121316] p-6 text-white shadow-card sm:p-8 md:flex-row lg:p-10"
            id="request-tool"
          >
            <div className="max-w-xl space-y-2 text-center md:text-left">
              <h2
                className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                id="cta-heading"
              >
                Need a custom formula or specialized calculator?
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                We prioritize requested tools — tell us what you need next.
              </p>
            </div>
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
              <a
                href="/contact"
                className="w-full rounded-lg bg-white px-5 py-2.5 text-center text-xs font-semibold text-zinc-950 shadow-[0_1px_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors hover:bg-stone-100 focus:ring-2 focus:ring-white sm:w-auto sm:text-sm"
              >
                Submit Calculator Request
              </a>
              <a
                href="#faq"
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-4 py-2.5 text-center text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 sm:w-auto sm:text-sm"
              >
                Read Methodologies
              </a>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
