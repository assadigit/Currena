/**
 * Locale store + useI18n (checklist #18, AGENTS.md rule 5).
 *
 * - `en` (default, legacy parity) | `fa` (mission-mandated addition).
 * - Persisted under `currena:locale`; switches `documentElement.dir` + `lang`
 *   (pre-paint script in index.html reads the same key — no flash).
 * - `t()` is a typed dot-path lookup into the dictionary (en.ts is the
 *   source of truth; fa is shape-checked at compile time).
 * - Numbers/dates render ONLY via @currena/core format functions using
 *   `numberLocale` ('en-US' | 'fa-IR') — never stored formatted.
 */

import { useSyncExternalStore } from 'react';
import { dirFor, getDictionary, interpolate } from '../i18n';
import type { Dictionary } from '../i18n/en';
import type { Locale } from '../i18n';

const STORAGE_KEY = 'currena:locale';

/** Dot-path keys of the dictionary, e.g. 'nav.home' | 'errors.noInternetNoCache'. */
type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
export type TranslationKey = {
  [K in keyof Dictionary & string]: Dictionary[K] extends string
    ? K
    : Dictionary[K] extends readonly string[]
      ? never
      : Join<K, TranslationKeyOf<Dictionary[K]>>;
}[keyof Dictionary & string];
type TranslationKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends readonly string[]
      ? never
      : Join<K, TranslationKeyOf<T[K]>>;
}[keyof T & string];

function readStored(): Locale {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'fa' ? 'fa' : 'en';
  } catch {
    return 'en';
  }
}

class LocaleStore {
  private locale: Locale = 'en';
  private initialized = false;
  private readonly listeners = new Set<() => void>();

  private init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    this.locale = readStored();
    this.apply();
  }

  private apply(): void {
    document.documentElement.lang = this.locale;
    document.documentElement.dir = dirFor(this.locale);
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.init();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getState = (): Locale => {
    this.init();
    return this.locale;
  };

  setLocale(locale: Locale): void {
    this.init();
    if (this.locale === locale) return;
    this.locale = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Private mode: session-only locale.
    }
    this.apply();
    for (const listener of this.listeners) listener();
  }
}

export const localeStore = new LocaleStore();

function lookup(dictionary: Dictionary, key: TranslationKey): string {
  const value = key.split('.').reduce<unknown>(
    (node, segment) => (node instanceof Object ? (node as Record<string, unknown>)[segment] : undefined),
    dictionary,
  );
  if (typeof value !== 'string') {
    // Type system prevents this; kept as a loud runtime guard.
    throw new Error(`i18n: missing translation for '${key}'`);
  }
  return value;
}

export interface I18nApi {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: 'ltr' | 'rtl';
  /** Locale for @currena/core Intl formatting ('en-US' | 'fa-IR'). */
  numberLocale: 'en-US' | 'fa-IR';
  /** Translate a dictionary key, with optional {placeholder} params. */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function useI18n(): I18nApi {
  const locale = useSyncExternalStore(localeStore.subscribe, localeStore.getState);
  const dictionary = getDictionary(locale);
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const template = lookup(dictionary, key);
    return params ? interpolate(template, params) : template;
  };
  return {
    locale,
    setLocale: (l) => localeStore.setLocale(l),
    dir: dirFor(locale),
    numberLocale: locale === 'fa' ? 'fa-IR' : 'en-US',
    t,
  };
}
