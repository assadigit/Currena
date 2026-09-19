/**
 * PWA icon generator (checklist #17).
 *
 * The legacy manifest declared 72–512 icons that 404'd on the live site (its
 * installability was broken). This script generates REAL icons from the ported
 * legacy logo (public/images/currena-logo.png — 290×89 RGBA, dark-navy text +
 * gold accents) by wrapping it in an SVG and rasterizing with @resvg/resvg-js.
 *
 * Output → public/icons/:
 *   icon-192.png, icon-512.png              (purpose "any")
 *   icon-maskable-192.png, icon-maskable-512.png (safe-zone padding)
 *   apple-touch-icon.png                    (180×180, opaque)
 *
 * Run: pnpm --filter @currena/web icons   (also runs via prebuild — idempotent)
 */

import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const logoPath = join(webRoot, 'public', 'images', 'currena-logo.png');
const outDir = join(webRoot, 'public', 'icons');

const logoBase64 = readFileSync(logoPath).toString('base64');
// Intrinsic logo aspect ratio (290×89) — kept explicit so a future logo swap
// only needs these two numbers updated.
const LOGO_W = 290;
const LOGO_H = 89;

// White tile: the logo's dark-navy wordmark + gold mark both read on it
// (verified by pixel analysis of the captured PNG — dark text avg RGB 81,81,45).
const BG = '#ffffff';

function iconSvg(size, logoWidthRatio) {
  const logoW = Math.round(size * logoWidthRatio);
  const logoH = Math.round((logoW * LOGO_H) / LOGO_W);
  const x = Math.round((size - logoW) / 2);
  const y = Math.round((size - logoH) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <image x="${x}" y="${y}" width="${logoW}" height="${logoH}" href="data:image/png;base64,${logoBase64}"/>
</svg>`;
}

function render(size, logoWidthRatio, file) {
  const png = new Resvg(iconSvg(size, logoWidthRatio), {
    fitTo: { mode: 'width', value: size },
  }).render().asPng();
  writeFileSync(join(outDir, file), png);
  console.log(`✓ ${file} (${size}×${size}, ${png.length} bytes)`);
}

mkdirSync(outDir, { recursive: true });
// "any" icons: logo fills 72% of the tile. Maskable: 60% — fully inside the
// 40%-radius safe circle (corner distance of a 0.60×0.184 rect is ~0.314 < 0.40).
render(192, 0.72, 'icon-192.png');
render(512, 0.72, 'icon-512.png');
render(192, 0.6, 'icon-maskable-192.png');
render(512, 0.6, 'icon-maskable-512.png');
render(180, 0.72, 'apple-touch-icon.png');
// Task 23: 96px tile for manifest app-shortcut icons (Chrome launcher
// long-press menu) — same "any" geometry as icon-192.
render(96, 0.72, 'icon-96.png');
