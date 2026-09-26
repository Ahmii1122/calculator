"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { HeaderNav } from "@/components/layout/HeaderNav";

/** Hamburger + slide-down panel for small screens. */
export function HeaderMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pathSnapshot, setPathSnapshot] = useState(pathname);

  if (pathSnapshot !== pathname) {
    setPathSnapshot(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80 bg-panel text-foreground shadow-card transition hover:bg-accent-soft"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full z-50 border-b border-border/80 bg-background/95 px-5 py-3 shadow-card backdrop-blur-md"
        >
          <HeaderNav
            variant="stack"
            className="w-full flex-col items-stretch gap-1"
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
