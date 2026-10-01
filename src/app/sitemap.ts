import type { MetadataRoute } from "next";
import { CALCULATOR_CATEGORIES, LIVE_CALCULATORS } from "@/lib/calculators";
import { SITE_URL } from "@/lib/site";

/** Sitemap for Calculator Hub — home, category hubs, and live calculator routes. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const categoryRoutes = CALCULATOR_CATEGORIES.map((category) => ({
    url: `${SITE_URL}/${category.id}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const calculatorRoutes = LIVE_CALCULATORS.map((calculator) => ({
    url: `${SITE_URL}${calculator.href}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.9,
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
  ];
}
