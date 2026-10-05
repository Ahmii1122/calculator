import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/contact";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Contact & Calculator Requests — Calculator Hub";
const PAGE_DESCRIPTION =
  "Contact Calculator Hub or request a new calculator. Tell us which formula or tool you need next — we prioritize high-demand utilities for students and pros.";

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
      name: "Contact",
      item: CANONICAL_URL,
    },
  ],
};

export default function ContactPage() {
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
            { label: "Contact" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Contact &amp; requests
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Need a custom formula or a calculator that is not live yet? Tell us
            what to build next.
          </p>
        </header>
        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
          <p>
            Email calculator requests to{" "}
            <a
              href="mailto:hello@allcalcs.app"
              className="font-medium text-zinc-950 underline"
            >
              hello@allcalcs.app
            </a>{" "}
            with the tool name, inputs you need, and any formula notes. We
            prioritize clear, high-demand utilities.
          </p>
          <p>
            You can also browse the{" "}
            <Link href="/#faq" className="font-medium text-zinc-950 underline">
              FAQ
            </Link>{" "}
            for accuracy and privacy details, or return to the{" "}
            <Link href="/" className="font-medium text-zinc-950 underline">
              homepage catalog
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
