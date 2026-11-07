/**
 * sge-monthly.ts — GF-S11 (P4, 2026-11-07 — audit report §4 rank 38 / F15,
 * unblocked by the owner's round-2 answer (e), the SGE class acceptance):
 * the exchange's MONTHLY "Data Highlights" statistics PDFs — the gold
 * WITHDRAWAL volume (the metal physically pulled from SGE vaults), the
 * classic China physical-demand proxy.
 *
 * The venue (verified live 2026-11-07, the honest CurrenaDashboard UA):
 * en.sge.com.cn/data_MonthlyReport lists the monthly PDFs ("Data
 * Highlights--October 2026.pdf" — the naming shifted across months: older
 * files carry "Monthly Report of Data Highlights(August, 2026)"; the parse
 * accepts both shapes). The PDF's "Other Market Data — Delivery Volume"
 * section carries the withdrawal table, GOLD column first ("Withdrawal
 * Volume (Present Month) 92,083.24 147,465.00" — kg, October 2026 read
 * live: 92.1 tonnes of gold withdrawn).
 *
 * The PDF text extraction (validated against the venue's own files,
 * 2026-11-07): the text uses CID-keyed fonts with ToUnicode CMaps — the
 * extractor walks the objects, parses each font's CMap (bfchar/bfrange),
 * and decodes the content streams' hex strings per the CURRENT font (the
 * Tf operator), joining each BT..ET text block tightly and the blocks
 * with spaces (the label/value separation the table's layout gives).
 * FlateDecode streams inflate through the web-standard
 * DecompressionStream('deflate') — the xlsx.ts discipline, no
 * dependencies. Every structural surprise throws loudly (F-16).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const SGE_MONTHLY_REPORT_URL = 'https://en.sge.com.cn/data_MonthlyReport';

/** One listed monthly report PDF. */
export interface SgeMonthlyReportLink {
  /** The absolute PDF URL. */
  url: string;
  /** The reference month, normalized to YYYY-MM. */
  month: string;
  /** The page's own link label (the evidence). */
  label: string;
}

const MONTHS: Readonly<Record<string, number>> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

/**
 * Parse the monthly-report index page into its PDF links (pure). Both
 * label shapes the venue has used are accepted:
 *   "Data Highlights--October 2026.pdf"
 *   "Monthly Report of Data Highlights(August, 2026)"
 */
export function parseSgeMonthlyReportIndex(html: string, baseUrl = SGE_MONTHLY_REPORT_URL): SgeMonthlyReportLink[] {
  if (!html.includes('data_MonthlyReport') && !html.includes('MonthlyReport')) {
    throw new FormatChangedError('SGE monthly: the monthly-report page marker is absent — the page shape changed');
  }
  const out: SgeMonthlyReportLink[] = [];
  const seen = new Set<string>();
  const anchorRe = /<a[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(anchorRe)) {
    const href = m[1]!;
    const label = m[2]!.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    const monthMatch = /([A-Z][a-z]+)\s*,?\s+(\d{4})/.exec(label);
    if (monthMatch === null || MONTHS[monthMatch[1]!] === undefined) continue; // not a monthly Data Highlights link
    const month = `${monthMatch[2]}-${String(MONTHS[monthMatch[1]!]).padStart(2, '0')}`;
    if (seen.has(month)) continue;
    seen.add(month);
    const url = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
    out.push({ url, month, label });
  }
  out.sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  return out;
}

/* ------------------------------------------------------------------ *
 * The minimal PDF text extractor (the CID-font walk).                *
 * ------------------------------------------------------------------ */

/** Inflate zlib-deflate bytes via the web-standard DecompressionStream. */
async function inflateZlib(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/** Decode a subarray of the PDF as latin-1 text (the operators are ASCII). */
function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]!);
  return out;
}

/** One raw PDF object: its dict text + stream bytes (when present). */
interface PdfObject {
  dict: string;
  stream?: Uint8Array<ArrayBuffer>;
  hasFlate: boolean;
}

