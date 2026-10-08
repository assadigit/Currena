/**
 * alerts.ts (web) — the rate-alerts store (I14).
 *
 * The persisted shape lives in @currena/core (parse/serialize/crossing);
 * this module owns the BROWSER side, mirroring snapshot-store's external-
 * store shape so every surface (the converter's section row + badge, the
 * dialog list, the App-level evaluation hook) reads ONE live state via
 * useSyncExternalStore — no prop drilling, no per-component re-reads.
 *
 *   currena:rate-alerts      the list (JSON, core-validated, cap 20)
 *   currena:rate-alerts-seen epoch-ms stamp of the last dialog open —
 *                            powers the "unseen triggered" badge without
 *                            re-nagging after every reload
 *
 * Cross-tab: the `storage` event re-hydrates this tab's state (the same
 * pattern BACKLOG #38 wants for Settle — proven here first). Fail-open
 * everywhere: private-mode/blocked storage degrades to in-memory state.
 */

import { useSyncExternalStore } from 'react';
import {
  ALERTS_CAP,
  markTriggered,
  parseRateAlerts,
  serializeRateAlerts,
} from '@currena/core';
import type { AlertDirection, RateAlert } from '@currena/core';
import { uniqueId } from './id';

export const ALERTS_KEY = 'currena:rate-alerts';
export const ALERTS_SEEN_KEY = 'currena:rate-alerts-seen';

/** What the user typed into the create form (before validation). */
export interface AlertDraft {
  base: RateAlert['base'];
  quote: RateAlert['quote'];
  direction: AlertDirection;
  threshold: number;
}

export interface AlertsState {
  /** Core-validated list (cap ALERTS_CAP), newest first. */
  alerts: RateAlert[];
  /** Epoch-ms the dialog was last opened — null until the first open. */
  seenAt: number | null;
  /** In-memory only: alerts triggered in THIS tab, newest last (toast feed). */
  fired: RateAlert[];
}

type Listener = () => void;

const listeners = new Set<Listener>();
let state: AlertsState = { alerts: [], seenAt: null, fired: [] };
let booted = false;

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(alerts: readonly RateAlert[]): void {
  try {
    window.localStorage.setItem(ALERTS_KEY, serializeRateAlerts(alerts));
  } catch {
    // Private mode / quota — in-memory state still serves this session.
  }
}

function readSeenAt(): number | null {
  try {
    const raw = window.localStorage.getItem(ALERTS_SEEN_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeSeenAt(at: number): void {
  try {
    window.localStorage.setItem(ALERTS_SEEN_KEY, String(at));
  } catch {
    // Best-effort — the badge may re-appear next visit; harmless.
  }
}

/**
 * Boot from storage + watch other tabs. Called once from App (same rule
 * as snapshotStore.boot); idempotent and DOM-guarded for tests/SSR.
 */
function boot(): void {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ALERTS_KEY);
  } catch {
    raw = null;
  }
  state = { ...state, alerts: parseRateAlerts(raw), seenAt: readSeenAt() };
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== ALERTS_KEY && event.key !== ALERTS_SEEN_KEY) return;
    let alerts = state.alerts;
    let seenAt = state.seenAt;
    if (event.key === null || event.key === ALERTS_KEY) {
      try {
        alerts = parseRateAlerts(window.localStorage.getItem(ALERTS_KEY));
      } catch {
        alerts = [];
      }
    }
    if (event.key === null || event.key === ALERTS_SEEN_KEY) seenAt = readSeenAt();
    state = { ...state, alerts, seenAt };
    emit();
  });
}

export const alertsStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): AlertsState {
    boot();
    return state;
  },

  /** Add a draft (newest first); false when the cap is reached. */
  add(draft: AlertDraft): boolean {
    if (state.alerts.length >= ALERTS_CAP) return false;
    const alert: RateAlert = {
      id: uniqueId(),
      base: draft.base,
      quote: draft.quote,
      direction: draft.direction,
      threshold: draft.threshold,
      createdAt: Date.now(),
    };
    state = { ...state, alerts: [alert, ...state.alerts] };
    persist(state.alerts);
    emit();
    return true;
  },

  remove(id: number): void {
    state = { ...state, alerts: state.alerts.filter((a) => a.id !== id) };
    persist(state.alerts);
    emit();
  },

  /** Stamp a crossing (idempotent — crossesAlert already gates the call). */
  markFired(id: number, rate: number, atMs: number): void {
    let fired: RateAlert | null = null;
    const alerts = state.alerts.map((a) => {
      if (a.id !== id || a.triggeredAt !== undefined) return a;
      fired = markTriggered(a, rate, atMs);
      return fired;
    });
    if (!fired) return;
    state = { ...state, alerts, fired: [...state.fired, fired] };
    persist(state.alerts);
    emit();
  },

  /** The dialog opened — stamp seen, clear the toast feed. */
  ackAll(): void {
    const now = Date.now();
    state = { ...state, seenAt: now, fired: [] };
    writeSeenAt(now);
    emit();
  },

  /** Test/reset seam: swap the full state (used by tests + storage events). */
  __setState(next: Pick<AlertsState, 'alerts'> & Partial<AlertsState>): void {
    state = { fired: [], seenAt: null, ...next } as AlertsState;
    emit();
  },

  /** Test seam: un-boot + reset state (module singletons survive vi.resetModules
   *  cheaply; tests call this in beforeEach to get a clean store). */
  __resetForTests(): void {
    booted = false;
    state = { alerts: [], seenAt: null, fired: [] };
    listeners.clear();
  },
};

/** Live store state for React surfaces (badge, dialog, evaluation). */
export function useAlerts(): AlertsState {
  return useSyncExternalStore(alertsStore.subscribe, alertsStore.getState);
}
