/**
 * GoldLondonVault — GPE R24 / F22 (2026-11-19): the London vault stock
 * + clearing volumes cards, Zone K's institutional-plumbing riders
 * (docs/specs/gold-page-elevation: s8/01 R24 · s7/01 §6 item 4 — both
 * collapsed headers with top-line numbers at 390 · s6/02 C6 the
 * "Source: LBMA" attribution row + the four-field disclosure block).
 *
 * THE DATA: ONE key (insights:gold-lbma:v1) served at GET
 * /api/insights/gold-lbma — the vault family (124 monthly rows, gold +
 * silver, koz) + the clearing family (360 monthly rows, the LPMCL net
 * transfers). The tonnes conversion is exact and disclosed (1 ozt =
 * 31.1034768 g); the as-of month renders on every number's line; the
 * method blocks carry the four fields (length/frequency, update
 * schedule, units, methodology — the WGC house grammar, S4/01 §1).
 *
 * Display-only (s6/01 §2b): no meter membership, no voter.
 */

import { useMemo, useState } from 'react';
import { formatNumber } from '@currena/core';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldLbma } from './gold-lbma';

/** The exact koz → tonnes conversion (disclosed in the method block). */
const KOZ_TO_TONNES = 0.0311034768;

/** The month label ("2026-10" → "Oct 2026" / the fa short form). */
function monthLabel(month: string, locale: 'en' | 'fa'): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** The vault series' sparkline path (the 124-month stock, pure). */
function vaultSparkPath(rows: ReadonlyArray<{ month: string; goldKoz: number }>): string {
  if (rows.length < 2) return '';
  const values = rows.map((r) => r.goldKoz);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const w = 200;
  const h = 34;
  return rows
    .map((r, i) => {
      const x = (i / (rows.length - 1)) * w;
      const y = h - 3 - ((r.goldKoz - min) / span) * (h - 6);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** One collapsed rider card (the top-line always visible, 390's rule). */
function RiderCard({
  title,
  topline,
  children,
  dataAttr,
  open,
  onToggle,
  showLabel,
  hideLabel,
}: {
  title: string;
  topline: React.ReactNode;
  children: React.ReactNode;
  dataAttr: string;
  open: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}): React.JSX.Element {
  return (
    <article
      data-lbma-card={dataAttr}
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60"
    >
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{title}</h4>
      {/* The 390 top-line — the number the zone keeps visible. */}
      <p className="m-0 text-[length:var(--type-label)] leading-snug text-[var(--color-text-secondary)]" data-lbma-topline>
        <bdi>{topline}</bdi>
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1 text-start text-[length:var(--type-caption)] font-semibold text-currena-blue"
      >
        <span>{open ? hideLabel : showLabel}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? <div className="flex min-w-0 flex-col gap-1.5">{children}</div> : null}
    </article>
  );
}

export function GoldLondonVault(): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const state = useGoldLbma();
  const [vaultOpen, setVaultOpen] = useState(false);
  const [clearingOpen, setClearingOpen] = useState(false);

  // The pure derivations (no arithmetic in components beyond display
  // formatting — the conversions here are the disclosed unit joins).
  const model = useMemo(() => {
    if (state.kind !== 'ready') return null;
    const { vault, clearing } = state.snapshot;
    const last = vault.rows[vault.rows.length - 1]!;
    const prev = vault.rows[vault.rows.length - 2] ?? null;
    const goldTonnes = last.goldKoz * KOZ_TO_TONNES;
    const silverTonnes = last.silverKoz * KOZ_TO_TONNES;
    const momPct = prev !== null && prev.goldKoz > 0 ? ((last.goldKoz - prev.goldKoz) / prev.goldKoz) * 100 : null;
    const cLast = clearing.rows[clearing.rows.length - 1]!;
    return { vault, clearing, last, prev, goldTonnes, silverTonnes, momPct, cLast };
  }, [state]);

  const num = (v: number, digits = 0): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const monthText = (m: string): string => monthLabel(m, locale);

  if (state.kind === 'loading') {
    return (
      <section aria-label={t('pd.gold.lbmaVaultTitle')} data-gold-lbma="loading" role="status" className="mt-2.5 flex flex-col gap-1.5">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.lbmaVaultTitle')}</h4>
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.gold.loadingLine')}</p>
      </section>
    );
  }
  if (model === null) {
    return (
      <section aria-label={t('pd.gold.lbmaVaultTitle')} data-gold-lbma="none" className="mt-2.5 flex flex-col gap-1.5">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.lbmaVaultTitle')}</h4>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-lbma-unavailable>
          {t('pd.gold.lbmaUnavailable')}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={t('pd.gold.lbmaVaultTitle')} data-gold-lbma className="mt-2.5 flex flex-col gap-2">
      <RiderCard
        title={t('pd.gold.lbmaVaultTitle')}
        dataAttr="vault"
        open={vaultOpen}
        onToggle={() => setVaultOpen((v) => !v)}
        showLabel={t('pd.gold.lbmaShow')}
        hideLabel={t('pd.gold.lbmaHide')}
        topline={
          <>
            {interpolate(t('pd.gold.lbmaVaultTopline'), { tonnes: num(model.goldTonnes) })}
            {' · '}
            <span className="text-[var(--color-text-tertiary)]">
              {interpolate(t('pd.gold.lbmaAsOf'), { month: monthText(model.vault.asOf) })}
            </span>
          </>
        }
      >
        {model.momPct !== null ? (
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-lbma-mom>
            <bdi>
              {interpolate(t('pd.gold.lbmaVaultMom'), {
                pct: `${model.momPct >= 0 ? '+' : '−'}${num(Math.abs(model.momPct), 2)}%`,
              })}
            </bdi>
          </p>
        ) : null}
        {/* The 124-month stock, made visible (a compact sparkline). */}
        <div dir="ltr" className="w-full overflow-hidden" data-lbma-spark>
          <svg viewBox="0 0 200 34" role="img" aria-label={t('pd.gold.lbmaVaultTitle')} className="h-auto w-full">
            <path d={vaultSparkPath(model.vault.rows)} fill="none" stroke="var(--color-accent-gold)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
          <bdi>{interpolate(t('pd.gold.lbmaVaultSilver'), { tonnes: num(model.silverTonnes) })}</bdi>
        </p>
        <details className="text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-lbma-method>
          <summary className="insights-focusable min-h-[44px] cursor-pointer font-semibold text-currena-blue underline-offset-2 hover:underline">
            {t('pd.gold.lbmaMethodTitle')}
          </summary>
          <p className="m-0 pt-1.5">{t('pd.gold.lbmaMethodVault')}</p>
        </details>
      </RiderCard>

      <RiderCard
        title={t('pd.gold.lbmaClearingTitle')}
        dataAttr="clearing"
        open={clearingOpen}
        onToggle={() => setClearingOpen((v) => !v)}
        showLabel={t('pd.gold.lbmaShow')}
        hideLabel={t('pd.gold.lbmaHide')}
        topline={
          <>
            {interpolate(t('pd.gold.lbmaClearingTopline'), {
              moz: num(model.cLast.goldMoz, 1),
              month: monthText(model.clearing.asOf),
            })}
          </>
        }
      >
        <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-lbma-clearing-row>
          <bdi>
            {interpolate(t('pd.gold.lbmaClearingRow'), {
              moz: num(model.cLast.goldMoz, 1),
              bn: num(model.cLast.goldValueBn, 1),
              transfers: num(model.cLast.goldTransfers),
            })}
          </bdi>
        </p>
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{t('pd.gold.lbmaClearingContext')}</bdi>
        </p>
        <details className="text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-lbma-method>
          <summary className="insights-focusable min-h-[44px] cursor-pointer font-semibold text-currena-blue underline-offset-2 hover:underline">
            {t('pd.gold.lbmaMethodTitle')}
          </summary>
          <p className="m-0 pt-1.5">{t('pd.gold.lbmaMethodClearing')}</p>
        </details>
      </RiderCard>
    </section>
  );
}
