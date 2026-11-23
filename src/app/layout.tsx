import type { Metadata } from "next";
import { Poppins, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

/**
 * Currena gold page fonts — Poppins for the Latin stack (the site's
 * shipped identity), Vazirmatn for Farsi (applied through :lang(fa),
 * the Currena bilingual contract: the Farsi face only loads for fa
 * content, English pages keep Poppins).
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gold · Currena",
  description:
    "THE gold card: the 37-voter conditions meter plus the complete gold picture. Today's price, the balance of forces, and the five forces explained in plain language.",
  keywords: ["gold", "gold price", "market briefing", "XAUUSD", "Currena"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${vazirmatn.variable} antialiased bg-[var(--color-currena-bg-light)]`}
      >
        {/* Worker-build seam: keep next-themes' pre-hydration script safe
            under OpenNext esbuild (see the AURUM-era note). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.__name = window.__name || ((f) => f);",
          }}
        />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
