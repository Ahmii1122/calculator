import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { CategoryTheme } from "@/lib/calculators";

type CategorySectionProps = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  theme?: CategoryTheme;
  children: ReactNode;
};

/** Category group wrapper — monochrome editorial section header. */
export function CategorySection({
  id,
  title,
  description,
  icon: Icon,
  children,
}: CategorySectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="scroll-mt-28">
      <div className="mb-4 flex items-start gap-3 border-b border-stone-200 pb-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-stone-200 shadow-xs">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id={headingId}
            className="text-xl font-bold tracking-tight text-zinc-950"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-600">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
