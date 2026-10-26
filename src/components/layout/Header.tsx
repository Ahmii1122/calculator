import Link from "next/link";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SITE_NAME } from "@/lib/site";

/**
 * Shared editorial header — matches homepage chrome site-wide.
 */
export function Header() {
  return (
    <header className="glass-nav sticky top-0 z-50 border-b border-stone-200/90 bg-background/90 shadow-[0_1px_2px_rgba(24,24,27,0.02)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${SITE_NAME} Home`}
          className="group flex shrink-0 cursor-pointer items-center rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          <SiteLogo
            height={32}
            className="transition-opacity group-hover:opacity-90"
          />
        </Link>

        <HeaderNav className="hidden md:flex" />

        <div className="flex shrink-0 items-center gap-3">
          <HeaderSearch />
          <a
            href="mailto:asam4055144@gmail.com?subject=CalcDaily%20tool%20suggestion"
            className="hidden cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 sm:inline-flex"
          >
            Suggest Tool
          </a>
          <HeaderMobileMenu />
        </div>
      </div>
    </header>
  );
}
