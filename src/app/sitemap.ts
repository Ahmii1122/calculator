import type { MetadataRoute } from "next";
import { CALCULATOR_CATEGORIES, LIVE_CALCULATORS } from "@/lib/calculators";
import { SITE_URL } from "@/lib/site";

/**
 * Sitemap for Calculator Hub — home, live category hubs, live calculators,
 * and static trust pages. Coming-soon tools (no href) are excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const categoryRoutes = CALCULATOR_CATEGORIES.filter((category) =>
    category.calculators.some((calculator) => Boolean(calculator.href)),
  ).map((category) => ({
    url: `${SITE_URL}/${category.id}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const calculatorRoutes = LIVE_CALCULATORS.map((calculator) => ({
    url: `${SITE_URL}${calculator.href}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const staticRoutes = ["/about", "/privacy", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...categoryRoutes,
    ...calculatorRoutes,
    ...staticRoutes,
  ];
}
