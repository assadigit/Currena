/**
 * @vitest-environment jsdom
 *
 * use-roving-keys.test.tsx — the WAI-ARIA roving-tabindex helper behind
 * WS-3 #1/#2 (Settle tabs, BatchConverter mode tabs, AlertsDialog radios):
 * arrow keys move focus and report the index, Home/End jump, RTL mirrors
 * the horizontal arrows, and only the active item is tabbable (the roving
 * contract). Probe component instead of a real route — the routes' own
 * markup (role=tab/tablist, aria-selected) is exercised by the live axe
 * pass; this pins the KEYBOARD mechanics.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { useRovingKeys } from './use-roving-keys';

function Probe({ rtl, initial = 0 }: { rtl: boolean; initial?: number }) {
  const [active, setActive] = useState(initial);
  const { containerRef, onKeyDown } = useRovingKeys({
    selector: '[role="tab"]',
    activeIndex: active,
    onMove: setActive,
    rtl,
  });
  return (
    <div ref={containerRef} onKeyDown={onKeyDown} role="tablist">
      {['a', 'b', 'c'].map((id, i) => (
        <button key={id} type="button" role="tab" aria-selected={active === i} tabIndex={active === i ? 0 : -1}>
          {id}
        </button>
      ))}
    </div>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('useRovingKeys — the roving-tabindex mechanics (WS-3 #1/#2)', () => {
  it('ArrowRight walks forward and activates (automatic activation); focus follows', () => {
    const { container } = render(<Probe rtl={false} />);
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    tabs[0]!.focus();
    expect(document.activeElement).toBe(tabs[0]);
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]!.tabIndex).toBe(0);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
    expect(tabs[0]!.tabIndex).toBe(-1);
  });

  it('wraps at both ends', () => {
    const { container } = render(<Probe rtl={false} initial={2} />);
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    tabs[2]!.focus();
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(tabs[0]); // 2 → 0 (wrap)
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowLeft' });
    });
    expect(document.activeElement).toBe(tabs[2]); // 0 → 2 (wrap back)
  });

  it('RTL mirrors the horizontal arrows (ArrowLeft is forward in fa)', () => {
    const { container } = render(<Probe rtl={true} />);
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    tabs[0]!.focus();
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowLeft' });
    });
    expect(document.activeElement).toBe(tabs[1]);
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('Home/End jump to the first/last item', () => {
    const { container } = render(<Probe rtl={false} initial={1} />);
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    tabs[1]!.focus();
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'Home' });
    });
    expect(document.activeElement).toBe(tabs[0]);
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'End' });
    });
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('ArrowUp/ArrowDown keep their meaning in RTL (vertical is never mirrored)', () => {
    const { container } = render(<Probe rtl={true} />);
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    tabs[0]!.focus();
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(tabs[1]);
    act(() => {
      fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowUp' });
    });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('cold start (focus not on an item) acts from the ACTIVE index', () => {
    const { container } = render(<Probe rtl={false} initial={2} />);
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    // Focus the container itself, not an item.
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    list.focus();
    act(() => {
      fireEvent.keyDown(list, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(tabs[0]); // 2 + 1 wraps to 0
  });

  it('non-roving keys pass through untouched (typing elsewhere is unaffected)', () => {
    const { container } = render(<Probe rtl={false} />);
    const list = container.querySelector('[role="tablist"]')!;
    // No preventDefault and no crash on unrelated keys.
    expect(() =>
      act(() => {
        fireEvent.keyDown(list, { key: 'a' });
        fireEvent.keyDown(list, { key: 'Enter' });
        fireEvent.keyDown(list, { key: ' ' });
      }),
    ).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });
});
