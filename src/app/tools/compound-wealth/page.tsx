import type { Metadata } from "next";
import CompoundWealthApp from "@/components/compound/app";
import { thisMonth } from "@/lib/compound/maths";

/**
 * /tools/compound-wealth — the tool page (spec §3, §5).
 *
 * Served natively at /tools/compound-wealth (the middleware maps the
 * public URL onto the basePath-mounted route in production). English by
 * default on the server (the site's own language handling: the toggle
 * is client-side, SSR renders en/LTR first so hydration matches); the
 * metadata is static in the page language of the first paint.
 */

export const metadata: Metadata = {
  title: "Compound Wealth · Currena",
  description:
    "See what small, steady investing becomes. A quiet compound-growth tool: pick an amount, a few years and an asset, and see the answer in future money and today's money, after realistic costs.",
  keywords: [
    "compound interest",
    "compound growth",
    "investing calculator",
    "regular investing",
    "Currena",
  ],
  alternates: {
    canonical: "https://currena.ir/tools/compound-wealth",
  },
  openGraph: {
    title: "Compound Wealth · Currena",
    description:
      "See what small, steady investing becomes — in future money and today's money, after realistic costs.",
    url: "https://currena.ir/tools/compound-wealth",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Compound Wealth · Currena",
    description:
      "See what small, steady investing becomes — in future money and today's money, after realistic costs.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function CompoundWealthPage() {
  /* The server's own month, passed down so the client's first render
     matches the SSR text exactly (the start month drives every date on
     the page). If the month rolls between render and hydration — a
     seconds-wide window at a UTC month boundary — the app corrects
     itself after mount instead of logging a hydration mismatch. */
  return <CompoundWealthApp ssrStartMonth={thisMonth()} />;
}
