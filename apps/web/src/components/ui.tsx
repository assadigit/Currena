/**
 * Shared UI primitives — small, dependency-free ports of the legacy visual
 * identity (FEATURE_MAP §8): 25px cards, CTA gradient + shine, 3-dot loader,
 * LIVE/CACHED indicator, cache-warning banner, offline banner.
 * CSS logical properties only (AGENTS.md rule 5).
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { formatRelative } from '@currena/core';
import type { Source } from '@currena/core';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cta' | 'secondary' | 'ghost';
}

export function Button({ variant = 'secondary', className = '', ...rest }: ButtonProps) {
  const variants: Record<string, string> = {
    // Legacy .convert-btn: gradient, shine sweep, uppercase, big shadow.
    cta: 'cta-gradient btn-shine text-white font-extrabold uppercase tracking-[1.5px] rounded-[18px] shadow-[0_12px_35px_rgba(102,126,234,0.4)] hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(102,126,234,0.5)] active:translate-y-0',
    secondary:
      'bg-currena-soft text-currena-dark font-semibold rounded-xl hover:-translate-y-0.5',
    ghost: 'bg-transparent text-currena-dark font-medium',
  };
  return (
    <button
      type="button"
      className={`cursor-pointer transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Card — legacy 25px radius + soft shadow
 * ------------------------------------------------------------------ */

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-[25px] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * LoaderDots — legacy 3 bouncing dots (blue/cyan/coral)
 * ------------------------------------------------------------------ */

export function LoaderDots({ label }: { label?: string }) {
  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center gap-2.5">
        <span className="loader-dot" />
        <span className="loader-dot" />
        <span className="loader-dot" />
      </div>
      {label ? <p className="text-base font-medium text-white">{label}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Skeleton — shimmer placeholder
 * ------------------------------------------------------------------ */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/* ------------------------------------------------------------------ *
 * LIVE / CACHED indicator — legacy .live-indicator
 * ------------------------------------------------------------------ */

export function LiveIndicator({ live }: { live: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wide ${
        live ? 'bg-currena-success/15 text-currena-success' : 'bg-currena-warning/15 text-currena-warning'
      }`}
    >
      <span
        className={live ? 'live-dot' : 'h-2 w-2 rounded-full bg-currena-warning warning-pulse'}
        aria-hidden="true"
      />
      {live ? t('common.liveUpdate') : t('common.cachedData')}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Source badge — TGJU / Frankfurter / Manual / Local
 * ------------------------------------------------------------------ */

const SOURCE_KEY: Record<Source, TranslationKey> = {
  tgju: 'sources.tgju',
  frankfurter: 'sources.frankfurter',
  manual: 'sources.manual',
  local: 'sources.local',
};

export function SourceBadge({ source }: { source: Source }) {
  const { t } = useI18n();
  return (
    <span className="rounded-full bg-currena-blue/10 px-2.5 py-0.5 text-xs font-semibold text-currena-blue">
      {t(SOURCE_KEY[source])}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * StaleBanner — legacy .cache-warning ("Using Cached Rates")
 * ------------------------------------------------------------------ */

export interface StaleBannerProps {
  /** ISO datetime of the served snapshot. */
  fetchedAt: string;
  /** Extra context line (API notice / degraded reason). */
  notice?: string | null;
}

export function StaleBanner({ fetchedAt, notice }: StaleBannerProps) {
  const { t, numberLocale } = useI18n();
  return (
    <div
      role="status"
      className="slide-down flex items-center gap-3 rounded-[15px] border-s-4 border-currena-warning bg-currena-warning/15 px-4 py-3.5 backdrop-blur"
    >
      <span className="warning-pulse text-2xl" aria-hidden="true">
        ⚠️
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem] font-semibold text-currena-warning">{t('converter.usingCachedRates')}</p>
        <p className="text-xs opacity-80">
          {t('common.lastUpdated')}: {formatRelative(fetchedAt, numberLocale)}
        </p>
        {notice ? <p className="mt-0.5 truncate text-xs opacity-70">{notice}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * OfflineBanner — "offline — rates from X" (mission §8)
 * ------------------------------------------------------------------ */

export function OfflineBanner({ source }: { source: Source }) {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="slide-down flex items-center gap-3 rounded-[15px] border-s-4 border-currena-muted bg-currena-muted/15 px-4 py-3.5"
    >
      <span aria-hidden="true">🔌</span>
      <p className="text-sm font-medium">
        {t('common.offlineRatesFrom', { source: t(SOURCE_KEY[source]) })}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Switch — legacy .toggle-switch pill (splitter / receipt options)
 * ------------------------------------------------------------------ */

export interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
}

export function Switch({ id, checked, onChange, label }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="text-sm font-semibold text-currena-dark">{label}</span>
      <span className="relative inline-block h-6 w-11 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-full w-full cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors duration-300 checked:bg-currena-success"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1 start-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
        />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Toast — transient feedback pill (copied / settled / errors)
 * ------------------------------------------------------------------ */

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fade-in fixed inset-x-4 bottom-4 z-[10001] mx-auto max-w-sm rounded-2xl bg-currena-dark/95 px-4 py-3 text-center text-sm whitespace-pre-line text-white shadow-lg"
    >
      {message}
    </div>
  );
}