/** Scan the PDF's indirect objects (the `N 0 obj … endobj` spans). */
function scanPdfObjects(pdf: Uint8Array<ArrayBuffer>): Map<number, PdfObject> {
  const text = latin1(pdf);
  const objects = new Map<number, PdfObject>();
  const objRe = /(\d+)\s+0\s+obj/g;
  const starts: { num: number; at: number }[] = [];
  for (const m of text.matchAll(objRe)) starts.push({ num: Number(m[1]), at: m.index! });
  for (let i = 0; i < starts.length; i++) {
    const { num, at } = starts[i]!;
    const end = i + 1 < starts.length ? starts[i + 1]!.at : Math.min(pdf.length, at + 2_000_000);
    // The dict: from `<<` after the obj header to the matching stream/endobj.
    const chunk = text.slice(at, end);
    const dictStart = chunk.indexOf('<<');
    if (dictStart < 0) continue;
    const streamAt = chunk.indexOf('stream', dictStart);
    const dictEnd = streamAt > 0 ? streamAt : chunk.indexOf('endobj', dictStart);
    if (dictEnd < 0) continue;
    const dict = chunk.slice(dictStart, dictEnd);
    let stream: Uint8Array<ArrayBuffer> | undefined;
    const hasFlate = dict.includes('FlateDecode');
    if (streamAt > 0) {
      // streamAt is RELATIVE to the chunk (which starts at `at`) — the
      // GF-S11 recovery repair (2026-11-07): the first cut double-counted
      // `at` (`at + text.indexOf('stream', at)` — an ABSOLUTE index plus
      // `at`), slicing every stream from deep inside its own bytes; the
      // CMap inflates then threw bare TypeErrors live (the live venue
      // verification caught it — the extractor had no test).
      const dataStart = at + streamAt + 'stream'.length;
      let s = dataStart;
      if (pdf[s] === 0x0d) s++;
      if (pdf[s] === 0x0a) s++;
      const endStreamAt = text.indexOf('endstream', s);
      if (endStreamAt > s) {
        let e = endStreamAt;
        // Trim ONE trailing EOL before endstream (the length/extent slop).
        if (pdf[e - 1] === 0x0a) e--;
        if (pdf[e - 1] === 0x0d) e--;
        stream = pdf.slice(s, e);
      }
    }
    objects.set(num, { dict, stream, hasFlate });
  }
  return objects;
}

/** Parse one ToUnicode CMap into its code → string table (bfchar + bfrange). */
function parseToUnicodeCMap(cmapText: string): Map<number, string> {
  const table = new Map<number, string>();
  for (const bf of cmapText.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of bf[1]!.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      table.set(parseInt(m[1]!, 16), hexToUtf16Be(m[2]!));
    }
  }
  for (const br of cmapText.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of br[1]!.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const lo = parseInt(m[1]!, 16);
      const hi = parseInt(m[2]!, 16);
      const base = parseInt(m[3]!, 16);
      for (let c = lo; c <= hi && c - lo < 65_536; c++) table.set(c, String.fromCharCode(base + (c - lo)));
    }
  }
  return table;
}

/** Decode a big-endian UTF-16 hex string ("0102…" → its characters). */
function hexToUtf16Be(hex: string): string {
  if (hex.length % 2 === 1) hex = `0${hex}`;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return new TextDecoder('utf-16be').decode(bytes);
}

/** Decode a PDF hex string with the font's CMap table (2-byte CID codes). */
function decodeHexString(hex: string, table: Map<number, string>): string {
  let h = hex.replace(/[^0-9A-Fa-f]/g, '');
  if (h.length % 2 === 1) h = `0${h}`;
  if (h.length % 4 !== 0) h = h.slice(0, h.length - (h.length % 4));
  let out = '';
  for (let i = 0; i < h.length; i += 4) {
    const code = parseInt(h.slice(i, i + 4), 16);
    out += table.get(code) ?? '';
  }
  return out;
}

