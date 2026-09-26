import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { CategoryTheme } from "@/lib/calculators";
import { CATEGORY_THEME } from "@/lib/calculators";

type CategorySectionProps = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  theme: CategoryTheme;
  children: ReactNode;
};

/** Category group wrapper for homepage calculator grids. */
export function CategorySection({
  id,
  title,
  description,
  icon: Icon,
  theme,
  children,
}: CategorySectionProps) {
  const headingId = `${id}-heading`;
  const colors = CATEGORY_THEME[theme];

  return (
    <section aria-labelledby={headingId} className="scroll-mt-20">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id={headingId}
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
