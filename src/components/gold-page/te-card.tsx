"use client";

/**
 * The TE daily briefing card — the Trading Economics daily gold
 * briefing on the Persian gold page (docs/te-daily-briefing-spec.md
 * §7), placed directly under the desk's Market Brief (the daily voices
 * sit together) with the WGC monthly card following it.
 *
 * What it shows, honestly:
 *  - The header: one language, one title — «خلاصهٔ روزانهٔ بازار طلا» in
 *    fa (the h2 the owner asked for, never a second language beside it),
 *    the English title in EN — on the house card patterns.
 *  - fa mode, when a fresh Persian translation is stored (§5): the
 *    Farsi renders as the PRIMARY RTL text — the ONLY text (the owner's
 *    batch-K ask: one language per page, the English original dropped,
 *    "in Farsi show Farsi, in English show English") — with the
 *    attribution as the quiet "AI-translated" corner badge on the
 *    header row (the engine + date ride its tooltip), replacing the old
 *    in-body «ترجمهٔ ماشینی» label.
 *  - fa mode with NO stored Farsi (an AI failure, a pre-translation
 *    capture): the English verbatim, primary, with no badge and no
 *    fake translation. EN mode always renders the English verbatim.
 *  - The 11px whisper meta line: the published date (the Persian
 *    calendar in fa mode — the house convention), the fetched date,
 *    and «منبع: Trading Economics» with the canonical link.
 *  - The honest states riding the same card: waiting (the next fire
 *    named), a fetch-failed streak (TE unreachable since N fires —
 *    the no-arms-race posture, the last known good stays served,
 *    dated), and structure_alert (the template changed; the last
 *    known good serves, a human must look).
 *
 * Served by the desk's own read-only route /api/gold/te-briefing
 * (D1 only); fail-closed like every house leg.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, AiTranslatedBadge } from "@/components/gold-page/visuals";

/* ------------------------------------------------------------------ *
 * The payload (the route's contract)
 * ------------------------------------------------------------------ */

/** The stored Persian translation of one briefing — the route's additive fa field. */
export interface TeFa {
  title: string;
  body: string;
  sourceModel?: string; // the engine recorded at translation time
  translatedAt?: string;
}

export interface TeBriefing {
  newsId: string;
  title: string;
  publishedAt: string;
  fetchedAt: string;
  sourceUrl: string;
  author: string | null;
  body: string;
  fa?: TeFa; // present iff the route found a fresh stored translation
}

export interface TeLatest {
  status: "ok" | "waiting" | "structure_alert";
  // the flat briefing fields when status is "ok":
  newsId?: string;
  title?: string;
  publishedAt?: string;
  fetchedAt?: string;
  sourceUrl?: string;
  author?: string | null;
  body?: string;
  fa?: TeFa;
  // the honest-state fields:
  schedule?: string;
  nextFireAt?: string;
  coverageSince?: string; // the earliest stored row's date — the coverage floor
  fetchFailed?: { fires: number; since: string }; // the trailing unreachability streak
  reason?: string; // structure_alert's own statement
  lastKnownGood?: TeLatest | null; // the alert state's served payload
}

