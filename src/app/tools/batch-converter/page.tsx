import type { Metadata } from "next";
import BatchTool from "@/components/tools/batch";

/**
 * /tools/batch-converter — تبدیل گروهی ارزها: a pocket of several
 * currencies, counted together into one (toman by default).
 */

export const metadata: Metadata = {
  title: "Batch Currency Conversion · Currena",
  description:
    "A pocket of several currencies, counted together into one — each line on the live board, the total in your target currency.",
  keywords: ["batch conversion", "تبدیل گروهی ارزها", "currency total", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/batch-converter" },
  openGraph: {
    title: "Batch Currency Conversion · Currena",
    description: "A pocket of several currencies, counted together into one.",
    url: "https://currena.ir/tools/batch-converter",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Batch Currency Conversion · Currena",
    description: "A pocket of several currencies, counted together into one.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <BatchTool />;
}
