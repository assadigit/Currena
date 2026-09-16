/**
 * App shell — providers, hash router, per-route titles.
 * Sticky-footer layout: min-h-screen flex column with the footer pushed to
 * the bottom on short pages (converter) and below long content otherwise.
 */

import { useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Converter } from './routes/Converter';
import { LiveRates } from './routes/LiveRates';
import { Stub } from './routes/Stub';
import { navigate, useRoute } from './router';
import { useI18n } from './lib/locale';
import { snapshotStore } from './lib/snapshot-store';
import type { TranslationKey } from './lib/locale';

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

export function App() {
  const route = useRoute();
  const { t, locale } = useI18n();

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

  // Close the side menu on route change (belt-and-braces; Header also closes).
  useEffect(() => {
    if (!window.location.hash) navigate('/');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-currena-bg-light text-currena-dark transition-colors duration-300 dark:bg-currena-bg-dark dark:text-[#E5E7EB]">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {route === '/' ? <Converter /> : null}
        {route === '/live-rates' ? <LiveRates /> : null}
        {route === '/calculator' ? <Stub emoji="🧮" titleKey="calculator.title" /> : null}
        {route === '/history' ? <Stub emoji="📜" titleKey="history.title" /> : null}
        {route === '/receipt' ? <Stub emoji="📄" titleKey="receipt.title" /> : null}
        {route === '/splitter' ? <Stub emoji="💰" titleKey="expenseSplitter.title" /> : null}
        {route === '/settle' ? <Stub emoji="👥" titleKey="splitSettle.title" /> : null}
        {route === '/batch' ? <Stub emoji="🛒" titleKey="batchConverter.title" /> : null}
        {route === '/about' ? <Stub emoji="ℹ️" titleKey="about.title" /> : null}
      </main>
      <Footer />
    </div>
  );
}
