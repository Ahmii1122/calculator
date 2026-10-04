import Link from "next/link";
import { CALCULATOR_CATEGORIES, LIVE_CALCULATORS } from "@/lib/calculators";
import { SITE_NAME } from "@/lib/site";

/** Shared editorial footer — monochrome, live tools only. */
export function Footer() {
  const year = new Date().getFullYear();
  const byCategory = CALCULATOR_CATEGORIES.map((category) => ({
    title: category.title,
    tools: category.calculators.filter((c) => Boolean(c.href)),
  })).filter((group) => group.tools.length > 0);

  return (
    <footer className="mt-auto border-t border-stone-200 bg-white text-sm text-zinc-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white">
                CH
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-950">
                {SITE_NAME}
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-zinc-600">
              High-precision, privacy-oriented mathematical utilities. Designed
              for instant accessibility, transparent models, and zero marketing
              clutter.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
              {LIVE_CALCULATORS.length} live tools · calculations stay in your
              browser
            </div>
          </div>

          {byCategory.slice(0, 2).map((group) => (
            <div key={group.title}>
              <h3 className="mb-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase">
                {group.title}
              </h3>
              <ul className="space-y-2.5 text-xs">
                {group.tools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={tool.href!}
                      className="transition-colors hover:text-zinc-950"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3.5 text-xs font-bold tracking-wider text-zinc-900 uppercase">
              Trust &amp; governance
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#faq" className="transition-colors hover:text-zinc-950">
                  Calculation accuracy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-zinc-950"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-zinc-950"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-zinc-950"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="transition-colors hover:text-zinc-950"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-100 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>
            © {year} {SITE_NAME}. Free client-side utilities. Zero trackers.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-900"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link
              href="/sitemap.xml"
              className="transition-colors hover:text-zinc-900"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
