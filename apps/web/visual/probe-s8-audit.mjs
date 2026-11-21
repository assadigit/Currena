/**
 * Probe: the GUX-S8 baseline audit — the cross-page QA evidence collector.
 *
 * Dev helper (not part of the suite): node visual/probe-s8-audit.mjs
 * Run from apps/web with the fixture server free (it spawns its own on 4050).
 *
 * The audit matrix (master plan Session 8 + 11 §8/§12 + 12 §7):
 *   A. horizontal overflow at 390 + 360 (en/fa — the agreed mobile widths),
 *   B. the sticky section nav: rendered height/rows at 390, anchor-jump
 *      coverage (does the nav cover the target's heading after a chip tap?),
 *   C. touch targets: visible buttons/links/summaries under 44px at 390,
 *   D. the LABEL contract: every chart-root svg carries role=img/group +
 *      an accessible name (11 §8 item E),
 *   E. the both-themes contrast matrix: status words/marks in light+dark —
 *      text >= 4.5:1, graphics >= 3:1 (WCAG), no hue-only status,
 *   F. reduced motion: with prefers-reduced-motion, animated elements
 *      compute to no transition/animation.
 *
 * Output: a structured JSON report on stdout (the remediation list's input).
 */

/* global console, setTimeout, URL, window, document, getComputedStyle, Element */
import { chromium } from '@playwright/test';

const { spawn } = await import('node:child_process');

const server = spawn('node', ['fixture-server.mjs'], {
  cwd: new URL('.', import.meta.url).pathname,
  stdio: 'pipe',
});
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch();

