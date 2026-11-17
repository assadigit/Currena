/**
 * useIndicatorDetails — the per-page details-panel wiring (the R-5 port,
 * docs/page-division/07-R5-DETAILS-PANEL-PORT.md).
 *
 * One hook per destination page: it owns the open-card state (which
 * indicator id + the DOM element that opened it, for the F5 focus
 * return), looks the reading up from the PAGE's own readings (the S2
 * projection — the panel's companion lines read other assets the page
 * carries, D-R5-4), and renders the ported IndicatorDetailsPanel.
 *
 * Usage (a destination page):
 *
 *   const { openCard, panel } = useIndicatorDetailsPanel(readings);
 *   // pass openCard down to the card families…
 *   // render {panel} once at the page root.
 *
 * A reading must exist for the panel to open (D-R5-3): openCard on an
 * id the projection did not carry is a no-op (fail-closed — the card
 * face already speaks the honest unavailable word).
 */

import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import type { IndicatorId } from '@currena/core';
import { IndicatorDetailsPanel } from '../components/IndicatorDetailsPanel';
import { useInsightsCopy } from './useInsightsCopy';

/** The open-panel state: the id + the element that opened it. */
interface DetailsState {
  id: IndicatorId;
  opener: HTMLElement | null;
}

export function useIndicatorDetailsPanel(
  readings: readonly import('@currena/core').IndicatorReading[] | undefined,
): {
  /** Opens the panel for the id — a no-op when the id has no reading. */
  openCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
  /** Closes the panel (also wired to Escape + the scrim + the close button). */
  closeCard: () => void;
  /** The rendered panel — null while closed. Render once at the page root. */
  panel: ReactElement | null;
} {
  const [state, setState] = useState<DetailsState | null>(null);
  const { copy, locale, numberLocale } = useInsightsCopy();

  const openCard = useCallback((id: IndicatorId, opener?: HTMLElement | null) => {
    setState({ id, opener: opener ?? null });
  }, []);

  const closeCard = useCallback(() => {
    setState(null);
  }, []);

  const reading =
    state !== null && readings !== undefined ? readings.find((r) => r.id === state.id) : undefined;

  return {
    openCard,
    closeCard,
    panel:
      state !== null && reading !== undefined ? (
        <IndicatorDetailsPanel
          key={state.id}
          reading={reading}
          readings={readings ?? []}
          copy={copy}
          locale={locale}
          numberLocale={numberLocale}
          onClose={closeCard}
          returnFocusTo={state.opener}
        />
      ) : null,
  };
}
