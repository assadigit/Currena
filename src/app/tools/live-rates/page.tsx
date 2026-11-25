import type { Metadata } from "next";
import LiveRatesTool from "@/components/tools/live-rates";

/**
 * /tools/live-rates — تابلوی نرخ‌های لحظه‌ای: the whole board, every
 * currency and every gold row, refreshed every minute.
 */

export const metadata: Metadata = {
  title: "Live Rates Board · Currena",
  description:
    "The whole board — every currency and every gold row in toman (the global ounce in USD), refreshed every minute.",
  keywords: ["live rates", "تابلوی نرخ های لحظه ای", "نرخ لحظه ای", "gold price", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/live-rates" },
  openGraph: {
    title: "Live Rates Board · Currena",
    description: "The whole board — every currency and every gold row, refreshed every minute.",
    url: "https://currena.ir/tools/live-rates",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Live Rates Board · Currena",
    description: "The whole board — every currency and every gold row, refreshed every minute.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <LiveRatesTool />;
}
