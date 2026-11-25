import type { Metadata } from "next";
import GoldHubTool from "@/components/tools/gold-hub";

/**
 * /tools/gold-calculators — محاسبه‌گرهای طلا: the gold hub. All the
 * gold tools imported onto one dedicated page — value (with the
 * shop-invoice fold), mesghal ↔ grams, karat conversion, and today's
 * board — on live prices.
 */

export const metadata: Metadata = {
  title: "Gold Calculators · Currena",
  description:
    "All the gold tools on one page: value, مثقال, karat — on live prices. The bazaar's own constants stated on the page.",
  keywords: [
    "gold calculator",
    "محاسبه گر طلا",
    "قیمت طلا",
    "مثقال",
    "عیار",
    "Currena",
  ],
  alternates: { canonical: "https://currena.ir/tools/gold-calculators" },
  openGraph: {
    title: "Gold Calculators · Currena",
    description: "All the gold tools on one page: value, مثقال, karat — on live prices.",
    url: "https://currena.ir/tools/gold-calculators",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Gold Calculators · Currena",
    description: "All the gold tools on one page: value, مثقال, karat — on live prices.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <GoldHubTool />;
}
