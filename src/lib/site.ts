/**
 * Site identity and canonical origin for CalcDaily.
 * Absolute URLs (canonical, OG, sitemap, JSON-LD, llms.txt) must use SITE_URL.
 */

export const SITE_NAME = "CalcDaily";

export const SITE_TAGLINE = "Free Online Calculators";

/** Amber accent for the "Daily" wordmark segment. AA on white (~4.6:1). */
export const BRAND_ACCENT = "#B45309";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = raw?.replace(/\/$/, "") ?? "";

  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be set in production (e.g. https://calcdaily.app). See .env.example.",
      );
    }
    // Local `next dev` only — never used for production builds.
    return "http://localhost:3000";
  }

  return url;
}

export const SITE_URL = resolveSiteUrl();
