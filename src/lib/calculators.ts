import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  Briefcase,
  Calculator,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  DollarSign,
  HeartPulse,
  Percent,
  PiggyBank,
  Ruler,
  Scale,
  Sigma,
} from "lucide-react";

/** Theme keys map to `--cat-*` tokens in globals.css */
export type CategoryTheme = "date" | "finance" | "health" | "math";

/** Category slug → theme key (use for route-based calculator pages). */
export type CategorySlug =
  | "date-time"
  | "finance"
  | "health"
  | "math";

/**
 * Canonical category color map keyed by category slug.
 * Future calculator pages should resolve accents via `getCategoryColors(slug)`
 * instead of hardcoding hex or brand amber.
 */
export const CATEGORY_COLORS: Record<
  CategorySlug,
  {
    theme: CategoryTheme;
    hex: string;
    softHex: string;
    cssVar: string;
    softCssVar: string;
  }
> = {
  "date-time": {
    theme: "date",
    hex: "#0F5C5C",
    softHex: "#E6F0EF",
    cssVar: "--cat-date",
    softCssVar: "--cat-date-soft",
  },
  finance: {
    theme: "finance",
    hex: "#15803D",
    softHex: "#EFF9F1",
    cssVar: "--cat-finance",
    softCssVar: "--cat-finance-soft",
  },
  health: {
    theme: "health",
    hex: "#BE185D",
    softHex: "#FDF0F5",
    cssVar: "--cat-health",
    softCssVar: "--cat-health-soft",
  },
  math: {
    theme: "math",
    hex: "#7C3AED",
    softHex: "#F5F0FE",
    cssVar: "--cat-math",
    softCssVar: "--cat-math-soft",
  },
};

export function getCategoryColors(slug: CategorySlug) {
  return CATEGORY_COLORS[slug];
}

export function getCategoryTheme(slug: CategorySlug): CategoryTheme {
  return CATEGORY_COLORS[slug].theme;
}

export type CalculatorListing = {
  id: string;
  name: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  badge?: "popular" | "coming-soon";
};

export type CalculatorCategory = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  theme: CategoryTheme;
  calculators: CalculatorListing[];
};

/** Tailwind class sets per category — full strings so utilities are detected. */
export const CATEGORY_THEME = {
  date: {
    icon: "bg-cat-date-soft text-cat-date",
    badge: "bg-cat-date-soft text-cat-date",
    hoverBorder: "hover:border-cat-date",
    soft: "bg-cat-date-soft",
    text: "text-cat-date",
    solid: "bg-cat-date",
    border: "border-cat-date",
    ring: "focus:border-cat-date focus:ring-cat-date/20",
    toggle: "peer-checked:bg-cat-date peer-focus-visible:ring-cat-date/40",
    borderSoft: "border-cat-date/30",
  },
  finance: {
    icon: "bg-cat-finance-soft text-cat-finance",
    badge: "bg-cat-finance-soft text-cat-finance",
    hoverBorder: "hover:border-cat-finance",
    soft: "bg-cat-finance-soft",
    text: "text-cat-finance",
    solid: "bg-cat-finance",
    border: "border-cat-finance",
    ring: "focus:border-cat-finance focus:ring-cat-finance/20",
    toggle: "peer-checked:bg-cat-finance peer-focus-visible:ring-cat-finance/40",
    borderSoft: "border-cat-finance/30",
  },
  health: {
    icon: "bg-cat-health-soft text-cat-health",
    badge: "bg-cat-health-soft text-cat-health",
    hoverBorder: "hover:border-cat-health",
    soft: "bg-cat-health-soft",
    text: "text-cat-health",
    solid: "bg-cat-health",
    border: "border-cat-health",
    ring: "focus:border-cat-health focus:ring-cat-health/20",
    toggle: "peer-checked:bg-cat-health peer-focus-visible:ring-cat-health/40",
    borderSoft: "border-cat-health/30",
  },
  math: {
    icon: "bg-cat-math-soft text-cat-math",
    badge: "bg-cat-math-soft text-cat-math",
    hoverBorder: "hover:border-cat-math",
    soft: "bg-cat-math-soft",
    text: "text-cat-math",
    solid: "bg-cat-math",
    border: "border-cat-math",
    ring: "focus:border-cat-math focus:ring-cat-math/20",
    toggle: "peer-checked:bg-cat-math peer-focus-visible:ring-cat-math/40",
    borderSoft: "border-cat-math/30",
  },
} as const;

