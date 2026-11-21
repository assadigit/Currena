/**
 * GoldPublicationNotes — the Gold page's footer-positioned publication-notes
 * disclosure (the owner-directed relocation, BD-S43, 2026-11-20).
 *
 * WHAT MOVED HERE: the §16 licence wall — the four blocked-quartet honest
 * notes (GOLD_BLOCKED_NOTES, the placement module's own table, each stating
 * WHY it is absent + the owner's lever, GPE R09 / F13) with its ONE
 * link-out to the public data-sources document (GPE-S2-22) — and the
 * projection's absent-count line (the old Zone A header note, its copy and
 * its formatNumber digit rule unchanged). The honest content is BYTE-FOR-
 * BYTE the same copy; only its PLACE and its DEFAULT VISIBILITY changed:
 * the wall rode the main content flow (between Zone K and the honest
 * record) and the absent note rode the page header; both now ride the
 * PAGE TAIL — the footer position, COLLAPSED BY DEFAULT (the house
 * progressive-disclosure pattern: the GoldIfBought/GoldOnRamp toggle —
 * button + aria-expanded + the rotating ChevronDown). A normal user
 * reading the page never meets licence/venue bookkeeping; one tap opens
 * the full honest record.
 *
 * The anchor contract survives the move: the disclosure's root keeps
 * id="gold-blocked" + data-gold-blocked, so the historical in-page target
 * of the old absent-note link still resolves here (a stale #gold-blocked
 * anchor from anywhere lands on the disclosure, not the void).
 *
 * Platform: browser only — this module lives in the lazy Gold route
 * chunk, never the entry graph.
 */

import { useState } from 'react';
import { ChevronDown, ScrollText } from 'lucide-react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { GOLD_BLOCKED_NOTES } from './gold-tiles';

/** The blocked-note copy keys, keyed by the placement table's own ids
 * (BLOCKED_NOTES drives the list; the copy map stays total — the cast
 * rides the placement's own quartet, pinned by gold-tiles.test.ts). */
type BlockedNoteId = 'wgc-etf-holdings' | 'wgc-cb-demand' | 'official-gold-demand' | 'etf-short-interest';
const BLOCKED_KEY: Readonly<Record<BlockedNoteId, TranslationKey>> = {
  'wgc-etf-holdings': 'pd.gold.blockedWgcEtf',
  'wgc-cb-demand': 'pd.gold.blockedWgcCb',
  'official-gold-demand': 'pd.gold.blockedOfficial',
  'etf-short-interest': 'pd.gold.blockedEtfShort',
};

/* GPE R09 / F13 (GPE-S2-22): the licence wall's ONE link-out — the licence
 * facts live repo-side in docs/SOURCES.md; the public GitHub view is the
 * outbound path (the GOLD_BACKTEST_URL pattern). */
const GOLD_SOURCES_URL = 'https://github.com/assadigit/Currena/blob/main/docs/SOURCES.md';

export function GoldPublicationNotes({ absentCount }: { absentCount: number }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <section
      id="gold-blocked"
      aria-label={t('pd.gold.pubNotesSummary')}
      data-gold-blocked
      data-gold-publication-notes
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60 gold-anchor-mt"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-pubnotes-toggle
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-start"
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <ScrollText className="size-4 shrink-0 self-center text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <bdi className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.pubNotesSummary')}</bdi>
        </span>
        <ChevronDown className={`size-4 shrink-0 self-center text-currena-blue transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="flex min-w-0 flex-col gap-1.5" data-pubnotes-body>
          {/* The moved absent-count line (the old Zone A note, verbatim):
              GPE R06/#15 — the count renders through formatNumber so the FA
              locale renders Persian digits (۴, not the raw Western "4"). */}
          {absentCount > 0 ? (
            <p className="m-0 text-[length:var(--type-caption)] text-currena-muted" data-absent-note>
              <bdi>
                {interpolate(t('pd.global.absentLine'), { n: formatNumber(absentCount, numberLocale, { maximumFractionDigits: 0 }) })}
              </bdi>
            </p>
          ) : null}

          {/* The blocked quartet (§16): honest notes, never cards — GPE
              R09 / F13: each item's copy carries WHY it is absent + the
              owner's lever (C7 rule 5), unchanged. */}
          <h3 className="m-0 px-0.5 text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {t('pd.gold.blockedTitle')}
          </h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {GOLD_BLOCKED_NOTES.map((note) => (
              <li
                key={note.id}
                data-blocked-note={note.id}
                className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]"
              >
                <bdi>{t(BLOCKED_KEY[note.id as BlockedNoteId])}</bdi>
              </li>
            ))}
          </ul>
          {/* The ONE link-out (#22): the licence ladder + every source's terms,
              in the public data-sources document — the wall explains itself all
              the way down (GPE R09 / F13). */}
          <p className="m-0 px-0.5 text-[length:var(--type-caption)] leading-relaxed">
            <a
              href={GOLD_SOURCES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
            >
              {t('pd.gold.blockedLearnMore')}
            </a>
          </p>
        </div>
      ) : null}
    </section>
  );
}
