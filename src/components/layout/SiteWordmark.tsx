import { BRAND_ACCENT, SITE_NAME } from "@/lib/site";

type SiteWordmarkProps = {
  className?: string;
};

/** Text wordmark: "Calc" in ink, "Daily" in brand amber. */
export function SiteWordmark({ className = "" }: SiteWordmarkProps) {
  return (
    <span
      className={`inline-flex items-baseline text-lg font-bold tracking-tight ${className}`}
      aria-label={SITE_NAME}
    >
      <span className="text-zinc-950">Calc</span>
      <span style={{ color: BRAND_ACCENT }}>Daily</span>
    </span>
  );
}
