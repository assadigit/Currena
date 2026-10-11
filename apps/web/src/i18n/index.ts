import { en, type Dictionary } from './en';
import { fa } from './fa';

/**
 * i18n core : dictionary layer (mission §8).
 *
 * - `en` is the source-of-truth dictionary (verbatim legacy strings).
 * - `fa` is type-checked against it: adding a key to en without translating
 *   fails typecheck.
 * - Default locale: **en** (matches legacy). `fa` switches `dir=rtl`.
 * - Phase 5 wires the React context provider on top of this module.
 *
 * Numbers are NEVER stored through here: formatting happens at render time
 * via Intl.NumberFormat('fa-IR' | 'en-US') in @currena/core.
 */

export const locales = ['en', 'fa'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const dictionaries: Record<Locale, Dictionary> = { en, fa };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function dirFor(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

/** Minimal interpolation: t('{n} minutes ago', { n: 5 }) */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
