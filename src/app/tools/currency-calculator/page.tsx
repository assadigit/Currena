import type { Metadata } from "next";
import CurrencyCalcTool from "@/components/tools/excalc";

/**
 * /tools/currency-calculator — ماشین‌حساب ارزی: the exchange desk's
 * own maths (quote a rate, take a margin, see the profit).
 */

export const metadata: Metadata = {
  title: "Currency Calculator · Currena",
  description:
    "The exchange desk's own maths: quote a rate, take a margin, see the profit — the margin stated, never hidden.",
  keywords: ["currency calculator", "ماشین حساب ارزی", "exchange desk", "صرافی", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/currency-calculator" },
  openGraph: {
    title: "Currency Calculator · Currena",
    description: "Quote a rate, take a margin, see the profit.",
    url: "https://currena.ir/tools/currency-calculator",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Currency Calculator · Currena",
    description: "Quote a rate, take a margin, see the profit.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <CurrencyCalcTool />;
}
