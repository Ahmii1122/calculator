import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CalculatorListing } from "@/lib/calculators";

type HomeToolCardProps = {
  calculator: CalculatorListing;
  /** Optional longer blurb for the homepage card body. */
  detail?: string;
  /** Optional footer meta line (left side). */
  meta?: string;
};

/** Monochrome editorial tool card — amber Launch CTA, emerald Live badge. */
export function HomeToolCard({ calculator, detail, meta }: HomeToolCardProps) {
  const Icon = calculator.icon;
  const isLive = Boolean(calculator.href);
  const body = detail ?? calculator.description;

  return (
    <article
      id={calculator.id}
      className={`card-transition flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-card group ${
        isLive
          ? "hover:border-zinc-400 hover:shadow-card-hover"
          : "hover:border-stone-300"
      }`}
    >
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div
            className={`flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-zinc-800 transition-colors ${
              isLive ? "group-hover:bg-zinc-100 group-hover:text-zinc-950" : ""
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Live Tool
            </span>
          ) : (
            <span className="inline-flex items-center rounded border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
              Coming soon
            </span>
          )}
        </div>
        <h3
          className={`text-base font-bold text-zinc-900 transition-colors ${
            isLive ? "group-hover:text-zinc-950" : ""
          }`}
        >
          {calculator.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{body}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-3.5">
        {isLive ? (
          <>
            <span className="text-xs font-medium text-zinc-500">
              {meta ?? "Instant · Private"}
            </span>
            <Link
              href={calculator.href!}
              className="inline-flex items-center gap-1 rounded-lg bg-[#18181B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900"
            >
              Launch Tool
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-zinc-400">
              {meta ?? "In production"}
            </span>
            <span className="text-xs font-medium text-zinc-400">
              Not live yet
            </span>
          </>
        )}
      </div>
    </article>
  );
}