/** One (locale, theme, viewport) audit pass over /gold. */
async function auditGoldPage({ locale, theme, width, height, reducedMotion }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    // The PWA's service worker must not shadow the fixture responses
    // (playwright.config.ts's own rule).
    serviceWorkers: 'block',
  });
  const page = await ctx.newPage();
  await page.addInitScript(
    ([l, t]) => {
      window.localStorage.setItem('currena:locale', l);
      // The app's theme key is the LEGACY 'theme' (lib/theme.ts + the
      // index.html pre-paint script) — NOT 'currena:theme'. The S5–S7
      // harness's 'currena:theme' writes were inert (this session's
      // audit finding); this probe uses the real key.
      window.localStorage.setItem('theme', t);
    },
    [locale, theme],
  );
  await page.goto('http://localhost:4050/gold');
  await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
  await page.waitForTimeout(600);

  const report = await page.evaluate(() => {
    const iw = window.innerWidth;
    const out = { innerWidth: iw, issues: {} };

    /* A. horizontal overflow — the bleed signal is scrollWidth; the
     *    offender list only counts VISIBLE elements (the closed mobile
     *    drawer's off-canvas items are not bleed). */
    const offenders = [];
    const scrollW = document.documentElement.scrollWidth;
    for (const el of document.querySelectorAll('main *, header *, nav *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      // Elements that live inside an intentional horizontal scroller are
      // fine (the chip-scroller pattern); only report page-level bleed.
      const inScroller = el.closest('[data-chip-scroller], .overflow-x-auto, [role="slider"]');
      if (inScroller !== null && inScroller !== el) continue;
      if (r.right > iw + 1 || r.left < -1) {
        offenders.push(
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} class="${(el.className + '').slice(0, 70)}" left=${Math.round(r.left)} right=${Math.round(r.right)} text="${(el.textContent || '').trim().slice(0, 32)}"`,
        );
      }
    }
    out.issues.overflow = { scrollWidth: scrollW, innerWidth: iw, bleed: scrollW > iw + 1, offenders: offenders.slice(0, 12) };

    /* B. the sticky section nav */
    const nav = document.querySelector('[data-gold-section-nav]');
    if (nav !== null) {
      const navRect = nav.getBoundingClientRect();
      const chips = nav.querySelectorAll('[data-nav-chip]');
      const chipRects = [...chips].map((c) => c.getBoundingClientRect());
      out.nav = {
        present: true,
        height: Math.round(navRect.height),
        chipCount: chips.length,
        chipMinHeight: chipRects.length > 0 ? Math.round(Math.min(...chipRects.map((r) => r.height))) : null,
        chipMinWidth: chipRects.length > 0 ? Math.round(Math.min(...chipRects.map((r) => r.width))) : null,
        scrollable: nav.querySelector('ul').scrollWidth > nav.querySelector('ul').clientWidth + 1,
      };
    } else {
      out.nav = { present: false };
    }

    /* C. touch targets (visible, in-viewport-ish interactive elements) */
    const small = [];
    for (const el of document.querySelectorAll('button, a, summary, [role="button"], input, select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      // The stretched opener pattern covers whole cards — only flag the
      // genuinely small controls.
      if (r.height >= 44 && r.width >= 44) continue;
      small.push(
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.getAttribute('data-lane') ? `[lane=${el.getAttribute('data-lane')}]` : ''} h=${Math.round(r.height)} w=${Math.round(r.width)} text="${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28)}"`,
      );
    }
    out.issues.touchTargets = { under44: small.length, samples: small.slice(0, 15) };

    /* D. the LABEL contract — chart-root svgs need role + name */
    const svgStats = { charts: 0, named: 0, unnamed: [] };
    for (const svg of document.querySelectorAll('main svg, section svg, article svg, div svg')) {
      const role = svg.getAttribute('role');
      const label = svg.getAttribute('aria-label');
      const labelledBy = svg.getAttribute('aria-labelledby');
      const title = svg.querySelector('title');
      const hasName = (label ?? '') !== '' || labelledBy !== null || title !== null;
      const cls = svg.getAttribute('class') ?? '';
      const decorative = svg.getAttribute('aria-hidden') === 'true' || /\bdecorat/.test(cls);
      if (role === 'img' || role === 'group' || role === 'graphics-document') {
        svgStats.charts += 1;
        if (hasName) svgStats.named += 1;
        else if (!decorative) svgStats.unnamed.push(`${svg.getAttribute('data-chart') ?? svg.parentElement?.getAttribute('data-chart') ?? 'svg'} w=${Math.round(svg.getBoundingClientRect().width)}`);
      }
    }
    out.issues.labelContract = svgStats;

    /* E. the contrast matrix — status words + marks (both themes sampled
     *    per pass; this pass = the current theme). */
    function parseColor(c) {
      const m = c.match(/rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/);
      if (m !== null) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
      // color(srgb r g b [/ a]) — the modern format getComputedStyle can
      // return for var()-resolved custom-property colors.
      const s = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
      if (s !== null) return [Math.round(+s[1] * 255), Math.round(+s[2] * 255), Math.round(+s[3] * 255), s[4] === undefined ? 1 : +s[4]];
      return null;
    }
    function lum(c) {
      const rgba = parseColor(c);
      if (rgba === null) return null;
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(rgba[0]) + 0.7152 * f(rgba[1]) + 0.0722 * f(rgba[2]);
    }
    function contrast(fg, bg) {
      const l1 = lum(fg);
      const l2 = lum(bg);
      if (l1 === null || l2 === null) return null;
      const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (a + 0.05) / (b + 0.05);
    }
    function effectiveBg(el) {
      let node = el;
      while (node !== null && node instanceof Element) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg !== null && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return bg;
        node = node.parentElement;
      }
      return 'rgb(255, 255, 255)';
    }
    const contrastRows = [];
    const samples = [
      ['[data-lanebar-state]', 'lane state word'],
      ['[data-seat-lean]', 'seat lean word'],
      ['[data-briefing-five-state]', 'briefing word'],
      ['[data-nav-chip][data-nav-active]', 'active nav chip'],
      ['[data-nav-chip]:not([data-nav-active])', 'idle nav chip'],
      ['[data-seat]', 'seat card label'],
      ['[data-lanebar]', 'lanebar label'],
      ['p, span, li', 'body text (sample)'],
    ];
    for (const [sel, what] of samples) {
      let counted = 0;
      for (const el of document.querySelectorAll(sel)) {
        const style = getComputedStyle(el);
        const fg = style.color;
        const bg = effectiveBg(el);
        const ratio = contrast(fg, bg);
        if (ratio === null) continue;
        contrastRows.push({ what, ratio: Math.round(ratio * 100) / 100, fg, bg, fontSize: style.fontSize, weight: style.fontWeight });
        counted += 1;
        if (counted >= 3) break; // three samples per selector per pass
      }
    }
    out.contrast = contrastRows;
    out.themeClass = document.documentElement.className;

    /* F. reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const stillMoving = [];
      for (const el of document.querySelectorAll('[class*="transition"], [class*="animate"], .loader-dot, [data-nav-chip]')) {
        const s = getComputedStyle(el);
        const td = parseFloat(s.transitionDuration);
        const tD = parseFloat(s.animationDuration);
        if ((s.transitionProperty !== 'none' && td > 0.02) || (s.animationName !== 'none' && tD > 0.02)) {
          stillMoving.push(`${el.tagName.toLowerCase()}.${(el.className + '').split(' ').slice(0, 2).join('.')}: transition=${s.transitionProperty}/${s.transitionDuration} animation=${s.animationName}/${s.animationDuration}`);
        }
      }
      out.issues.reducedMotion = { moving: stillMoving.length, samples: stillMoving.slice(0, 8) };
    }

    return out;
  });

  /* B2. anchor-jump coverage: tap a chip, measure the target head. */
  if (!reducedMotion) {
    const chip = page.locator('[data-nav-chip="gold-seats"]');
    if ((await chip.count()) > 0) {
      await chip.click();
      await page.waitForTimeout(500);
      const covered = await page.evaluate(() => {
        const nav = document.querySelector('[data-gold-section-nav]');
        const target = document.getElementById('gold-seats');
        if (nav === null || target === null) return null;
        const navBottom = nav.getBoundingClientRect().bottom;
        const targetTop = target.getBoundingClientRect().top;
        return { navBottom: Math.round(navBottom), targetTop: Math.round(targetTop), coveredBy: Math.round(navBottom - targetTop) };
      });
      report.nav.anchorJump = covered;
    }
  }

  await ctx.close();
  return report;
}

const passes = [];
for (const width of [390, 360]) {
  for (const locale of ['en', 'fa']) {
    passes.push({ name: `mobile-${width}-${locale}-light`, locale, theme: 'light', width, height: 844, reducedMotion: false });
  }
}
passes.push({ name: 'mobile-390-en-dark', locale: 'en', theme: 'dark', width: 390, height: 844, reducedMotion: false });
passes.push({ name: 'mobile-390-fa-dark', locale: 'fa', theme: 'dark', width: 390, height: 844, reducedMotion: false });
passes.push({ name: 'desktop-1440-en-light', locale: 'en', theme: 'light', width: 1440, height: 1000, reducedMotion: false });
passes.push({ name: 'desktop-1440-fa-dark', locale: 'fa', theme: 'dark', width: 1440, height: 1000, reducedMotion: false });
passes.push({ name: 'mobile-390-en-reduced', locale: 'en', theme: 'light', width: 390, height: 844, reducedMotion: true });

const results = {};
for (const p of passes) {
  try {
    results[p.name] = await auditGoldPage(p);
    console.error(`[audit] ${p.name} done`);
  } catch (err) {
    results[p.name] = { error: String(err) };
    console.error(`[audit] ${p.name} FAILED: ${err}`);
  }
}

await browser.close();
server.kill();
console.log(JSON.stringify(results, null, 2));
