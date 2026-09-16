/**
 * Theme store (checklist #15): light/dark with persistence under the LEGACY
 * localStorage key `theme` — a device that used the old app keeps its theme.
 *
 * The pre-paint script in index.html applies the class before first paint
 * (no flash); this module owns runtime toggling. Tailwind's dark variant is
 * class-based (`@custom-variant dark (&:where(.dark, .dark *))` in index.css).
 */

import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

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
