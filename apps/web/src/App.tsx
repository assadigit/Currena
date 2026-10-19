/**
 * App shell — providers, hash router, per-route titles.
 * Sticky-footer layout: min-h-screen flex column with the footer pushed to
 * the bottom on short pages (converter) and below long content otherwise.
 *
 * Phase 5b: the seven tool routes are code-split via React.lazy — the entry
 * chunk carries only the shell + converter + live-rates (mission §8 budget;
 * checklist guardrail "converter route ships first; receipt … lazy"). The
 * PWA precaches every emitted chunk, so offline loading is unaffected.
 */

import { lazy, Suspense, useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/ui';
import { Converter } from './routes/Converter';
import { LiveRates } from './routes/LiveRates';
import { useRoute, canonicalizePathVisit } from './router';
import { useI18n } from './lib/locale';
import { snapshotStore } from './lib/snapshot-store';
import { hydrateServerHistory } from './lib/rate-history';
import { alertsStore } from './lib/alerts';
import { useAlertEvaluation } from './lib/use-alert-evaluation';
import type { TranslationKey } from './lib/locale';

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

/** <title> per route — legacy pattern "<Page> - Currena". */
function titleKeyFor(route: string): TranslationKey {
  switch (route) {
    case '/':
      return 'converter.title';
    case '/live-rates':
      return 'liveRates.title';
    case '/insights':
      return 'insights.title';
    case '/calculator':
      return 'calculator.title';
    case '/history':
      return 'history.title';
    case '/receipt':
      return 'receipt.title';
    case '/splitter':
      return 'expenseSplitter.title';
    case '/settle':
      return 'splitSettle.title';
    case '/batch':
      return 'batchConverter.title';
    case '/about':
      return 'about.title';
    default:
      return 'app.name';
  }
}

function RouteFallback(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
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
    const key = titleKeyFor(route);
    const base = t(key);
    document.title = key === 'converter.title' || key === 'app.name' ? base : `${base} - Currena`;
  }, [route, t, locale]);

  // Path visits (owner report 2026-10-13: "why does /insights#/ happen?"):
  // a hash-less visit to a PATH url — /insights, /insights?card=us10y,
  // /live-rates — adopts that route in place (URL becomes /#/insights, the
  // Insights page renders, no reload, no history entry, no stray '#/'
  // appended). Unknown paths still land on the converter. No-op once a
  // hash exists (every internal navigation).
  useEffect(() => {
    canonicalizePathVisit();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-currena-bg-light text-currena-dark transition-colors duration-300">
      {/* Skip-to-content link (QA audit D-1): keyboard users otherwise tab
          through the brand + 10 nav pills + 4 utility buttons on every
          route. Rendered as a button, not <a href="#…"> — this is a
          hash-router SPA and a hash link would navigate away. */}
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
          {route === '/' ? <Converter /> : null}
          {route === '/live-rates' ? <LiveRates /> : null}
          <Suspense fallback={<RouteFallback />}>
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
