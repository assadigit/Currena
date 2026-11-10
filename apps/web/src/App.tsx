/**
 * App shell — providers, path router, per-route titles.
 * Sticky-footer layout: min-h-screen flex column with the footer pushed to
 * the bottom on short pages (Global) and below long content otherwise.
 *
 * Phase 5b: the seven tool routes are code-split via React.lazy — the entry
 * chunk carries only the shell + live-rates (mission §8 budget; checklist
 * guardrail "converter route ships first; receipt … lazy"). The PWA
 * precaches every emitted chunk, so offline loading is unaffected.
 *
 * Page-division S1 (2026-11-07, D-20/D-46): `/` is now the Global
 * world-scan placeholder (the landing page) and the converter — the eager
 * entry-chunk route until now — is a lazy tool route at `/converter`; the
 * eight market destinations share one lazy placeholder chunk until their
 * build sessions (roadmap S3–S18). Zero content loss anywhere: the legacy
 * /insights page is untouched below its deprecation banner.
 */

import { lazy, Suspense, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/ui';
import { LiveRates } from './routes/LiveRates';
import { useRoute } from './router';
import { useI18n } from './lib/locale';
import { routeMetaFor, setCanonical, setMetaTag } from './lib/route-meta';
import { snapshotStore } from './lib/snapshot-store';
import { hydrateServerHistory } from './lib/rate-history';
import { alertsStore } from './lib/alerts';
import { useAlertEvaluation } from './lib/use-alert-evaluation';

const Calculator = lazy(() => import('./routes/Calculator').then((m) => ({ default: m.Calculator })));
const History = lazy(() => import('./routes/History').then((m) => ({ default: m.History })));
const BatchConverter = lazy(() =>
  import('./routes/BatchConverter').then((m) => ({ default: m.BatchConverter })),
);
const Splitter = lazy(() => import('./routes/Splitter').then((m) => ({ default: m.Splitter })));
const Settle = lazy(() => import('./routes/Settle').then((m) => ({ default: m.Settle })));
const Receipt = lazy(() => import('./routes/Receipt').then((m) => ({ default: m.Receipt })));
const About = lazy(() => import('./routes/About').then((m) => ({ default: m.About })));
const Insights = lazy(() => import('./routes/Insights').then((m) => ({ default: m.Insights })));
// Page-division S1 (D-46): the Converter — the app's founding tool, eager
// in the entry chunk until now — becomes a lazy tool route at /converter so
// the Global page (D-20: the landing page) owns `/`. The placeholder
// skeleton for the eight destinations is one shared lazy chunk.
const Converter = lazy(() => import('./routes/Converter').then((m) => ({ default: m.Converter })));
const PagePlaceholder = lazy(() =>
  import('./routes/page-division/PagePlaceholder').then((m) => ({ default: m.PagePlaceholder })),
);
// Page-division S3 (2026-11-08): the Global world scan — the D-21 verdict
// board. Lazy like the Insights route (the engine modules + the board
// clients ride the chunk; the entry graph stays the money page's own).
const GlobalPage = lazy(() => import('./routes/page-division/GlobalPage').then((m) => ({ default: m.GlobalPage })));
// Page-division S5 (2026-11-08): the Gold page — the 37-voter conditions
// meter (D-26…D-29). Lazy like the Global route (the engine modules ride
// the chunk; the entry graph stays untouched).
const GoldPage = lazy(() => import('./routes/page-division/GoldPage').then((m) => ({ default: m.GoldPage })));
// Page-division S7 (2026-11-08): the World Markets page — the D-43 map
// hero + the region grids + the world risk cards. Lazy like the Gold
// route (the WorldMap module + the pure derivations ride the chunk; the
// entry graph stays untouched).
const WorldMarketsPage = lazy(() =>
  import('./routes/page-division/WorldMarketsPage').then((m) => ({ default: m.WorldMarketsPage })),
);
// Page-division S9 (2026-11-09): the USA route leaves the region set —
// its own lazy chunk (the S5 GoldPage pattern): the D-30 verdict strip
// + the D-29 tier-1/tier-2 cards render above the SAME S8 zoom section
// (RegionIndexSection, shared with the region chunk), with the honest
// still-building record below (tiers 3–6 + the TIC board are S10's).
const UsaPage = lazy(() => import('./routes/page-division/UsaPage').then((m) => ({ default: m.UsaPage })));
// Page-division S12 (2026-11-09): the Europe route leaves the region set
// — its own lazy chunk (the UsaPage pattern): the EU section + the non-EU
// UK section (D-33) render above the SAME S8 zoom section (the STOXX50E ·
// DAX · CAC · FTSE zoom), plus the cross-links to /currencies (§8 item 4).
const EuropePage = lazy(() => import('./routes/page-division/EuropePage').then((m) => ({ default: m.EuropePage })));
// Page-division S14 (2026-11-09): the Asia & Pacific route leaves the
// region set — its own lazy chunk (the UsaPage/EuropePage pattern): the
// five sub-regions (D-35: China · Japan · Korea/Taiwan/HK · India ·
// Pacific-NZ) render above the SAME S8 zoom section (the N225 · KOSPI ·
// HSI · SSEC · TAIEX · NIFTY50 zoom), plus the cross-links to
// /currencies + /gold (§9). The In-build chip stays (the §15 FRED-only
// CPI fills are verified-pending-ingest, Rule 5 — BD-S14a; the chip
// retires at the S15 gates pass, the Europe S12→S13 trajectory).
const AsiaPage = lazy(() => import('./routes/page-division/AsiaPage').then((m) => ({ default: m.AsiaPage })));
// Page-division S16 (2026-11-10): the Australia route leaves the region
// set — its own lazy chunk (the UsaPage/EuropePage/AsiaPage pattern): the
// AU Markets board (the REUSED AustralianMarkets drawing through the lean
// pd.australia adapter, its own board feed) renders above the SAME S8
// zoom section (the ASX 200 map), then the five gauge sections (D-37: the
// unchanged 3-voting + 2-shadow structure — 28 cards) with the 11
// moved-out seat chips linking to their new homes (§10 "Moved out").
// RegionPage serves no route anymore (all four region routes have their
// own pages) — the shared RegionIndexSection (the S8 zoom section) rides
// its own shared chunk every region page loads.
const AustraliaPage = lazy(() => import('./routes/page-division/AustraliaPage').then((m) => ({ default: m.AustraliaPage })));
// Page-division S17 (2026-11-11): the Commodities route leaves the
// placeholder set — its own lazy chunk (the UsaPage/EuropePage/AsiaPage/
// AustraliaPage pattern): the four commodity groups (Energy · Metals ·
// Agriculture · Digital) + the Trade routes & supply group (D-38/D-39)
// render as 24 cards with the §21 trio, plus the gold cross-link to
// /gold (D-19/D-27). The In-build chip stays (the S17 build session —
// the chip retires at the S17 gates pass, the S13/S15/S16 trajectory).
const CommoditiesPage = lazy(() => import('./routes/page-division/CommoditiesPage').then((m) => ({ default: m.CommoditiesPage })));
// Page-division S18 (2026-11-11): the Currencies route leaves the
// placeholder set — its own lazy chunk (the CommoditiesPage pattern):
// the 7 rule lights hero (D-41) + the 11-pair board (D-42, AUDNZD the
// 11th pair) + the dollar-standing section (D-32) — 14 registry cards
// with the §21 trio over the S2 projection, plus the FX-board payload
// wiring (GET /api/insights/fx, the markets/fx last-good discipline).
// The In-build chip stays (the S18 build session — the chip retires at
// the S18 gates pass, the S16/S17 one-session trajectory).
const CurrenciesPage = lazy(() => import('./routes/page-division/CurrenciesPage').then((m) => ({ default: m.CurrenciesPage })));

/** No destination route shares the placeholder chunk anymore (S8: the
 *  four region pages left the set; S9: /usa + S12: /europe + S14:
 *  /asia-pacific + S16: /australia + S17: /commodities + S18:
 *  /currencies left it for their own builds — every destination now
 *  renders its own page chunk). The PagePlaceholder module stays wired
 *  (its lazy import costs nothing when no route matches) for any future
 *  destination added before its build session lands. */
const DESTINATION_ROUTES: ReadonlySet<string> = new Set([]);

/* Page-division S16 (2026-11-10): no route renders RegionPage anymore —
 * all four region routes (/usa S9 · /europe S12 · /asia-pacific S14 ·
 * /australia S16) left the set for their own page chunks, and the module
 * retired (the shared RegionIndexSection they all render rides its own
 * shared chunk). */

function RouteFallback(): React.JSX.Element {
  return (
    // 2026-10-29 owner round ("the three circles must sit dead centre"):
    // the box fills the content area BELOW the fixed header (main's pt-16 /
    // lg:pt-20) and centres on BOTH axes — 60vh left the dots sitting above
    // the true middle on tall screens. dvh tracks mobile dynamic viewports.
    <div
      className="flex min-h-[calc(100dvh-4rem)] items-center justify-center lg:min-h-[calc(100dvh-5rem)]"
      role="status"
    >
      <div className="rounded-[25px] bg-currena-soft/60 px-10 py-8">
        <div className="flex justify-center gap-2.5">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>
      </div>
    </div>
  );
}

export function App() {
  const route = useRoute();
  const { t, locale } = useI18n();
  // I14 — rate alerts: evaluate crossings on every snapshot generation
  // (app-wide, not converter-local) and surface the fired toast.
  const { firedToast } = useAlertEvaluation();

  // PWA updates are AUTO (registerType: 'autoUpdate', owner request
  // 2026-09-19): the new service worker skipWaiting-activates the moment it
  // installs and the register script reloads the page on controllerchange —
  // no prompt, no clicking, no visitor stuck on the previous version. The
  // browser only checks sw.js on navigation, so long-lived tabs (the
  // installed standalone PWA) get an explicit hourly r.update().
  // 2026-10-18: the controllerchange reload below was DOCUMENTED but never
  // implemented — a visitor whose page was already loaded by the previous
  // worker kept looking at the old precache even after the new worker
  // claimed control (the owner's "still black and white" report: one
  // reload updated the SW, a SECOND reload was needed to see it). The
  // controllerchange listener closes that gap: the moment the new worker
  // takes control, the page reloads once and the visitor sees the version
  // the new worker serves. (vite-plugin-pwa's RegisterSWOptions has no
  // onControllerChange in this version — the navigator event is the
  // documented equivalent; the once-guard keeps a double-fire from
  // reloading twice.)
  registerSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        window.setInterval(() => {
          void registration.update().catch(() => undefined);
        }, 60 * 60 * 1_000);
      }
    },
  });
  if ('serviceWorker' in navigator) {
    let reloadedByControllerChange = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedByControllerChange) return;
      reloadedByControllerChange = true;
      window.location.reload();
    });
  }

  // Boot the snapshot layer once: hydrate last-good, fetch stale sources in
  // parallel (mission §8 — network once per freshness window).
  // Task 24: also pull the server-recorded rate history so sparklines draw
  // real multi-day per-currency movement (silent no-op offline).
  useEffect(() => {
    snapshotStore.boot();
    void hydrateServerHistory();
    alertsStore.getState(); // boot the alerts store (hydration + storage listener)
  }, []);

  useEffect(() => {
    // S19 (2026-11-12): the per-route <head> pass. The S1 title wiring
    // moved verbatim into lib/route-meta (one table, unit-tested); the
    // effect now also sets the meta description, the Open Graph /
    // Twitter card fields, og:locale and the canonical URL per route —
    // the nine destinations reuse their DICTIONARY PURPOSE lines as
    // descriptions (D-48: one wording per concept), everything else
    // falls back to the app-wide default (app.metaDescription). SPA
    // honesty (BD-S19c): these serve every JS-executing reader; the
    // static index.html defaults serve non-JS crawlers.
    const meta = routeMetaFor(route);
    const base = t(meta.titleKey);
    const title = meta.titleKey === 'converter.title' || meta.titleKey === 'app.name' ? base : `${base} - Currena`;
    document.title = title;
    const description = meta.descriptionKey !== null ? t(meta.descriptionKey) : t('app.metaDescription');
    const url = `${window.location.origin}${meta.path}`;
    setMetaTag('description', 'name', description);
    setMetaTag('og:title', 'property', title);
    setMetaTag('og:description', 'property', description);
    setMetaTag('og:url', 'property', url);
    setMetaTag('og:locale', 'property', locale === 'fa' ? 'fa_IR' : 'en_US');
    setMetaTag('twitter:title', 'name', title);
    setMetaTag('twitter:description', 'name', description);
    setCanonical(url);
  }, [route, t, locale]);

  return (
    <div className="flex min-h-screen flex-col bg-currena-bg-light text-currena-dark transition-colors duration-300">
      {/* Skip-to-content link (QA audit D-1): keyboard users otherwise tab
          through the brand + 10 nav pills + 4 utility buttons on every
          route. Rendered as a button, not <a href="#…"> — a hash anchor
          would muddle the path-router's clean URL. */}
      <button
        type="button"
        onClick={() => {
          const main = document.getElementById('main-content');
          if (main === null) return;
          main.focus({ preventScroll: true });
          main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[1002] focus:rounded-lg focus:bg-currena-blue focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
      >
        {t('nav.skipToContent')}
      </button>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-16 focus:outline-none lg:pt-20">
        <ErrorBoundary>
          {/* Page-division S3 (D-20/D-46): `/` is the Global world scan —
              the D-21 verdict board, built on the S2 projection contract;
              S5 (D-26…D-29): `/gold` is the Gold conditions meter;
              S7 (D-43/D-47): `/world-markets` is the World Markets page;
              S8 (D-13/D-44): the REGION pages render their zoom
              sections; S9 (D-29/D-30): `/usa` renders its own UsaPage
              (the verdict strip + tiers 1–2 above the S8 zoom); S16
              (D-6/D-37): `/australia` renders its own AustraliaPage
              (the AU Markets board + the five gauge sections above the
              S8 zoom); S17 (D-19/D-38/D-39): `/commodities` renders its
              own CommoditiesPage (the four commodity groups + the trade
              routes & supply group — 24 cards + the gold cross-link);
              S18 (D-41/D-42/D-32): `/currencies` renders its own
              CurrenciesPage (the rule lights hero + the 11-pair board
              + the dollar-standing cards); every destination now has
              its real page — the placeholder serves no route; the
              Converter lives at /converter. */}
          {route === '/live-rates' ? <LiveRates /> : null}
          <Suspense fallback={<RouteFallback />}>
            {route === '/' ? <GlobalPage /> : null}
            {route === '/gold' ? <GoldPage /> : null}
            {route === '/world-markets' ? <WorldMarketsPage /> : null}
            {route === '/usa' ? <UsaPage /> : null}
            {route === '/europe' ? <EuropePage /> : null}
            {route === '/asia-pacific' ? <AsiaPage /> : null}
            {route === '/australia' ? <AustraliaPage /> : null}
            {route === '/commodities' ? <CommoditiesPage /> : null}
            {route === '/currencies' ? <CurrenciesPage /> : null}
            {route === '/converter' ? <Converter /> : null}
            {DESTINATION_ROUTES.has(route) ? <PagePlaceholder /> : null}
            {route === '/calculator' ? <Calculator /> : null}
            {route === '/history' ? <History /> : null}
            {route === '/receipt' ? <Receipt /> : null}
            {route === '/splitter' ? <Splitter /> : null}
            {route === '/settle' ? <Settle /> : null}
            {route === '/batch' ? <BatchConverter /> : null}
            {route === '/about' ? <About /> : null}
            {route === '/insights' ? <Insights /> : null}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      {/* I14 — fired-alert toast (auto-dismisses; dialog open clears it) */}
      {firedToast ? <Toast message={firedToast} /> : null}
    </div>
  );
}
