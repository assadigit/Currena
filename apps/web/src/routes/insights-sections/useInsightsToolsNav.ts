/**
 * useInsightsToolsNav — the Insights Tools disclosure + keyboard navigation
 * cluster, moved verbatim from routes/Insights.tsx in the Phase 3-e route
 * split: the I8/R15 tools state (open + tier filter + search query), the
 * I9 "/" shortcut that opens Tools and focuses the search, the I13 j/k
 * card-walk, and the I13 visible-ids filter model. The route shell calls
 * this once and threads the results to the header and the lane.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { IndicatorId } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { filterVisibleIds, type StatusFilter } from '../../components/insights/config';
import type { LoadState } from './InsightsStatusBlocks';

export function useInsightsToolsNav({
  state,
  copy,
  focusCard,
}: {
  state: LoadState;
  copy: InsightsCopy;
  focusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  // I8/R15: the tier filter + search now live inside the Tools disclosure.
  const [toolsOpen, setToolsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toolsButtonRef = useRef<HTMLButtonElement | null>(null);

  // I9/R15: "/" opens Tools and focuses the search (the old inline focus).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setToolsOpen(true);
      requestAnimationFrame(() => searchInputRef.current?.focus());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // I13: j/k walks the visible items (rows + cards, lane order).
  const visibleIds = useMemo(() => {
    if (state.kind !== 'ready') return null;
    return filterVisibleIds(state.snapshot.readings, { status: statusFilter, query }, (id) => ({
      name: copy.indicators[id].name,
      ticker: copy.indicators[id].ticker,
    }));
  }, [state, statusFilter, query, copy]);

  const lastNavIdRef = useRef<IndicatorId | null>(null);
  useEffect(() => {
    if (state.kind !== 'ready') return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.key !== 'j' && e.key !== 'k') || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)
      ) {
        return;
      }
      // Walk the CURRENT lane's items (prices-board ids ride along).
      const order: IndicatorId[] = state.snapshot.readings
        .map((r) => r.id)
        .filter((id) => (visibleIds === null || visibleIds.has(id)));
      if (order.length === 0) return;
      e.preventDefault();
      let anchor = lastNavIdRef.current !== null && order.includes(lastNavIdRef.current) ? order.indexOf(lastNavIdRef.current) : -1;
      if (anchor === -1) {
        for (let i = 0; i < order.length; i++) {
          const el = document.getElementById(`insights-card-${order[i]}`);
          if (el && el.getBoundingClientRect().bottom > 96) {
            anchor = i;
            break;
          }
        }
      }
      const next = e.key === 'j' ? Math.min(anchor + 1, order.length - 1) : Math.max(anchor - 1, 0);
      const id = order[next];
      if (id === undefined) return;
      lastNavIdRef.current = id;
      focusCard(id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, visibleIds, focusCard]);

  const searchActive = statusFilter !== 'all' || query.trim() !== '';

  return {
    toolsOpen,
    setToolsOpen,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    visibleIds,
    searchActive,
    searchInputRef,
    toolsButtonRef,
  };
}
