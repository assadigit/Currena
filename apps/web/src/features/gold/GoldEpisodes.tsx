/**
 * GoldEpisodes — GPE R25 / F6 (2026-11-19): the Episode Explorer, Zone
 * O's history tail (docs/specs/gold-page-elevation: s8/01 R25 · s6/01
 * zone 16 · s6/03 zone O "collapsed (both F6 and F26); F6 expands to
 * the episode list (era left, annotation right-aligned)" · s7/03 §3
 * the episode data model · the s15 M1 §7 S15-D4/D6/D7 records).
 *
 * THE NINE-RECORD LAUNCH LIST (s7/03 §3.2, CP-C-locked): the typed
 * static module (gold-episodes-records.ts) carries the STRUCTURE;
 * every EN/FA editorial string lives in the dictionaries (S15-D7 —
 * the manifest-gated path). THE METER-ERA BOUNDARY (s7/03 §3.4,
 * binding): no record renders a historical "meter verdict" — the
 * meter exists only 2016+; the boundary note teaches it. THE hasData
 * HONESTY FLAG (s7/03 §3.1): a family without series coverage renders
 * the shared no-series line, never a guess. THE OUT-BOUND-ONLY LINKS
 * (s7/03 §3.5): each record links the live seat cards of the families
 * that told its story; data cards never link in.
 *
 * THE DATA-GATED HALVES ride the WGC prices-workbook drop (S15-D4):
 * the price path + the comparison rider render the honest waiting
 * state until `gold-episodes-run` writes the key (the route's calm
 * 503 → this client's null) — nothing invented in the meantime.
 *
 * The 390 rule: the collapsed header + the takeaway line always
 * visible; one tap expands the episode list (era left, annotation
 * right-aligned); each record expands again (session-only state — the
 * round-27 discipline). Display-only: no meter membership, no voter.
 */

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../../shared/lib/locale';
import { useGoldEpisodes } from './gold-episodes';
import {
  EPISODE_FAMILY_LABEL_KEY,
  EPISODE_FAMILY_ORDER,
  GOLD_EPISODES,
  type GoldEpisodeRecord,
} from './gold-episodes-records';
import { GoldEpisodeComparison, GoldEpisodePath, GoldEpisodeSince } from './GoldEpisodePath';

/** The record's era label (the year part, the list's left column). */
function eraOf(record: GoldEpisodeRecord): string {
  return record.period.start.slice(0, 4);
}

