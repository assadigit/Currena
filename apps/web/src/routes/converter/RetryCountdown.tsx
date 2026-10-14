/**
 * converter/RetryCountdown — I12's live countdown to the store's next
 * automatic retry, rendered under the failure card (Phase: WS-4 module
 * split of the former Converter.tsx monolith — zero behavior change, code
 * moved verbatim). Ticks locally every second (the store state itself
 * never re-emits — `nextRetryAt` is a single immutable stamp), stops
 * itself when the moment passes, and renders localized digits.
 */

import { useEffect, useState } from 'react';
import { formatNumber } from '@currena/core';
import { useI18n } from '../../lib/locale';

export function RetryCountdown({ targetMs }: { targetMs: number }) {
  const { t, numberLocale } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const seconds = Math.ceil((targetMs - now) / 1000);
  if (seconds <= 0) return null;
  return (
    <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-currena-warning-deep" aria-live="polite">
      <span className="warning-pulse" aria-hidden="true">
        ⏳
      </span>
      {t('errors.retryingIn', { seconds: formatNumber(seconds, numberLocale) })}
    </p>
  );
}
