"use client";

import * as React from "react";
import { Download, ExternalLink, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * The offline snapshot kiosk for the Currena gold page.
 *
 * The right-hand Preview Panel shows the full gold page (rendered from the
 * single-file offline edition), and the Download button hands over that exact
 * file — one HTML document carrying the whole page: both locales (EN + fa
 * with RTL), light/dark themes, all sections and all live data captured at
 * snapshot time. It opens and works with zero internet access.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <WifiOff className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-tight">
                Currena Gold — Offline Snapshot
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Captured 23 Nov 2026, 08:42 Tehran · single 1.4 MB HTML file ·
                works with zero internet
              </p>
            </div>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal">
              EN + فارسی · RTL
            </Badge>
            <Badge variant="outline" className="font-normal">
              Light / Dark
            </Badge>
            <a
              href="/currena-gold-offline.html"
              download="currena-gold-offline.html"
              className="inline-flex"
            >
              <Button size="sm">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download the offline HTML
              </Button>
            </a>
            <a
              href="/currena-gold-offline.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open standalone
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <iframe
          src="/currena-gold-offline.html"
          title="Currena Gold — offline snapshot"
          className="min-h-0 w-full flex-1 border-0"
        />
      </main>

      <footer className="mt-auto border-t bg-card">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs text-muted-foreground">
          Offline edition — data frozen at the capture moment (gold $3,532.83 ·
          2026-11-22). For live prices, reopen currena.ir/gold whenever your
          ISP allows.
        </div>
      </footer>
    </div>
  );
}
