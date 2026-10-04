"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { LIVE_CALCULATORS } from "@/lib/calculators";

type HomeSearchProps = {
  variant: "header" | "hero";
  id?: string;
};

/** Client-side filter over live calculators (no network). */
export function HomeSearch({ variant, id = "home-search" }: HomeSearchProps) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!trimmed) return [];
    return LIVE_CALCULATORS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(trimmed) ||
        tool.description.toLowerCase().includes(trimmed),
    ).slice(0, 6);
  }, [trimmed]);

  if (variant === "header") {
    return (
      <div className="relative hidden w-48 sm:block lg:w-64">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <Search className="size-4" aria-hidden="true" />
        </div>
        <label htmlFor={`${id}-header`} className="sr-only">
          Quick jump to a calculator
        </label>
        <input
          id={`${id}-header`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Quick jump..."
          autoComplete="off"
          className="w-full rounded-lg border border-stone-300/80 bg-stone-200/60 py-1.5 pr-3 pl-9 text-xs text-zinc-900 placeholder-zinc-400 transition-all hover:bg-stone-200 focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
        />
        {matches.length > 0 && (
          <ul className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-card">
            {matches.map((tool) => (
              <li key={tool.id}>
                <Link
                  href={tool.href!}
                  className="block px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-stone-100 hover:text-zinc-950"
                  onClick={() => setQuery("")}
                >
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl pt-2">
      <form
        role="search"
        className="group relative"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 transition-colors group-focus-within:text-zinc-900">
          <Search className="size-5" aria-hidden="true" strokeWidth={2.2} />
        </div>
        <label htmlFor={id} className="sr-only">
          Search all calculators
        </label>
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search calculators, e.g. days..."
          autoComplete="off"
          className="w-full rounded-xl border border-stone-300 bg-white py-3.5 pr-28 pl-12 text-sm text-zinc-900 shadow-xs placeholder-zinc-400 transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none sm:text-base"
        />
        <button
          type="submit"
          className="absolute top-2 right-2 bottom-2 flex items-center gap-1.5 rounded-lg bg-[#18181B] px-4 text-xs font-semibold text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
        >
          Find Tool
        </button>
      </form>
      {matches.length > 0 && (
        <ul className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-card">
          {matches.map((tool) => (
            <li key={tool.id}>
              <Link
                href={tool.href!}
                className="block px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-stone-100 hover:text-zinc-950"
                onClick={() => setQuery("")}
              >
                <span className="block">{tool.name}</span>
                <span className="block text-xs font-normal text-zinc-500">
                  {tool.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
