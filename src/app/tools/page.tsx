import type { Metadata } from "next";
import ToolsIndex from "@/components/compound/tools-index";

/**
 * /tools — the tools index: every tool on currena.ir/tools, read from
 * the one registry (src/lib/tools/registry.ts). Served natively at
 * /tools (the middleware maps the public URL onto the basePath-mounted
 * route in production).
 */

export const metadata: Metadata = {
  title: "Tools · Currena",
  description:
    "Small, quiet tools for money questions: compound wealth, the currency converter, the live rates board, the exchange desk's calculator and receipt maker, the gold calculators, the fair split and the group settlement.",
  keywords: [
    "Currena",
    "tools",
    "ابزارها",
    "compound growth",
    "currency converter",
    "مبدل ارز",
    "live rates",
    "تابلوی نرخ های لحظه ای",
    "gold calculator",
    "محاسبه گر طلا",
    "fair split",
    "محاسبه دنگ",
    "group settlement",
    "تسویه گروهی",
  ],
  alternates: {
    canonical: "https://currena.ir/tools",
  },
  openGraph: {
    title: "Tools · Currena",
    description: "Small, quiet tools for money questions.",
    url: "https://currena.ir/tools",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Tools · Currena",
    description: "Small, quiet tools for money questions.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function ToolsPage() {
  return <ToolsIndex />;
}
