/**
 * Theme store: light/dark with persistence under the LEGACY localStorage key
 * `theme` — a device that used the old app keeps its theme (restored by owner
 * request 2026-09-17: "I want both light mode and dark mode").
 *
 * Light is the DEFAULT (the site's primary identity); dark is a first-class
 * alternative with its own harmonized "Currena Night" palette. The pre-paint
 * script in index.html applies the class before first paint (no flash); this
 * module owns runtime toggling. Tailwind's dark variant is class-based
 * (`@custom-variant dark (&:where(.dark, .dark *))` in index.css).
 *
 * The store also syncs the <meta name="theme-color"> so the browser UI chrome
 * (address bar / installed PWA title bar) follows the active theme.
 */

import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/** Browser-chrome colors per theme (kept in sync with index.css tokens). */
const META_THEME_COLOR: Record<Theme, string> = {
  light: '#E8F4F8',
  dark: '#10151D',
};

function readStored(): Theme {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

class ThemeStore {
  private theme: Theme = 'light';
  private initialized = false;
  private readonly listeners = new Set<() => void>();

  private init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    this.theme = readStored();
    this.apply();
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark', this.theme === 'dark');
    // Browser UI chrome (address bar / standalone PWA title bar) follows.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', META_THEME_COLOR[this.theme]);
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.init();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getState = (): Theme => {
    this.init();
    return this.theme;
  };

  setTheme(theme: Theme): void {
    this.init();
    if (this.theme === theme) return;
    this.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode: session-only theme.
    }
    this.apply();
    for (const listener of this.listeners) listener();
  }

  toggle(): void {
    this.setTheme(this.getState() === 'dark' ? 'light' : 'dark');
  }
}

export const themeStore = new ThemeStore();

export interface ThemeApi {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export function useTheme(): ThemeApi {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.getState);
  return { theme, setTheme: (t) => themeStore.setTheme(t), toggle: () => themeStore.toggle() };
}
