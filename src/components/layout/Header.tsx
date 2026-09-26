import Link from "next/link";
import { HeaderMobileMenu } from "@/components/layout/HeaderMobileMenu";
import { HeaderNav } from "@/components/layout/HeaderNav";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { SITE_NAME } from "@/lib/site";

/**
 * Shared site header.
 * Left: wordmark · Right: minimal nav + search (hamburger on small screens).
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2.5 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={SITE_NAME}
          className="shrink-0 text-[15px] font-semibold tracking-tight whitespace-nowrap text-foreground transition-colors hover:text-accent"
        >
          <span className="max-[400px]:hidden">Calculator </span>
          Hub
        </Link>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4 md:gap-8">
          <HeaderNav className="hidden md:flex" />
          <HeaderSearch />
          <HeaderMobileMenu />
        </div>
      </div>
    </header>
  );
}
