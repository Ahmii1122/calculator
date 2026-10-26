import Image from "next/image";
import { SITE_NAME } from "@/lib/site";

type SiteLogoProps = {
  /** Rendered height in pixels; width follows the SVG aspect ratio. */
  height?: number;
  className?: string;
};

const ASPECT = 1400 / 320;

/** Full CalcDaily lockup (mark + wordmark) from the brand SVG. */
export function SiteLogo({ height = 36, className = "" }: SiteLogoProps) {
  const width = Math.round(height * ASPECT);

  return (
    <Image
      src="/brand/calcdaily-logo.svg"
      alt={SITE_NAME}
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