export function GoldEpisodes(): React.JSX.Element {
  const { t, locale } = useI18n();
  const state = useGoldEpisodes();
  const [open, setOpen] = useState(false);
  const [openRecord, setOpenRecord] = useState<string | null>(null);

  const snapshot = state.kind === 'ready' ? state.snapshot : null;

  /** The period label (the record's own start → end, the locale's calendar). */
  const periodText = useMemo(() => {
    const monthText = (ym: string): string => {
      if (ym.length === 4) return ym;
      const date = new Date(`${ym}-01T00:00:00Z`);
      return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-GB', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    };
    return (record: GoldEpisodeRecord): string =>
      `${monthText(record.period.start)} → ${record.living === true ? t('pd.gold.epPeriodNow') : monthText(record.period.end)}`;
  }, [locale, t]);

  return (
    <section
      id="gold-zone-o"
      aria-label={t('pd.gold.epTitle')}
      data-gold-zone-o-band
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60"
    >
      <h3 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epTitle')}</h3>
      {/* The takeaway line — the 390 always-visible row. */}
      <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]" data-episodes-takeaway>
        <bdi>{t('pd.gold.epSubtitle')}</bdi>
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1 text-start text-[length:var(--type-caption)] font-semibold text-currena-blue"
      >
        <span>{open ? t('pd.gold.epHide') : t('pd.gold.epShow')}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="flex min-w-0 flex-col gap-2" data-episodes-list>
          {/* The meter-era boundary (s7/03 §3.4, binding — taught, not hidden). */}
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-episodes-meter-era>
            <bdi>{t('pd.gold.epMeterEraNote')}</bdi>
          </p>

          {/* The episode list: era left, annotation right-aligned (s6/03's
              own 390 rule — the flex justify-between carries it at every
              viewport; the annotation wraps on narrow screens). */}
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {GOLD_EPISODES.map((record) => {
              const expanded = openRecord === record.id;
              return (
                <li key={record.id} className="flex min-w-0 flex-col" data-episode={record.id}>
                  <button
                    type="button"
                    onClick={() => setOpenRecord(expanded ? null : record.id)}
                    aria-expanded={expanded}
                    className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2 py-1.5 text-start ring-1 ring-[var(--color-border)]/50 hover:bg-[var(--color-surface)]/80"
                  >
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <bdi className="shrink-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">{eraOf(record)}</bdi>
                      <bdi className="min-w-0 truncate text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)]">{t(record.titleKey)}</bdi>
                      {record.living === true ? (
                        <bdi className="shrink-0 rounded-full bg-currena-coral/15 px-1.5 text-[10px] font-bold text-[var(--color-text-secondary)]">{t('pd.gold.epLivingBadge')}</bdi>
                      ) : null}
                    </span>
                    <bdi className="min-w-0 flex-1 text-end text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]">{t(record.annotationKey)}</bdi>
                  </button>

                  {expanded ? (
                    <div className="mt-1 flex min-w-0 flex-col gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/60 px-2.5 py-2" data-episode-detail>
                      {/* The period + the interpretation paragraph. */}
                      <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]" data-episode-period>
                        <bdi>{periodText(record)}</bdi>
                      </p>
                      <p className="m-0 max-w-prose text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-episode-interpretation>
                        <bdi>{t(record.interpretationKey)}</bdi>
                      </p>

                      {/* The family readings — the hasData honesty flag's
                          own surface: the families' own series named, the
                          no-data line for the rest (never a guess). */}
                      <div className="flex min-w-0 flex-col gap-1" data-episode-families>
                        {EPISODE_FAMILY_ORDER.map((familyId) => {
                          const reading = record.families.find((f) => f.family === familyId);
                          const hasData = reading?.hasData === true;
                          return (
                            <div key={familyId} className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5" data-episode-family={familyId} data-has-data={hasData ? 'true' : 'false'}>
                              <bdi className="shrink-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t(EPISODE_FAMILY_LABEL_KEY[familyId])}</bdi>
                              {hasData && reading?.seriesNamed !== undefined ? (
                                <bdi className="shrink-0 text-[10px] text-[var(--color-text-tertiary)]" dir="ltr">{reading.seriesNamed}</bdi>
                              ) : null}
                              <bdi className={`min-w-0 flex-1 text-[length:var(--type-caption)] leading-snug ${hasData ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-tertiary)]'}`}>
                                {t(hasData ? reading!.readingKey : 'pd.gold.epFamilyNoData')}
                              </bdi>
                            </div>
                          );
                        })}
                      </div>

                      {/* The data-gated price path (S15-D4's waiting state
                          until the workbook drop lands). */}
                      <GoldEpisodePath record={record} snapshot={snapshot} />
                      {/* The per-record since-episode returns (the same
                          spine; absent legs render nothing, never a guess). */}
                      <GoldEpisodeSince record={record} snapshot={snapshot} />

                      {/* The sources + the licence levels + the out-bound
                          links (§3.5: the live seat cards only). */}
                      <div className="flex min-w-0 flex-col gap-1" data-episode-sources>
                        <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epSourcesTitle')}</h5>
                        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                          {record.sources.map((source) => (
                            <li key={source.nameKey} className="text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]">
                              <bdi>{t(source.nameKey)}</bdi>{' '}
                              <bdi className="rounded-full bg-[var(--color-border)]/40 px-1.5 text-[10px] font-bold" dir="ltr">
                                {t(source.licence === 'L1' ? 'pd.gold.epLicenceL1' : 'pd.gold.epLicenceL2')}
                              </bdi>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {record.links.length > 0 ? (
                        <div className="flex min-w-0 flex-col gap-1" data-episode-links>
                          <h5 className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.epLinksTitle')}</h5>
                          <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
                            {record.links.map((link) => (
                              <li key={link.href} className="text-[length:var(--type-caption)]">
                                <a href={link.href} className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
                                  {t(link.labelKey)}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {record.living === true ? (
                        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-episode-living>
                          <bdi>{t('pd.gold.epLivingNote')}</bdi>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* The comparison rider (the zone's tail block — the windows
              table + the waiting state). */}
          <GoldEpisodeComparison snapshot={snapshot} />
        </div>
      ) : null}
    </section>
  );
}
