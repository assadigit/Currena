import type { Metadata } from "next";
import ConverterTool from "@/components/tools/converter";

/**
 * /tools/currency-converter — مبدل ارز. Served natively at the public
 * URL (the worker entry maps /tools/* onto the basePath mount in
 * production); English by default on the server, the toggle is
 * client-side (the site's own language handling).
 */

export const metadata: Metadata = {
  title: "Currency Converter · Currena",
  description:
    "Live free-market rates, between any two currencies through the toman — with the rate and its inverse stated.",
  keywords: ["currency converter", "مبدل ارز", "toman", "exchange rates", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/currency-converter" },
  openGraph: {
    title: "Currency Converter · Currena",
    description: "Live free-market rates, between any two currencies through the toman.",
    url: "https://currena.ir/tools/currency-converter",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Currency Converter · Currena",
    description: "Live free-market rates, between any two currencies through the toman.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <ConverterTool />;
}
