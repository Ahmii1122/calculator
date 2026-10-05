import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Robots rules for Calculator Hub — allow all crawlers; point to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