/** Unescape a PDF literal string's body (the `(...)` content). */
function unescapeLiteral(body: string): string {
  return body.replace(/\\([nrtbf()\\]|(\d{1,3}))/g, (_, esc: string, oct: string | undefined) => {
    if (oct !== undefined) return String.fromCharCode(parseInt(oct, 8));
    if (esc === 'n') return '\n';
    if (esc === 'r') return '\r';
    if (esc === 't') return '\t';
    return esc; // ( ) \ b f pass through
  });
}

/**
 * Extract the PDF's text: every content stream's BT..ET blocks decoded
 * through their fonts' ToUnicode CMaps, blocks joined with spaces. Pure
 * async (the inflate); throws loudly on structural absence (no text
 * streams at all = a venue redesign).
 */
export async function extractPdfText(pdf: Uint8Array<ArrayBuffer>): Promise<string> {
  const objects = scanPdfObjects(pdf);
  // 1. The ToUnicode CMaps, keyed by the FONT object they belong to.
  const cmaps = new Map<number, Map<number, string>>();
  for (const [num, obj] of objects) {
    const tu = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(obj.dict);
    if (tu === null) continue;
    const tuObj = objects.get(Number(tu[1]));
    if (tuObj?.stream === undefined) continue;
    const raw = tuObj.hasFlate ? await inflateZlib(tuObj.stream) : tuObj.stream;
    cmaps.set(num, parseToUnicodeCMap(latin1(raw)));
  }
  if (cmaps.size === 0) {
    throw new FormatChangedError('SGE monthly: the PDF carries no ToUnicode CMaps — the file shape changed');
  }
  // 2. The page /Font resource maps (resource name → font object).
  const fontMaps: Map<string, number>[] = [];
  for (const obj of objects.values()) {
    if (!/\/Type\s*\/Page[^s]/.test(obj.dict)) continue;
    const fm = /\/Font\s*<<([^>]*)>>/.exec(obj.dict);
    if (fm === null) continue;
    const map = new Map<string, number>();
    for (const r of fm[1]!.matchAll(/\/(\w+)\s+(\d+)\s+0\s+R/g)) map.set(r[1]!, Number(r[2]));
    if (map.size > 0) fontMaps.push(map);
  }
  // The fallback table: the largest CMap (the venue's body fonts share
  // their glyph assignments; the title font decodes partially at worst).
  let fallback: Map<number, string> | undefined;
  for (const t of cmaps.values()) {
    if (fallback === undefined || t.size > fallback.size) fallback = t;
  }
  const tableFor = (resourceName: string | undefined): Map<number, string> | undefined => {
    if (resourceName !== undefined) {
      for (const fm of fontMaps) {
        const fontObj = fm.get(resourceName);
        if (fontObj !== undefined && cmaps.has(fontObj)) return cmaps.get(fontObj);
      }
    }
    return fallback;
  };
  // 3. The content streams: decode every BT..ET block's strings.
  const blocks: string[] = [];
  for (const obj of objects.values()) {
    if (obj.stream === undefined) continue;
    const isCmap = /\/ToUnicode/.test(obj.dict);
    if (isCmap) continue;
    let content: string;
    try {
      content = latin1(obj.hasFlate ? await inflateZlib(obj.stream) : obj.stream);
    } catch {
      continue; // a non-text deflate stream (images etc.) — not ours to read
    }
    if (!content.includes('TJ') && !content.includes('Tj')) continue;
    for (const bt of content.matchAll(/BT([\s\S]*?)ET/g)) {
      const pieces: string[] = [];
      let currentFont: string | undefined;
      const tokenRe = /\/(\w+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f\s]+)>|(\((?:[^()\\]|\\.)*\))/g;
      for (const m of bt[1]!.matchAll(tokenRe)) {
        if (m[1] !== undefined) {
          currentFont = m[1];
        } else if (m[2] !== undefined) {
          const table = tableFor(currentFont);
          if (table !== undefined) pieces.push(decodeHexString(m[2], table));
        } else if (m[3] !== undefined) {
          pieces.push(unescapeLiteral(m[3]!.slice(1, -1)));
        }
      }
      const joined = pieces.join('');
      if (joined.trim() !== '') blocks.push(joined);
    }
  }
  if (blocks.length === 0) {
    throw new FormatChangedError('SGE monthly: no text blocks decoded from the PDF — the file shape changed');
  }
  return blocks.join(' ');
}

