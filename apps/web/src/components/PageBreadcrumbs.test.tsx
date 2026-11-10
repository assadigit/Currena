/**
 * @vitest-environment jsdom
 *
 * PageBreadcrumbs.test.tsx (S19, 2026-11-12) — the wayfinding row's own
 * suite. What is pinned:
 *
 *   - the structure: the nav's aria-label + the WAI-ARIA breadcrumb
 *     pattern (an ordered list; Home is a REAL link, the current page
 *     is a plain span carrying aria-current="page" — never a link to
 *     itself);
 *   - the Home link routes through the path router (href semantics for
 *     AT + one navigation, no reload — the house pattern, audit WS-3
 *     #6): the click preventDefaults + calls the router's navigate();
 *   - the separator is aria-hidden (screen readers hear "Home, Gold",
 *     never "Home, greater-than, Gold");
 *   - the fa/RTL rendering: the Persian crumbs + the document
 *     direction riding the locale store's own apply().
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { PageBreadcrumbs } from './PageBreadcrumbs';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PageBreadcrumbs', () => {
  it('renders the two-level trail: a real Home link + the aria-current page word', () => {
    render(<PageBreadcrumbs pageKey="pd.gold.title" />);

    const nav = document.querySelector('[data-page-breadcrumbs]');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');

    // Home is a REAL anchor pointing at the landing route.
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.getAttribute('href')).toBe('/');

    // The current crumb is a plain span carrying aria-current — never
    // a link to the page it already sits on.
    const current = nav?.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('Gold');
    expect(current?.tagName).toBe('SPAN');

    // The ordered list carries exactly two crumbs.
    expect(nav?.querySelectorAll('ol > li').length).toBe(3); // Home + separator + current
  });

  it('the separator is aria-hidden — AT hears "Home, Gold", never the glyph', () => {
    render(<PageBreadcrumbs pageKey="pd.europe.title" />);
    const sep = document.querySelector('[data-page-breadcrumbs] li[aria-hidden="true"]');
    expect(sep).not.toBeNull();
    expect(sep?.textContent).toContain('›');
  });

  it('the Home click routes through the path router exactly once, no reload', () => {
    // Seat the test at a destination route first — the router's own
    // navigate() is a no-op when the URL already matches, so the click
    // must start from /gold to prove the pushState fires.
    window.history.pushState(null, '', '/gold');
    const pushState = vi.spyOn(window.history, 'pushState');
    render(<PageBreadcrumbs pageKey="pd.usa.title" />);
    const home = screen.getByRole('link', { name: 'Home' });
    home.click();
    // The path router's navigate() lands on the Global route.
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith(null, '', '/');
    expect(window.location.pathname).toBe('/');
  });

  it('the fa/RTL rendering: the Persian crumbs + the rtl document direction', async () => {
    const { useI18n } = await import('../lib/locale');
    function SetLocale({ locale }: { locale: 'en' | 'fa' }): React.JSX.Element | null {
      const { setLocale } = useI18n();
      useEffect(() => {
        setLocale(locale);
      }, [locale, setLocale]);
      return null;
    }
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <PageBreadcrumbs pageKey="pd.gold.title" />
      </>,
    );
    try {
      // The Persian Home word + the Persian page word.
      expect(screen.getByRole('link', { name: 'صفحهٔ اصلی' })).toBeTruthy();
      expect(document.querySelector('[data-page-breadcrumbs] [aria-current="page"]')?.textContent).toBe('طلا');
      // The RTL document direction rides the store's own apply().
      expect(document.documentElement.dir).toBe('rtl');
      // The nav's own aria-label in Persian.
      expect(document.querySelector('[data-page-breadcrumbs]')?.getAttribute('aria-label')).toBe('مسیر صفحه');
    } finally {
      unmount();
      cleanup();
      const { useI18n: useI18n2 } = await import('../lib/locale');
      const Probe = (): React.JSX.Element | null => {
        const { setLocale } = useI18n2();
        useEffect(() => {
          setLocale('en');
        }, [setLocale]);
        return null;
      };
      render(<Probe />);
    }
  });
});
