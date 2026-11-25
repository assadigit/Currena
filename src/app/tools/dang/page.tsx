import type { Metadata } from "next";
import DangTool from "@/components/tools/dang";

/**
 * /tools/dang — محاسبه دنگ: «دنگ کردن», the fair split of a shared
 * amount — equal (the common convention: each share = the whole ÷ the
 * number of people) or weighted.
 */

export const metadata: Metadata = {
  title: "Dang — the Fair Split · Currena",
  description:
    "دنگ کردن: each person's share of a shared amount, equal or weighted — each share = the whole ÷ the number of people.",
  keywords: ["dang", "محاسبه دنگ", "دنگ کردن", "تقسیم هزینه", "fair split", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/dang" },
  openGraph: {
    title: "Dang — the Fair Split · Currena",
    description: "دنگ کردن: each person's share of a shared amount, equal or weighted.",
    url: "https://currena.ir/tools/dang",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Dang — the Fair Split · Currena",
    description: "دنگ کردن: each person's share of a shared amount, equal or weighted.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <DangTool />;
}
