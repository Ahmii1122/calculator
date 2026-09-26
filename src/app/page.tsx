import type { Metadata } from "next";
import {
  MonitorSmartphone,
  Sparkles,
  UserRoundX,
  Zap,
} from "lucide-react";
import { CalculatorCard } from "@/components/home/CalculatorCard";
import { CategorySection } from "@/components/home/CategorySection";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  CALCULATOR_CATEGORIES,
  LIVE_CALCULATORS,
} from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_TITLE = "Calculator Hub — Free Online Calculators";
const PAGE_DESCRIPTION =
  "Free online calculators for dates, finance, health, and math. Instant results, no signup — start with Days Between Two Dates and more tools coming soon.";

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
  name: `${SITE_NAME} Calculators`,
  itemListElement: LIVE_CALCULATORS.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url: `${SITE_URL}${item.href}`,
    description: item.description,
  })),
};

const TRUST_ITEMS = [
  {
    icon: UserRoundX,
    label: "No signup required",
  },
  {
    icon: Zap,
    label: "Instant results",
  },
  {
    icon: MonitorSmartphone,
    label: "Works on any device",
  },
] as const;

export default function HomePage() {
  const liveCount = LIVE_CALCULATORS.length;
  const plannedCount = CALCULATOR_CATEGORIES.reduce(
    (sum, category) => sum + category.calculators.length,
    0,
  );

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

      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Compact hero */}
        <header className="mb-10 max-w-2xl">
          <p className="ui-label mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[12px] text-accent-text">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {liveCount} live · {plannedCount} tools in the library
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Calculator <span className="text-accent">Hub</span>
          </h1>
          <p className="mt-2 text-base text-muted sm:text-lg">
            Free, fast calculators for dates, money, health, and everyday math.
          </p>
        </header>

        {/* Category directory */}
        <div className="space-y-12">
          {CALCULATOR_CATEGORIES.map((category) => (
            <CategorySection
              key={category.id}
              id={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              theme={category.theme}
            >
              {category.calculators.map((calculator) => (
                <CalculatorCard
                  key={calculator.id}
                  calculator={calculator}
                  theme={category.theme}
                />
              ))}
            </CategorySection>
          ))}
        </div>

        {/* Trust strip */}
        <section
          aria-label="Why Calculator Hub"
          className="mt-14 rounded-xl border border-border/80 bg-panel px-4 py-5 shadow-card sm:px-6"
        >
          <h2 className="sr-only">Why Calculator Hub</h2>
          <ul className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 text-sm font-medium text-foreground"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {item.label}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