async function fetchTe(): Promise<TeLatest> {
  const res = await fetch(`${deskBasePath}/api/gold/te-briefing`, { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/gold/te-briefing responded with ${res.status}`);
  return (await res.json()) as TeLatest;
}

/* ------------------------------------------------------------------ *
 * The copy bundle (content.ts owns the words; this types them)
 * ------------------------------------------------------------------ */

export interface TeCardCopy {
  title: string;
  /** The AI-translated corner tag (batch K) — the literal Latin badge, both locales. */
  aiBadge: string;
  /** The badge's tooltip: the engine and date behind the translation. */
  aiBadgeTip: string;
  publishedLabel: string;
  fetchedLabel: string;
  source: string;
  stateWaiting: string;
  stateFetchFailed: string;
  stateAlert: string;
  unavailable: string;
}

/* ------------------------------------------------------------------ *
 * The helpers
 * ------------------------------------------------------------------ */

/** The date part of an ISO stamp, formatted in the reader's calendar. */
function dateWordsOf(iso: string | null | undefined, fmt: Fmt): string | null {
  if (!iso) return null;
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? fmt.dateWords(d) : null;
}

/** The next fire as a readable UTC wall-clock — the waiting state names it. */
function fireWordsOf(iso: string | null | undefined, locale: Locale): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-GB", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ *
 * The card
 * ------------------------------------------------------------------ */

export function TeCard({
  t,
  locale,
  fmt,
}: {
  t: TeCardCopy;
  locale: Locale;
  fmt: Fmt;
}) {
  const q = useQuery({
    queryKey: ["currena-gold-te"],
    queryFn: fetchTe,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const d = q.data;

  /* the served briefing: the response itself when ok, else the alert's last known good */
  const briefing: TeBriefing | null = d
    ? d.status === "ok" && d.body !== undefined
      ? {
          newsId: d.newsId ?? "",
          title: d.title ?? "",
          publishedAt: d.publishedAt ?? "",
          fetchedAt: d.fetchedAt ?? "",
          sourceUrl: d.sourceUrl ?? "",
          author: d.author ?? null,
          body: d.body,
          fa: d.fa,
        }
      : d.lastKnownGood && d.lastKnownGood.body !== undefined
        ? {
            newsId: d.lastKnownGood.newsId ?? "",
            title: d.lastKnownGood.title ?? "",
            publishedAt: d.lastKnownGood.publishedAt ?? "",
            fetchedAt: d.lastKnownGood.fetchedAt ?? "",
            sourceUrl: d.lastKnownGood.sourceUrl ?? "",
            author: d.lastKnownGood.author ?? null,
            body: d.lastKnownGood.body,
            fa: d.lastKnownGood.fa,
          }
        : null
    : null;

  /* the served briefing's own honest-state fields (the alert carries them inside lastKnownGood) */
  const flat = d?.status === "ok" ? d : (d?.lastKnownGood ?? null);
  const fetchFailed = flat?.fetchFailed ?? null;

  /* the Persian layer serves only the fa page, only when actually stored */
  const fa = locale === "fa" && briefing?.fa && briefing.fa.body !== "" ? briefing.fa : null;

  const published = dateWordsOf(briefing?.publishedAt, fmt);
  const fetched = dateWordsOf(briefing?.fetchedAt, fmt);
  const nextFire = fireWordsOf(d?.nextFireAt, locale);
  const failedSince = dateWordsOf(fetchFailed?.since, fmt);

  return (
    <section
      id="gold-te-briefing"
      aria-label={t.title}
      className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-currena-bg-light)] p-4 ring-1 ring-[var(--color-border)] sm:p-5"
    >
      {/* the header — one language, one title: the fa h2 in fa mode, the
          EN h2 in EN mode, never both (the owner's ask); when the card
          serves the stored translation, the quiet AI-translated badge
          rides the opposite corner (batch K) — the engine + date on its
          tooltip */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 className="m-0 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h2>
        {fa ? (
          <AiTranslatedBadge
            tag={t.aiBadge}
            tip={t.aiBadgeTip
              .replace("{model}", fa.sourceModel ?? "Workers AI")
              .replace("{date}", dateWordsOf(fa.translatedAt, fmt) ?? "")}
          />
        ) : null}
      </div>

      {/* the honest states — riding the same card, each a stated fact */}
      {q.isError ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption font-semibold leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.unavailable}
        </p>
      ) : null}
      {q.isLoading ? (
        <p className="m-0 mt-2.5 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">
          …
        </p>
      ) : null}
      {d?.status === "waiting" ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.stateWaiting.replace("{time}", nextFire ?? "05:00 / 16:00 UTC")}
        </p>
      ) : null}
      {fetchFailed ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.stateFetchFailed
            .replace("{n}", fmt.num(fetchFailed.fires, 0))
            .replace("{date}", failedSince ?? fetchFailed.since.slice(0, 10))}
        </p>
      ) : null}
      {d?.status === "structure_alert" ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption font-semibold leading-relaxed text-[var(--color-chip-ink-attention)] ring-1 ring-[var(--color-accent-gold)]/50">
          {t.stateAlert}
        </p>
      ) : null}

      {/* the served briefing — the Farsi translation primary and ALONE
          (fa mode, stored: the owner's batch-K ask — one language per
          page, the English original no longer rides below), or the
          English verbatim in an LTR block (every other case) */}
      {briefing ? (
        <>
          {fa ? (
            <>
              <h3 dir="rtl" className="type-label m-0 mt-3 text-start font-extrabold text-[var(--color-text-primary)]">
                {fa.title}
              </h3>
              <div
                dir="rtl"
                className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-3.5"
              >
                <p className="m-0 text-[13.5px] leading-[1.9] text-[var(--color-text-secondary)]">{fa.body}</p>
              </div>
            </>
          ) : (
            <>
              <h3 dir="ltr" className="type-label m-0 mt-3 text-start font-extrabold text-[var(--color-text-primary)]">
                {briefing.title}
              </h3>
              <blockquote
                cite={briefing.sourceUrl}
                dir="ltr"
                className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 text-start ring-1 ring-[var(--color-border)] sm:p-3.5"
              >
                <p className="m-0 text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{briefing.body}</p>
              </blockquote>
            </>
          )}

          {/* the 11px whisper meta line — provenance, always visible */}
          <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
            {published ? <span>{t.publishedLabel.replace("{date}", published)}</span> : null}
            {published && fetched ? <span aria-hidden="true">·</span> : null}
            {fetched ? <span>{t.fetchedLabel.replace("{date}", fetched)}</span> : null}
            {published || fetched ? <span aria-hidden="true">·</span> : null}
            <span>
              {t.source.replace("Trading Economics", "")}
              <a
                href={briefing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-border)] underline-offset-2 hover:text-[var(--color-currena-blue)]"
              >
                Trading Economics
              </a>
            </span>
          </p>
        </>
      ) : null}
    </section>
  );
}
