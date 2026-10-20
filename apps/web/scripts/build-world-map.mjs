/**
 * World markets map asset builder (spec §7 B1 + B2 — docs/insights/
 * world-markets-map-spec.md).
 *
 * BUILD-TIME ONLY. Never imported by the app. Regenerates three committed
 * artifacts for the Insights "world markets map" module from the Natural
 * Earth 110m countries TopoJSON (world-atlas) plus the flag-icons 1×1 SVGs:
 *
 *   public/assets/map/world-map.svg
 *     One <path> per country with data-iso (ISO 3166-1 numeric, exactly as
 *     world-atlas provides it, e.g. "840" USA). Antarctica ("010") removed.
 *     No fills/strokes/classes — styling happens in the app. Fetched at
 *     runtime as a static Worker asset (spec B3).
 *
 *   src/components/insights/world-markets/world-map-geo.json
 *     viewBox height + the SIXTEEN dot positions as percentages of the map
 *     box (2026-10-20g owner round: every index the app carries joins the
 *     map) plus the twelve covered countries' label anchors (the projected
 *     centroid of each country's LARGEST polygon — the mainland, so "USA"
 *     lands on Kansas, not dragged NW by Alaska). Imported (bundled), not
 *     fetched — that is why it lives under src/.
 *
 *   public/assets/map/world-flags.svg
 *     One <symbol id="wm-flag-{cc}"> per market country from flag-icons'
 *     1×1 flags (MIT). The app crops them to circles with CSS border-radius.
 *
 * Projection: geoNaturalEarth1 (no rotation) with the projected sphere
 * fitted to a 1000-unit-wide box with a 1-unit margin. Natural Earth 1's
 * natural aspect (~1.92:1) fixes the viewBox height (~521). Deterministic:
 * fixed inputs, ISO-sorted paths, no timestamps — running it twice produces
 * byte-identical outputs.
 *
 * Run: pnpm --filter @currena/web build:map
 */

/* global Buffer, console, process */ // Node build script (apps/web/scripts is outside the config's node-globals block).
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const svgOutPath = join(webRoot, 'public', 'assets', 'map', 'world-map.svg');
const geoOutPath = join(webRoot, 'src', 'components', 'insights', 'world-markets', 'world-map-geo.json');
const flagsOutPath = join(webRoot, 'public', 'assets', 'map', 'world-flags.svg');

// --- config -----------------------------------------------------------------

const VIEW_W = 1000; // map box width in viewBox units (spec B1)
const MARGIN = 1; // breathing room around the projected sphere
const ANTARCTICA_ID = '010'; // ISO 3166-1 numeric — removed per spec M3
const MAX_SVG_BYTES = 80 * 1024; // raw size budget for world-map.svg (spec B1)

// Dot cities — ALL SIXTEEN registry indices, west to east (2026-10-20g
// owner round: "add any remaining indice of the app to the world map").
// [market id, lat, lon, fanDx, fanDy]: lat/lon = the exchange's city;
// fanDx/fanDy = an OPTIONAL display fan in % of the map box, applied AFTER
// projection, for cities that host several indices (their pins would stack
// into one blob otherwise). The fan is a display nudge (~200–300 km at this
// scale, invisible next to the 110 m coastline resolution); the card, the
// leader line and the accessible name keep each index's identity honest.
//   New York hosts the S&P 500, Nasdaq 100 and Dow Jones — kept at the exact
//   city with the other two fanned off it (Dow SW toward Pennsylvania,
//   Nasdaq NE toward New England).
//   Brussels hosts the Euro Stoxx 50's pin (the EU capital — the app's own
//   country field for it is "Eurozone", so it tints no single country);
//   fanned SE off the tight London/Paris/Frankfurt cluster so the four
//   Western-European pins stay apart.
const DOT_CITIES = [
  ['dow', 40.71, -74.01, -1.75, 2.3], // New York (fan SW)
  ['tsx', 43.65, -79.38, 0, 0], // Toronto
  ['sp500', 40.71, -74.01, 0, 0], // New York (exact)
  ['ndx', 40.71, -74.01, 1.75, -2.3], // New York (fan NE)
  ['ibov', -23.55, -46.63, 0, 0], // São Paulo
  ['ftse', 51.51, -0.13, 0, 0], // London
  ['cac', 48.86, 2.35, 0, 0], // Paris
  ['dax', 50.11, 8.68, 0, 0], // Frankfurt
  ['stoxx50', 50.85, 4.35, 1.5, 2.5], // Brussels (fan SE, off the cluster)
  ['nifty50', 19.08, 72.88, 0, 0], // Mumbai
  ['hsi', 22.32, 114.17, 0, 0], // Hong Kong
  ['ssec', 31.23, 121.47, 0, 0], // Shanghai
  ['taiex', 25.03, 121.57, 0, 0], // Taipei
  ['kospi', 37.57, 126.98, 0, 0], // Seoul
  ['n225', 35.68, 139.69, 0, 0], // Tokyo
  ['asx200', -33.87, 151.21, 0, 0], // Sydney
];