/* ------------------------------------------------------------------ *
 * The withdrawal parse.                                               *
 * ------------------------------------------------------------------ */

/** One month's withdrawal read. */
export interface SgeWithdrawalReading {
  /** The reference month (YYYY-MM). */
  month: string;
  /** The GOLD withdrawal volume, tonnes (kg ÷ 1000, 2dp). */
  goldTonnes: number;
}

/**
 * Parse the extracted Data Highlights text for the gold withdrawal
 * volume (pure). The table's own column order (Gold, then Silver) is
 * pinned by the section header appearing in the extracted text.
 */
export function parseSgeWithdrawal(text: string, month: string): SgeWithdrawalReading {
  const m = /Withdrawal Volume \(Present Month\)\s*([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)/.exec(text);
  if (m === null) {
    throw new FormatChangedError('SGE monthly: the withdrawal-volume line is absent from the Data Highlights text');
  }
  const goldKg = Number(m[1]!.replace(/,/g, ''));
  const silverKg = Number(m[2]!.replace(/,/g, ''));
  if (!Number.isFinite(goldKg) || goldKg <= 0 || !Number.isFinite(silverKg) || silverKg <= 0) {
    throw new FormatChangedError(`SGE monthly: the withdrawal values are not positive numbers — "${m[0]}"`);
  }
  // The column-order pin: the section's own "Gold … Silver" header must
  // precede the values in the extracted text (a column swap fails loudly).
  // The header's inter-column spacing is the venue's own layout slop (the
  // October 2026 PDF renders "Gold   Silver" — three spaces; the recovery
  // repair, 2026-11-07: the first cut demanded exactly one), so the pin
  // tolerates any run of whitespace between the two words.
  const headerMatch = /Gold\s+Silver/.exec(text);
  const headerIdx = headerMatch === null ? -1 : headerMatch.index;
  const valuesIdx = text.indexOf(m[0]);
  if (headerIdx < 0 || valuesIdx < 0 || headerIdx > valuesIdx) {
    throw new FormatChangedError('SGE monthly: the Gold/Silver column header does not precede the withdrawal values — the table order changed');
  }
  return { month, goldTonnes: Math.round((goldKg / 1000) * 100) / 100 };
}

/**
 * Fetch the newest monthly Data Highlights PDF and read the gold
 * withdrawal volume (the index page → the newest link → the PDF). One
 * page request + one PDF request, the honest UA; throws loudly on any
 * block, non-2xx or shape change.
 */
export async function fetchSgeMonthlyWithdrawal(deps: FetchDeps = {}): Promise<SeriesPoint> {
  const indexRes = await insightsFetch(SGE_MONTHLY_REPORT_URL, {}, deps);
  const indexHtml = await indexRes.text();
  const links = parseSgeMonthlyReportIndex(indexHtml);
  const newest = links.at(-1);
  if (newest === undefined) {
    throw new FormatChangedError('SGE monthly: the monthly-report index lists no Data Highlights PDFs');
  }
  const pdfRes = await insightsFetch(newest.url, {}, { timeoutMs: 30_000, ...deps });
  const pdf = new Uint8Array(await pdfRes.arrayBuffer());
  const text = await extractPdfText(pdf);
  const reading = parseSgeWithdrawal(text, newest.month);
  return { date: `${reading.month}-01`, value: reading.goldTonnes };
}
