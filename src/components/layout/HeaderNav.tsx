"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { CALCULATOR_CATEGORIES } from "@/lib/calculators";

const navLinkBase =
  "inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-colors";
const navLinkIdle = `${navLinkBase} font-medium text-muted hover:bg-accent-soft hover:text-foreground`;
const navLinkActive = `${navLinkBase} font-semibold bg-accent-soft text-accent-text`;

type HeaderNavProps = {
  /** Close mobile sheet when a link is chosen */
  onNavigate?: () => void;
  className?: string;
  /** Desktop bar uses a flyout; mobile stack expands inline */
  variant?: "bar" | "stack";
};

/** Primary nav: Home + Categories (not one link per calculator). */
export function HeaderNav({
  onNavigate,
  className = "",
  variant = "bar",
}: HeaderNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(variant === "stack");
  const [pathSnapshot, setPathSnapshot] = useState(pathname);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  if (pathSnapshot !== pathname) {
    setPathSnapshot(pathname);
    if (variant === "bar" && open) setOpen(false);
  }

  const homeActive = pathname === "/";
  const categoriesActive = pathname !== "/";

  useEffect(() => {
    if (variant !== "bar" || !open) return;

    function handlePointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, variant]);

  return (
    <nav
      aria-label="Primary"
      className={`flex items-center gap-1 ${className}`}
    >
      <Link
        href="/"
        className={homeActive ? navLinkActive : navLinkIdle}
        aria-current={homeActive ? "page" : undefined}
        onClick={onNavigate}
      >
        Home
      </Link>

      <div ref={wrapRef} className={variant === "stack" ? "w-full" : "relative"}>
        <button
          type="button"
          className={`${categoriesActive ? navLinkActive : navLinkIdle} ${variant === "stack" ? "w-full justify-between" : ""}`}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          Categories
          <ChevronDown
            className={`ml-1 size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <ul
            id={menuId}
            role="menu"
            className={
              variant === "stack"
                ? "mt-1 space-y-0.5 border-l border-border/80 py-1 pl-2"
                : "absolute top-full left-0 z-50 mt-1.5 min-w-[13rem] rounded-xl border border-border/80 bg-panel py-1.5 shadow-card"
            }
          >
            {CALCULATOR_CATEGORIES.map((category) => {
              // Prefer a real category index route when it exists (avoids 404s).
              const href =
                category.id === "date-time"
                  ? "/date-time"
                  : category.id === "math"
                    ? "/math"
                    : `/#${category.id}`;

              return (
                <li key={category.id} role="none">
                  <Link
                    role="menuitem"
                    href={href}
                    className="block whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent-text"
                    onClick={() => {
                      if (variant === "bar") setOpen(false);
                      onNavigate?.();
                    }}
                  >
                    {category.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
