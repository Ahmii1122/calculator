import Link from "next/link";
import { Calculator } from "lucide-react";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
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
          className="group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          <div className="flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-white shadow-xs transition-colors group-hover:bg-zinc-800">
            <Calculator className="size-5 text-zinc-100" aria-hidden="true" />
          </div>
          <div className="flex items-baseline">
            <span className="text-lg font-bold tracking-tight text-zinc-950">
              Calculator
            </span>
            <span className="ml-1 text-lg font-medium tracking-tight text-stone-500">
              Hub
            </span>
          </div>
        </Link>

        <HeaderNav className="hidden md:flex" />

        <div className="flex shrink-0 items-center gap-3">
          <HeaderSearch />
          <Link
            href="/#request-tool"
            className="hidden cursor-pointer rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 sm:inline-flex"
          >
            Suggest Tool
          </Link>
          <HeaderMobileMenu />
        </div>
      </div>
    </header>
  );
}
