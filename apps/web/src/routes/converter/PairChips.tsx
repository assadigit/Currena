/**
 * converter/PairChips — the one-tap pair recall chips: recent pairs once
 * a conversion exists, POPULAR pairs on first run (I11) (Phase: WS-4
 * module split of the former Converter.tsx monolith — zero behavior
 * change, code moved verbatim; the shell owns the recents state and the
 * pick action). Direction-aware (ltr chip text), flags inline.
 */

import { useCodeLabel } from '../../lib/display';
import { useI18n } from '../../lib/locale';
import type { RecentPair } from '../../lib/recent-pairs';
import { POPULAR_PAIRS } from './shared';

export function PairChips(props: {
  recentPairs: RecentPair[];
  from: string;
  to: string;
  onPick: (pair: RecentPair) => void;
}) {
  const { t } = useI18n();
  const label = useCodeLabel();
  const { recentPairs, from, to, onPick } = props;

  if (recentPairs.length === 0 && POPULAR_PAIRS.length === 0) return null;

  return (
    <div className="no-print mt-5">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-currena-muted">
        {recentPairs.length > 0 ? `⚡ ${t('converter.recentPairs')}` : `🔥 ${t('converter.popularPairs')}`}
      </p>
      <div className="flex flex-wrap gap-2">
        {(recentPairs.length > 0 ? recentPairs : POPULAR_PAIRS).map((pair) => {
          const active = pair.from === from && pair.to === to;
          return (
            <button
              key={`${pair.from}-${pair.to}`}
              type="button"
              onClick={() => onPick(pair)}
              aria-pressed={active}
              className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                active
                  ? 'border-currena-blue bg-currena-blue/10 text-currena-blue shadow-[0_4px_12px_rgba(74,144,226,0.25)]'
                  : 'border-black/10 bg-currena-soft text-currena-dark hover:border-currena-blue/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-white/10'
              }`}
            >
              <img
                src={`/images/flags/${pair.from.toLowerCase()}.png`}
                alt=""
                className="h-3.5 w-5 rounded-[3px] object-cover"
              />
              <span dir="ltr">{label(pair.from)}</span>
              <span aria-hidden="true" className="opacity-40">→</span>
              <img
                src={`/images/flags/${pair.to.toLowerCase()}.png`}
                alt=""
                className="h-3.5 w-5 rounded-[3px] object-cover"
              />
              <span dir="ltr">{label(pair.to)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
