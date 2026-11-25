import type { Metadata } from "next";
import ToolsIndex from "@/components/compound/tools-index";

/**
 * /tools — the tools index (spec §3): a simple list of tool cards.
 * Served natively at /tools (the middleware maps the public URL onto
 * the basePath-mounted route in production).
 */

export const metadata: Metadata = {
  title: "Tools · Currena",
  description:
    "Small, quiet tools for money questions: the Compound Wealth growth tool, plus the Currena currency converter.",
  keywords: ["Currena", "tools", "compound growth", "currency converter"],
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
