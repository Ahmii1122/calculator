import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Free online calculators for dates, math, and everyday planning.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground selection:bg-zinc-900 selection:text-white">
        <aside
          aria-label="Announcement"
          className="border-b border-zinc-800 bg-[#121316] px-4 py-2 text-center text-xs text-zinc-300"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 font-medium">
            <span className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200">
              Privacy First
            </span>
            <span>
              All calculations run in your browser — zero tracking, zero data
              storage.
            </span>
          </div>
        </aside>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