/**
 * Homepage catalog. Only `href` entries are live; others show as coming soon.
 */
export const CALCULATOR_CATEGORIES: CalculatorCategory[] = [
  {
    id: "date-time",
    title: "Date & Time",
    description: "Count days, ages, and working-day spans.",
    icon: CalendarDays,
    theme: "date",
    calculators: [
      {
        id: "days-between-dates",
        name: "Days Between Two Dates",
        description: "Exact days, weeks, and business days.",
        href: "/date-time/days-between-dates",
        icon: CalendarRange,
        badge: "popular",
      },
      {
        id: "age-calculator",
        name: "Age Calculator",
        description: "Years, months, and days old.",
        href: "/date-time/age-calculator",
        icon: CalendarDays,
        badge: "popular",
      },
      {
        id: "business-days",
        name: "Business Days Calculator",
        description: "Weekdays between two dates.",
        href: "/date-time/business-days-calculator",
        icon: Briefcase,
        badge: "popular",
      },
      {
        id: "add-subtract-days",
        name: "Add or Subtract Days",
        description: "Shift any date by N days.",
        href: "/date-time/add-subtract-days",
        icon: CalendarPlus,
        badge: "popular",
      },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    description: "Plan loans, interest, and savings goals.",
    icon: DollarSign,
    theme: "finance",
    calculators: [
      {
        id: "loan-payment",
        name: "Loan Payment Calculator",
        description: "Estimate monthly loan payments.",
        icon: DollarSign,
        badge: "coming-soon",
      },
      {
        id: "compound-interest",
        name: "Compound Interest",
        description: "See growth with compounding.",
        icon: Percent,
        badge: "coming-soon",
      },
      {
        id: "savings-goal",
        name: "Savings Goal Calculator",
        description: "How long to reach a goal.",
        icon: PiggyBank,
        badge: "coming-soon",
      },
    ],
  },
  {
    id: "health",
    title: "Health",
    description: "Quick checks for fitness and wellness.",
    icon: HeartPulse,
    theme: "health",
    calculators: [
      {
        id: "bmi",
        name: "BMI Calculator",
        description: "Body mass index from height.",
        icon: Activity,
        badge: "coming-soon",
      },
      {
        id: "calorie",
        name: "Calorie Needs Calculator",
        description: "Daily calorie estimate.",
        icon: HeartPulse,
        badge: "coming-soon",
      },
      {
        id: "due-date",
        name: "Pregnancy Due Date",
        description: "Estimate your due date.",
        icon: Baby,
        badge: "coming-soon",
      },
    ],
  },
  {
    id: "math",
    title: "Math & Education",
    description: "Percentages, averages, and unit helpers.",
    icon: Calculator,
    theme: "math",
    calculators: [
      {
        id: "percentage",
        name: "Percentage Calculator",
        description: "Find percents in seconds.",
        href: "/math/percentage-calculator",
        icon: Percent,
        badge: "popular",
      },
      {
        id: "average",
        name: "Average Calculator",
        description: "Mean of any number list.",
        icon: Sigma,
        badge: "coming-soon",
      },
      {
        id: "unit-converter",
        name: "Unit Converter",
        description: "Length, weight, and volume.",
        icon: Ruler,
        badge: "coming-soon",
      },
      {
        id: "gpa",
        name: "GPA & CGPA Calculator",
        description:
          "SGPA, CGPA, weighted GPA, and 4.0 / 5.0 / 10-point scales.",
        href: "/math/gpa-calculator",
        icon: Scale,
        badge: "popular",
      },
    ],
  },
];

export const LIVE_CALCULATORS = CALCULATOR_CATEGORIES.flatMap((category) =>
  category.calculators.filter((item) => Boolean(item.href)),
);
