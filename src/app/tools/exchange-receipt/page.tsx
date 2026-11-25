import type { Metadata } from "next";
import ReceiptTool from "@/components/tools/receipt";

/**
 * /tools/exchange-receipt — رسیدساز ارزی: write the deal, print a
 * clean receipt for the customer.
 */

export const metadata: Metadata = {
  title: "Exchange Receipt · Currena",
  description:
    "Write the deal, print a clean receipt for the customer — the rate prefilled from the live board, the total stated plainly.",
  keywords: ["exchange receipt", "رسیدساز ارزی", "رسید", "صرف", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/exchange-receipt" },
  openGraph: {
    title: "Exchange Receipt · Currena",
    description: "Write the deal, print a clean receipt for the customer.",
    url: "https://currena.ir/tools/exchange-receipt",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Exchange Receipt · Currena",
    description: "Write the deal, print a clean receipt for the customer.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <ReceiptTool />;
}
