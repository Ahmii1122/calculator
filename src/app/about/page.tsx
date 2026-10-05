import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/about";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "About Calculator Hub — Privacy-First Free Tools";
const PAGE_DESCRIPTION =
  "Learn what Calculator Hub is: free browser-based calculators for dates, GPA, and percentages. Transparent formulas, no accounts, inputs stay on your device.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: CANONICAL_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: CANONICAL_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: CANONICAL_URL,
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            About {SITE_NAME}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Calculator Hub is a free collection of utility calculators for
            calendar dates, GPA and CGPA, percentages, and everyday planning.
            Every live tool runs entirely in your browser.
          </p>
        </header>
        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
          <p>
            We focus on transparent formulas, fast results, and privacy: figures
            and dates you enter are not sent to our servers or stored by
            Calculator Hub.
          </p>
          <p>
            Finance and health calculators shown on the homepage are planned and
            not live yet. Browse{" "}
            <Link href="/date-time" className="font-medium text-zinc-950 underline">
              Date &amp; Time
            </Link>{" "}
            and{" "}
            <Link href="/math" className="font-medium text-zinc-950 underline">
              Math &amp; Education
            </Link>{" "}
            for tools available today, or{" "}
            <Link href="/contact" className="font-medium text-zinc-950 underline">
              request a calculator
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