// ISO numerics whose dot has NO path on the 110 m map (Hong Kong merges
// into China at this resolution) — the iso check below exempts them.
const DOT_ISO_EXEMPT = new Set(['344']);

// The covered countries whose LABEL anchor is emitted (the centroid of the
// largest polygon). MUST agree with world-map-config.ts's MAP_INDICES isos
// minus the path-less ones (Hong Kong) and the tint-less Euro Stoxx 50.
const LABEL_COUNTRIES = ['036', '076', '124', '156', '158', '250', '276', '356', '392', '410', '826', '840'];

// flag-icons 1×1 country codes — the sixteen map countries, west to east
// (eu = the Euro Stoxx 50's Eurozone flag; hk = Hong Kong).
const FLAG_COUNTRIES = ['us', 'ca', 'br', 'gb', 'fr', 'de', 'eu', 'in', 'hk', 'cn', 'tw', 'kr', 'jp', 'au'];

// --- helpers ----------------------------------------------------------------

const round2 = (value) => Math.round(value * 100) / 100;
const bytes = (string) => Buffer.byteLength(string, 'utf8');

function fail(message) {
  console.error(`✗ build-world-map: ${message}`);
  process.exit(1);
}

// --- map + dots (spec B1) ---------------------------------------------------

function buildCountries() {
  const topo = require('world-atlas/countries-110m.json');
  const all = feature(topo, topo.objects.countries).features;
  // Drop Antarctica, then drop features world-atlas gives no ISO numeric for
  // (N. Cyprus, Somaliland, Kosovo) — every emitted path must carry data-iso.
  const skipped = all.filter((f) => f.id === undefined);
  if (skipped.length > 0) {
    console.log(`· skipping ${skipped.length} feature(s) without an ISO numeric id: ${skipped.map((f) => f.properties?.name ?? '?').join(', ')}`);
  }
  const countries = all
    .filter((f) => typeof f.id === 'string' && f.id !== ANTARCTICA_ID)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)); // deterministic order
  if (countries.some((f) => f.id === ANTARCTICA_ID)) fail('Antarctica not removed');
  return countries;
}

function fitProjection() {
  // Natural Earth 1's natural aspect (~1.92:1) fixes the box height.
  const probe = geoNaturalEarth1();
  const [[x0, y0], [x1, y1]] = geoPath(probe).bounds({ type: 'Sphere' });
  const aspect = (x1 - x0) / (y1 - y0);
  const viewH = Math.round((VIEW_W - 2 * MARGIN) / aspect + 2 * MARGIN);
  const projection = geoNaturalEarth1();
  projection.fitExtent(
    [
      [MARGIN, MARGIN],
      [VIEW_W - MARGIN, viewH - MARGIN],
    ],
    { type: 'Sphere' },
  );
  return { projection, viewH };
}

function renderMapSvg(countries, projection, viewH, digits) {
  // d3-geo 3.1's geoPath.digits() rounds path coordinates to `digits`
  // decimals — the 80 KB budget fallback below tightens 1 → 0 decimals.
  const path = geoPath(projection);
  path.digits(digits);
  const paths = countries.map((f) => `<path data-iso="${f.id}" d="${path(f)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${viewH}"><g>${paths}</g></svg>\n`;
}

function buildDots(projection, viewH) {
  const dots = {};
  for (const [key, lat, lon, fanDx = 0, fanDy = 0] of DOT_CITIES) {
    const [x, y] = projection([lon, lat]); // d3 projections take [lon, lat]
    const dot = { x: round2((x / VIEW_W) * 100 + fanDx), y: round2((y / viewH) * 100 + fanDy) };
    if (dot.x < 0 || dot.x > 100 || dot.y < 0 || dot.y > 100) {
      fail(`dot ${key} projected outside the map box (${dot.x}%, ${dot.y}%)`);
    }
    dots[key] = dot;
  }
  return dots;
}

// The label anchors (2026-10-20g): one per covered country — the projected
// centroid of its LARGEST polygon (the mainland), so multi-polygon countries
// (USA + Alaska, Canada + its islands, Japan + Honshu) anchor their name on
// the piece a reader would point at.
function buildLabels(countries, projection) {
  const path = geoPath(projection);
  const labels = {};
  for (const iso of LABEL_COUNTRIES) {
    const feature = countries.find((f) => f.id === iso);
    if (feature === undefined) fail(`label country ${iso} missing from the map`);
    const geom = feature.geometry;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
    let best = null;
    let bestArea = -1;
    for (const poly of polys) {
      const obj = { type: 'Polygon', coordinates: poly };
      const area = path.area(obj);
      if (area > bestArea) {
        bestArea = area;
        best = obj;
      }
    }
    if (best === null) fail(`label country ${iso} has no polygon`);
    const [cx, cy] = path.centroid(best);
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) fail(`label country ${iso} centroid not finite`);
    labels[iso] = { x: round2((cx / VIEW_W) * 100), y: round2((cy / viewH) * 100) };
  }
  return labels;
}

