import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/** Shared site footer. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-panel/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-[15px] font-semibold text-foreground">{SITE_NAME}</p>
            <p className="mt-0.5 max-w-sm text-sm text-muted">
              Free online calculators for dates, money, health, and everyday
              math — no signup required.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
          >
            <Link href="/about" className="text-muted hover:text-accent">
              About
            </Link>
            <Link href="/contact" className="text-muted hover:text-accent">
              Contact
            </Link>
            <Link href="/privacy" className="text-muted hover:text-accent">
              Privacy
            </Link>
          </nav>
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {SITE_NAME}. Free for personal and
          professional use.
        </p>
      </div>
    </footer>
  );
}
