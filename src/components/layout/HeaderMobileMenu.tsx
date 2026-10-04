"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { HeaderNav } from "@/components/layout/HeaderNav";

/** Hamburger + panel for small screens — same links as desktop nav. */
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
    <div className="relative md:hidden">
      <button
        type="button"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white text-zinc-900 shadow-xs transition hover:bg-stone-100"
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
          className="absolute top-full right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-stone-200 bg-white px-3 py-3 shadow-card"
        >
          <HeaderNav
            variant="stack"
            className="w-full"
            onNavigate={() => setOpen(false)}
          />
          <Link
            href="/#request-tool"
            className="mt-3 block cursor-pointer rounded-lg bg-zinc-900 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            Suggest Tool
          </Link>
        </div>
      )}
    </div>
  );
}
