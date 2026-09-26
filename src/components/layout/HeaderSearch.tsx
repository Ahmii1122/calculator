"use client";

import { Search } from "lucide-react";

type HeaderSearchProps = {
  className?: string;
  inputId?: string;
};

/**
 * Shared header search.
 * Flexes to fill remaining header space on small screens so the placeholder
 * stays fully visible at 375px / 390px.
 */
export function HeaderSearch({
  className = "",
  inputId = "site-search",
}: HeaderSearchProps) {
  return (
    <form
      role="search"
      action="/"
      method="get"
      className={`relative min-w-[11rem] flex-1 sm:max-w-[15rem] sm:flex-none sm:w-[15rem] md:w-[17rem] ${className}`}
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor={inputId} className="sr-only">
        Search calculators
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id={inputId}
        name="q"
        type="search"
        placeholder="Search calculators..."
        title="Search calculators"
        autoComplete="off"
        className="box-border w-full rounded-full border border-border/80 bg-panel py-2.5 pr-4 pl-10 text-[12px] leading-none text-foreground shadow-card outline-none transition placeholder:text-muted/80 sm:text-[13px] focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </form>
  );
}
