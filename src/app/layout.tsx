import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AURUM Desk — Gold Intelligence & Visual Explanation",
  description:
    "A daily gold-market briefing (S8) with a supporting-visuals layer (S9): driver attribution, cross-asset correlations, positioning, scenario paths and explainable charts.",
  keywords: [
    "gold",
    "market intelligence",
    "briefing",
    "data visualisation",
    "driver attribution",
    "scenarios",
  ],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Worker-build seam: OpenNext's esbuild bundling (keep-names) leaves
            a `__name(...)` helper call inside next-themes' pre-hydration
            inline script, but the helper itself lives in the server bundle
            and is undefined in the browser — the script dies before it can
            apply the saved theme, leaving a flash of the wrong theme. The
            identity no-op below is defined before that script so it runs to
            completion. (A no-op everywhere else: the sandbox build has its
            own `__name`.) */}
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
