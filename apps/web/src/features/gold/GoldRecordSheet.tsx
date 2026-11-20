/**
 * GoldRecordSheet — the gold record's EXPANDED + TECHNICAL tiers
 * (GUX-S5 M4, 11 §7.1/§7.2 + 08 §3/§9): the popover/sheet that opens
 * from any lane card row, re-scoped to 09's authored content.
 *
 * THE CONTRACT (11 §7.2): the shipped `.insights-panel` geometry —
 * desktop ≥ lg the inline-end sheet `min(440px, 92vw)`, mobile the
 * bottom sheet `max-height: 88dvh` (the shipped CSS media query owns
 * the switch, never JS) — scrim, focus trap, Escape, focus return,
 * body scroll lock: all the shipped behaviors, re-implemented here on
 * the same class names so the gold route's sheet inherits the SAME
 * chrome (one CSS surface, two content contracts — this sheet speaks
 * 09's ten dimensions, the insights panel keeps the corpus contract).
 *
 * THE CONTENT TIERS (11 §7.1):
 *   EXPANDED — the brief's plainLabel + defaultCopy (eager) + the
 *   record's whyGold (whatWhy) · rises/falls through polarity · the
 *   analogy where 09 authored one (9 records) · the mark repeated
 *   larger with its trail.
 *   TECHNICAL — a <details> disclosure INSIDE the sheet (collapsed):
 *   techName · the raw value + unit · source + as-of · the
 *   referencePeriod definition · the firingRule · the record's known
 *   limits (09's visualReading sentence) · the relationship one-liners
 *   (the R-ids, named — the explorer links stay S6's, the ids are
 *   printed as the honest pointer).
 *
 * THE LAZY TIER: the deep content (all 52 records) loads through
 * loadGoldDeep's two static dynamic-import branches ON FIRST OPEN —
 * the closed cards never pay for it (08 §9.2; the bundle's deep
 * chunks stay their own lazy files). While it loads: the sheet renders
 * the brief tier + a waiting line (never a blank sheet).
 *
 * The Q-gates hold: no five-state word, no horizon, no scenario — the
 * sheet is a RECORD presentation, never a forecast surface.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatNumber } from '@currena/core';
import { useI18n } from '../../shared/lib/locale';
import { goldBrief, loadGoldDeep, type GoldVoterDeepRecord } from './content/gold-content';
import { SeatMark, type SeatMarkModel } from './SeatMark';
import type { GoldVoterId } from './gold-tiles';
import type { IndicatorReading } from '@currena/core';

/** The open-record state GoldSeats/GoldPage own (the sheet is dumb). */
export interface GoldRecordSheetState {
  id: GoldVoterId;
  opener: HTMLElement | null;
  /** The seat's mark model — the sheet repeats the mark larger (11 §7.1). */
  mark: SeatMarkModel;
  /** The reading (the technical tier's raw value + as-of + source). */
  reading: IndicatorReading | undefined;
}

