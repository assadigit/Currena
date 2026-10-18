#!/usr/bin/env node
/**
 * Gold-card contrast spot-check (spec 02 §"Verified contrast", acceptance
 * 05 §D.2): recomputes the WCAG ratios for the pairs the card actually
 * ships, on the HOST surfaces it actually uses (light #FFFFFF, dark
 * #1A222E — the page's --color-surface), and fails below 4.5:1 for text
 * or 3:1 for UI outlines.
 *
 * Run: node docs/insights/gold-card/check-contrast.mjs
 */

const L = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// What the card ships (index.css .balance-card / .dark .balance-card):
// host roles → the page's own tokens; state hues → the spec's set.
const LIGHT = {
  surface: '#FFFFFF',
  tint: '#F3F7FA',
  text2: '#47525D', // --color-text-secondary (host)
  muted: '#4F5A66', // --color-text-tertiary (host)
  supports: '#1A7A3A',
  supportsBg: '#E8F5EC',
  pressures: '#B3243A',
  pressuresBg: '#FBEDEF',
  unread: '#8A5A00',
  unreadBg: '#FFF4DC',
  control: '#7B8A98',
};
const DARK = {
  surface: '#1A222E', // --color-surface dark (host)
  tint: '#141C23',
  text2: '#A9B5C5',
  muted: '#A2AEBC',
  supports: '#4CC38A',
  supportsBg: '#12281F',
  pressures: '#F2828C',
  pressuresBg: '#2B171B',
  unread: '#E7B04A',
  unreadBg: '#2B2210',
  control: '#6B7B8A',
};

let fail = 0;
const check = (theme, name, fg, bg, min) => {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(
    `${ok ? '✓' : '✗'} ${theme.padEnd(5)} ${name.padEnd(34)} ${fg} on ${bg} = ${r.toFixed(2)}:1 (min ${min})`,
  );
};

for (const [theme, t] of [
  ['light', LIGHT],
  ['dark', DARK],
]) {
  check(theme, 'text-2 on surface', t.text2, t.surface, 4.5);
  check(theme, 'text-2 on tint', t.text2, t.tint, 4.5);
  check(theme, 'muted on surface', t.muted, t.surface, 4.5);
  check(theme, 'muted on tint', t.muted, t.tint, 4.5);
  check(theme, 'supports on surface', t.supports, t.surface, 4.5);
  check(theme, 'supports on its bg', t.supports, t.supportsBg, 4.5);
  check(theme, 'pressures on surface', t.pressures, t.surface, 4.5);
  check(theme, 'pressures on its bg', t.pressures, t.pressuresBg, 4.5);
  check(theme, 'unread on surface', t.unread, t.surface, 4.5);
  check(theme, 'unread on its bg', t.unread, t.unreadBg, 4.5);
  check(theme, 'control (outline) on surface', t.control, t.surface, 3.0);
}

console.log(fail === 0 ? '\nAll contrast pairs pass.' : `\n${fail} pair(s) FAIL.`);
process.exit(fail === 0 ? 0 : 1);