// --- flags sprite (spec B2) -------------------------------------------------

function flagSymbol(cc) {
  const src = readFileSync(require.resolve(`flag-icons/flags/1x1/${cc}.svg`), 'utf8');
  const viewBoxMatch = src.match(/viewBox="([^"]+)"/);
  const openTagEnd = src.indexOf('>', src.indexOf('<svg'));
  const closeTagAt = src.lastIndexOf('</svg>');
  if (!viewBoxMatch || openTagEnd < 0 || closeTagAt < 0) {
    fail(`unexpected flag-icons layout for "${cc}"`);
  }
  // Keep the flag's own viewBox (all flag-icons 1×1s are 0 0 512 512).
  const inner = src.slice(openTagEnd + 1, closeTagAt).trim();
  if (!inner) fail(`empty flag content for "${cc}"`);
  return `<symbol id="wm-flag-${cc}" viewBox="${viewBoxMatch[1]}">${inner}</symbol>`;
}

function buildFlagsSprite() {
  // The 1×1 sources carry their own per-country ids (e.g. "us-a", "in-d"),
  // so symbols cannot collide. xlink:href <use> chains (in, cn, kr) need the
  // xlink namespace declared on the sprite root to stay well-formed XML.
  const symbols = FLAG_COUNTRIES.map(flagSymbol).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">${symbols}</svg>\n`;
}

// --- main -------------------------------------------------------------------

const countries = buildCountries();
const { projection, viewH } = fitProjection();
const dots = buildDots(projection, viewH);
const labels = buildLabels(countries, projection);

// The DOT→COUNTRY table the config reads (iso per dot), kept beside the
// dots so the two never drift — the map component pairs them by market id.
const DOT_ISOS = {
  dow: '840', tsx: '124', sp500: '840', ndx: '840', ibov: '076', ftse: '826',
  cac: '250', dax: '276', stoxx50: null, nifty50: '356', hsi: '344', ssec: '156',
  taiex: '158', kospi: '410', n225: '392', asx200: '036',
};

// Every dot's country must actually be a path on the map — unless the 110 m
// data merges it into a neighbour (Hong Kong → China), which is exempt and
// documented: such a dot renders but tints nothing.
for (const [key] of DOT_CITIES) {
  const iso = DOT_ISOS[key];
  if (iso === null || DOT_ISO_EXEMPT.has(iso)) continue;
  if (!countries.some((f) => f.id === iso)) fail(`dot ${key}: country ${iso} missing from the map`);
}

// Land paths first try 1-decimal coordinates; if the budget is blown, tighten
// to 0 decimals (visually identical at this viewBox size). Still over → error.
let digits = 1;
let mapSvg = renderMapSvg(countries, projection, viewH, digits);
if (bytes(mapSvg) > MAX_SVG_BYTES) {
  digits = 0;
  mapSvg = renderMapSvg(countries, projection, viewH, digits);
}
if (bytes(mapSvg) > MAX_SVG_BYTES) {
  fail(`world-map.svg is ${bytes(mapSvg)} bytes — over the ${MAX_SVG_BYTES} byte budget even at 0 decimals`);
}

const geoJson = JSON.stringify({ viewBox: { width: VIEW_W, height: viewH }, dots, labels }, null, 2) + '\n';
const flagsSvg = buildFlagsSprite();

mkdirSync(dirname(svgOutPath), { recursive: true });
mkdirSync(dirname(geoOutPath), { recursive: true });
writeFileSync(svgOutPath, mapSvg);
writeFileSync(geoOutPath, geoJson);
writeFileSync(flagsOutPath, flagsSvg);

console.log(`✓ world-map.svg (${countries.length} country paths, viewBox 0 0 ${VIEW_W} ${viewH}, ${digits} decimal${digits === 1 ? '' : 's'}, ${bytes(mapSvg)} bytes ≤ ${MAX_SVG_BYTES})`);
console.log(`✓ world-map-geo.json (${Object.keys(dots).length} dots, ${Object.keys(labels).length} label anchors, viewBox ${VIEW_W}×${viewH}, ${bytes(geoJson)} bytes)`);
for (const [key] of DOT_CITIES) {
  console.log(`  ${key.padEnd(7)} x ${String(dots[key].x).padStart(5)}%  y ${String(dots[key].y).padStart(5)}%`);
}
for (const iso of LABEL_COUNTRIES) {
  console.log(`  label ${iso}  x ${String(labels[iso].x).padStart(5)}%  y ${String(labels[iso].y).padStart(5)}%`);
}
console.log(`✓ world-flags.svg (${FLAG_COUNTRIES.length} symbols, ${bytes(flagsSvg)} bytes)`);
