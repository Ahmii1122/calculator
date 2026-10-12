import { buildLlmsTxt } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Build /llms.txt at build time from the calculator catalog. */
export const dynamic = "force-static";

export function GET() {
  const body = buildLlmsTxt({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
