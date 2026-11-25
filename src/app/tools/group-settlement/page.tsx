import type { Metadata } from "next";
import SettleTool from "@/components/tools/settle";

/**
 * /tools/group-settlement — تسویه گروهی: who paid, who owes — the
 * smallest set of transfers that squares everyone.
 */

export const metadata: Metadata = {
  title: "Group Settlement · Currena",
  description:
    "Who paid, who owes — the smallest set of transfers that squares everyone. Enter the expenses as paid; the settlement does the rest.",
  keywords: ["group settlement", "تسویه گروهی", "تقسیم هزینه گروهی", "splitwise", "Currena"],
  alternates: { canonical: "https://currena.ir/tools/group-settlement" },
  openGraph: {
    title: "Group Settlement · Currena",
    description: "Who paid, who owes — the smallest set of transfers that squares everyone.",
    url: "https://currena.ir/tools/group-settlement",
    siteName: "Currena",
    type: "website",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
  twitter: {
    card: "summary",
    title: "Group Settlement · Currena",
    description: "Who paid, who owes — the smallest set of transfers that squares everyone.",
    images: ["https://currena.ir/icons/icon-512.png"],
  },
};

export default function Page() {
  return <SettleTool />;
}
