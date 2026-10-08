"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "All Tools", href: "/#all-calculators", match: "all" as const },
  { label: "Date & Time", href: "/date-time", match: "date-time" as const },
  { label: "Financial", href: "/#finance", match: "finance" as const },
  {
    label: "Health & Fitness",
    href: "/health",
    match: "health" as const,
  },
  { label: "Math & Numbers", href: "/math", match: "math" as const },
  { label: "FAQ", href: "/#faq", match: "faq" as const },
] as const;

const linkBase =
  "cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors";
const linkIdle = `${linkBase} font-medium text-zinc-600 hover:bg-stone-200/50 hover:text-zinc-950`;
const linkActive = `${linkBase} font-semibold bg-stone-200/70 text-zinc-950`;

type HeaderNavProps = {
  onNavigate?: () => void;
  className?: string;
  variant?: "bar" | "stack";
};

function isActive(match: (typeof NAV_ITEMS)[number]["match"], pathname: string) {
  if (match === "all") return pathname === "/";
  if (match === "date-time") return pathname.startsWith("/date-time");
  if (match === "math") return pathname.startsWith("/math");
  if (match === "health") return pathname.startsWith("/health");
  // Hash-only sections: highlight All Tools when already on home
  return false;
}

/** Primary nav — flat category links matching the editorial homepage chrome. */
export function HeaderNav({
  onNavigate,
  className = "",
  variant = "bar",
}: HeaderNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main Navigation"
      className={
        variant === "stack"
          ? `flex flex-col items-stretch gap-1 ${className}`
          : `flex items-center gap-1 ${className}`
      }
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.match, pathname);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`${active ? linkActive : linkIdle} ${variant === "stack" ? "w-full" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
