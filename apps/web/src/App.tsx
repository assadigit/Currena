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

import { lazy, Suspense, useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Converter } from './routes/Converter';
import { LiveRates } from './routes/LiveRates';
import { navigate, useRoute } from './router';
import { useI18n } from './lib/locale';
import { snapshotStore } from './lib/snapshot-store';
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

/** <title> per route — legacy pattern "<Page> - Currena". */
function titleKeyFor(route: string): TranslationKey {
  switch (route) {
    case '/':
      return 'converter.title';
    case '/live-rates':
      return 'liveRates.title';
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
  const [updateReady, setUpdateReady] = useState(false);

  // PWA updates are user-prompted (registerType: 'prompt'): the old shell
  // used to keep running until a natural reload — now the user gets a toast
  // with a Reload action the moment a new build is waiting.
  const updateSw = registerSW({
    onNeedRefresh() {
      setUpdateReady(true);
    },
  });

  // Boot the snapshot layer once: hydrate last-good, fetch stale sources in
  // parallel (mission §8 — network once per freshness window).
  useEffect(() => {
    snapshotStore.boot();
  }, []);

  useEffect(() => {
    const key = titleKeyFor(route);
    const base = t(key);
    document.title = key === 'converter.title' || key === 'app.name' ? base : `${base} - Currena`;
  }, [route, t, locale]);

  // Belt-and-braces: land on #/ when no hash is present.
  useEffect(() => {
    if (!window.location.hash) navigate('/');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-currena-bg-light text-currena-dark transition-colors duration-300">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
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
          </Suspense>
        </ErrorBoundary>
      </main>
      {updateReady ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-[10001] mx-auto flex max-w-md items-center justify-between gap-3 rounded-[18px] border border-white/40 bg-currena-dark/95 px-4 py-3 text-sm text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <span className="leading-snug">{t('app.updateReady')}</span>
          <button
            type="button"
            onClick={() => updateSw(true)}
            className="shrink-0 cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-bold text-currena-dark transition-all duration-300 hover:-translate-y-0.5"
          >
            {t('app.updateReload')}
          </button>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