export function GoldRecordSheet({ state, onClose }: { state: GoldRecordSheetState; onClose: () => void }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const headingId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [deep, setDeep] = useState<GoldVoterDeepRecord | null>(null);

  // The lazy tier: fetch the selected locale's deep map on open (the
  // dynamic-import branch — the deep chunk is its own file, paid here).
  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the record-change reset is the sheet's own trigger (the Signals expand-on-token precedent)
    setDeep(null);
    void loadGoldDeep(locale).then((map) => {
      const record = map[state.id];
      if (alive && record !== undefined && 'firingRule' in record) setDeep(record);
    });
    return () => {
      alive = false;
    };
  }, [state.id, locale]);

  // Focus trap + Escape + focus return + body scroll lock (the shipped
  // panel's own discipline, verbatim).
  useEffect(() => {
    const opener = state.opener;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('[data-panel-heading]')?.focus();
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || panelRef.current === null) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      style.overflow = prevOverflow;
      if (opener !== null && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [onClose, state.opener]);

  const brief = goldBrief(locale)[state.id];
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 2 });

  const asOfText =
    state.reading?.asOf != null
      ? new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(state.reading.asOf))
      : null;

  return createPortal(
    <>
      <div className="insights-panel-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        data-gold-record-sheet={state.id}
        className="insights-panel"
      >
        <header className="flex items-start justify-between gap-3 border-block-end border-[var(--color-border)] p-4">
          <div className="min-w-0">
            <h3
              id={headingId}
              data-panel-heading=""
              tabIndex={-1}
              className="type-section m-0 leading-snug text-[var(--color-text-primary)] outline-none"
            >
              {brief?.plainLabel ?? deep?.plainLabel ?? state.id}
            </h3>
            {deep !== null ? (
              <p className="m-0 mt-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{deep.techName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="insights-focusable inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--color-border)] px-3 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-status-alert)]/50 hover:text-[var(--color-status-alert)]"
          >
            <X aria-hidden size={17} strokeWidth={2} />
            <span className="sr-only">{t('pd.gold.sheetClose')}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {/* The default copy — the brief tier renders instantly (eager);
           * the deep tier's richer fields render when the chunk lands. */}
          {brief !== null ? (
            <p className="m-0 mb-4 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]" data-sheet-default-copy>
              {brief.defaultCopy}
            </p>
          ) : null}

          {/* The mark repeated larger with its trail (11 §7.1). */}
          <div className="mb-4" data-sheet-mark>
            <SeatMark id={state.id} model={state.mark} />
          </div>

          {deep === null ? (
            <p className="m-0 mb-4 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" role="status" data-sheet-deep-waiting>
              {t('pd.gold.sheetDeepWaiting')}
            </p>
          ) : (
            <>
              {/* EXPANDED (11 §7.1): whatWhy · rises/falls · analogy. */}
              <section className="mb-4">
                <h4 className="m-0 mb-1 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">{t('pd.gold.sheetWhatWhyTitle')}</h4>
                <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90" data-sheet-whatwhy>
                  {deep.whatWhy}
                </p>
              </section>
              <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <h4 className="m-0 mb-1 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">{t('pd.gold.sheetRisesTitle')}</h4>
                  <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90" data-sheet-rises>
                    {deep.rises}
                  </p>
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">{t('pd.gold.sheetFallsTitle')}</h4>
                  <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90" data-sheet-falls>
                    {deep.falls}
                  </p>
                </div>
              </section>
              {deep.analogy !== undefined ? (
                <section className="mb-4">
                  <h4 className="m-0 mb-1 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-status-context)]">{t('pd.gold.sheetAnalogyTitle')}</h4>
                  <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-primary)]/90 italic" data-sheet-analogy>
                    {deep.analogy}
                  </p>
                </section>
              ) : null}

              {/* TECHNICAL (11 §7.1): the <details> disclosure — collapsed
               * by default; every row uniform (08 §3's fields). */}
              <details className="rounded-[var(--radius-md)] ring-1 ring-[var(--color-border)]" data-sheet-technical>
                <summary className="insights-focusable min-h-[44px] cursor-pointer select-none px-3 py-2 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
                  {t('pd.gold.sheetTechnicalTitle')}
                </summary>
                <div className="flex flex-col gap-2 px-3 pb-3 pt-1 text-[length:var(--type-label)] leading-relaxed">
                  <TechnicalRow label={t('pd.gold.sheetTechName')} value={deep.techName} />
                  <TechnicalRow
                    label={t('pd.gold.sheetRawValue')}
                    value={state.reading?.value != null ? `${num(state.reading.value)} ${deep.unit}` : t('pd.gold.valueUnavailable')}
                  />
                  <TechnicalRow label={t('pd.gold.sheetSource')} value={`${deep.source}${asOfText !== null ? ` · ${t('pd.gold.sheetAsOf', { date: asOfText })}` : ''}`} />
                  <TechnicalRow label={t('pd.gold.sheetReferencePeriod')} value={deep.referencePeriod} />
                  <TechnicalRow label={t('pd.gold.sheetFiringRule')} value={deep.firingRule} />
                  <TechnicalRow label={t('pd.gold.sheetVisualReading')} value={deep.visualReading} />
                  {deep.relations.length > 0 ? (
                    <TechnicalRow label={t('pd.gold.sheetRelations')} value={deep.relations.join(' · ')} />
                  ) : null}
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

function TechnicalRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <p className="m-0 flex flex-wrap items-baseline gap-x-2">
      <span className="font-bold text-[var(--color-text-secondary)]">{label}:</span>
      <bdi className="text-[var(--color-text-primary)]/90">{value}</bdi>
    </p>
  );
}
