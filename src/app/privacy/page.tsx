import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PAGE_PATH = "/privacy";
const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`;
const PAGE_TITLE = "Privacy Policy — Calculator Hub";
const PAGE_DESCRIPTION =
  "Calculator Hub privacy policy: all live calculators run in your browser. Inputs are not sent to our servers. Learn what we collect and how analytics work.";

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
      name: "Privacy",
      item: CANONICAL_URL,
    },
  ],
};

export default function PrivacyPage() {
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
            { label: "Privacy" },
          ]}
        />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600">
            Last updated: October 2026. Calculator Hub is designed so your
            calculation inputs stay on your device.
          </p>
        </header>
        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              Calculator inputs
            </h2>
            <p className="mt-2">
              All live arithmetic and date calculations run in your browser. We
              do not receive, store, or process the figures, dates, or grades you
              enter into calculators.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">
              Site analytics
            </h2>
            <p className="mt-2">
              We may use privacy-oriented analytics (such as Vercel Analytics) to
              understand aggregate traffic and performance. These tools do not
              need your calculator inputs.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-zinc-950">Contact</h2>
            <p className="mt-2">
              Questions about this policy? Reach us via the{" "}
              <Link href="/contact" className="font-medium text-zinc-950 underline">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
