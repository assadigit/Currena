/**
 * sge-monthly.test.ts — GF-S11 (2026-11-07, the recovery repair's own
 * test): the monthly Data Highlights extractor's suites. The PDF is built
 * SYNTHETICALLY in-test (Node's own zlib deflate; the venue's file never
 * enters the repo — the licence stays clean) carrying the venue's real
 * structural shape as verified live 2026-11-07 (the October 2026 PDF,
 * 243,890 B):
 *
 *   · the objects carry FlateDecode streams at non-trivial file offsets,
 *     several objects deep — the regression pin for the recovery repair
 *     (the first cut's dataStart double-counted the object's own offset,
 *     slicing every stream from deep inside its bytes; the CMap inflates
 *     then threw bare TypeErrors and the live read failed);
 *   · the fonts are CID-keyed with ToUnicode CMaps (one bfrange identity
 *     map, one partial bfchar map — the per-font resolution + the
 *     largest-map fallback);
 *   · the content streams carry BT..ET blocks with hex strings under a
 *     Tf font switch AND one literal `(...)` string (both branches);
 *   · the header renders "Gold   Silver" — THREE spaces, the venue's own
 *     layout slop (the second repair: the column-order pin demanded
 *     exactly one);
 *   · one stream uses the CRLF EOL after `stream`, one the bare LF (the
 *     scanner's own EOL tolerance).
 *
 * The parse suites pin both index-label shapes the venue has used
 * ("Data Highlights--October 2026.pdf" and "Monthly Report of Data
 * Highlights(August, 2026)") and every fail-closed mutation of the
 * withdrawal parse (the absent line, the non-positive values, the column
 * swap). The fail-loud structural absences (no CMaps, no text blocks)
 * pin the venue-redesign alarms.
 */

import { describe, expect, it } from 'vitest';
import { deflateSync } from 'node:zlib';
import {
  extractPdfText,
  parseSgeMonthlyReportIndex,
  parseSgeWithdrawal,
  SGE_MONTHLY_REPORT_URL,
  type SgeMonthlyReportLink,
} from './sge-monthly';
import { FormatChangedError } from './fetch-policy';

/* ------------------------------------------------------------------ *
 * The synthetic venue-shaped PDF.                                     *
 * ------------------------------------------------------------------ */

const IDENTITY_CMAP = [
  '/CIDInit /ProcSet findresource begin',
  '12 dict begin',
  'begincmap',
  '/CMapName /Test-Identity def',
  '/CMapType 2 def',
  '1 begincodespacerange',
  '<0000> <ffff>',
  'endcodespacerange',
  '1 beginbfrange',
  '<0000> <ffff> <0000>',
  'endbfrange',
  'endcmap',
  'CMapName currentdict /CMap defineresource pop',
  'end',
  'end',
].join('\n');

// The partial bfchar map (the "title font" analog): only the codes the
// title uses, so the body font's identity map stays the largest table.
const PARTIAL_CMAP = [
  '/CIDInit /ProcSet findresource begin',
  '12 dict begin',
  'begincmap',
  '/CMapName /Test-Partial def',
  '1 begincodespacerange',
  '<0000> <ffff>',
  'endcodespacerange',
  '2 beginbfchar',
  '<004F> <004F>',
  '<0074> <0074>',
  '<0068> <0068>',
  '<0065> <0065>',
  '<0072> <0072>',
  'endbfchar',
  'endcmap',
  'end',
  'end',
].join('\n');

/** Encode ASCII text as 2-byte CID hex codes (the identity map). */
function hexCodes(text: string): string {
  return text
    .split('')
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

/** The venue-shaped content: the title (partial font) + the table. */
const CONTENT = [
  'BT',
  '/F2 9 Tf',
  `<${hexCodes('Other')}> Tj`,
  'ET',
  'BT',
  '/F1 10 Tf',
  `<${hexCodes('MarketData Delivery Volume  Gold   Silver')}> Tj`,
  'ET',
  'BT',
  '/F1 10 Tf',
  `<${hexCodes('Delivery Volume (Present Month) 613,288.68 939,750.00')}> Tj`,
  'ET',
  'BT',
  '/F1 10 Tf',
  `<${hexCodes('Withdrawal Volume (Present Month) 92,083.24 147,465.00')}> Tj`,
  'ET',
  'BT',
  '/F1 9 Tf',
  '(Delivery Volume \\(in kg\\)) Tj',
  'ET',
].join('\n');

/** Assemble the PDF: flate streams at non-trivial offsets, both EOLs. */
function buildVenuePdf(): Uint8Array<ArrayBuffer> {
  const parts: string[] = [];
  const streamObjects: { dict: string; body: Buffer; crlf: boolean }[] = [];
  const push = (s: string): void => {
    parts.push(s);
  };

  push('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n');
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');
  push('4 0 obj\n<< /Type /Font /Subtype /Type0 /BaseFont /ABCDEF+Body /Encoding /Identity-H /ToUnicode 7 0 R /DescendantFonts [9 0 R] >>\nendobj\n');
  push('5 0 obj\n<< /Type /Font /Subtype /Type0 /BaseFont /ABCDEF+Title /Encoding /Identity-H /ToUnicode 8 0 R /DescendantFonts [9 0 R] >>\nendobj\n');
  // The padding object: an uncompressed decoy stream several hundred bytes
  // deep, so every later stream's file offset is non-trivial (the
  // regression pin for the double-counted dataStart).
  push(
    '10 0 obj\n<< /Length 700 >>\nstream\n' +
      '//'.repeat(350) +
      '\nendstream\nendobj\n',
  );
  // The real streams: content (LF), the identity CMap (CRLF), the partial
  // CMap (LF) — the scanner's own EOL tolerance.
  streamObjects.push(
    { dict: '<< /Length L /Filter /FlateDecode >>', body: deflateSync(Buffer.from(CONTENT, 'latin1')), crlf: false },
    { dict: '<< /Length L /Filter /FlateDecode >>', body: deflateSync(Buffer.from(IDENTITY_CMAP, 'latin1')), crlf: true },
    { dict: '<< /Length L /Filter /FlateDecode >>', body: deflateSync(Buffer.from(PARTIAL_CMAP, 'latin1')), crlf: false },
  );
  const numbers = [6, 7, 8];
  for (let i = 0; i < streamObjects.length; i++) {
    const obj = streamObjects[i]!;
    const eol = obj.crlf ? '\r\n' : '\n';
    push(
      `${numbers[i]} 0 obj\n${obj.dict.replace('L', String(obj.body.byteLength))}\nstream${eol}`,
    );
    parts.push(obj.body.toString('latin1'));
    push(`\nendstream\nendobj\n`);
  }
  push('9 0 obj\n<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ABCDEF+Body /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> >>\nendobj\n');
  push('trailer\n<< /Size 11 /Root 1 0 R >>\n%%EOF\n');

  const text = parts.join('');
  const bytes = new Uint8Array<ArrayBuffer>(new ArrayBuffer(text.length));
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

/** The full extracted text the venue shape must yield. */
function expectedText(): string {
  return 'Other MarketData Delivery Volume  Gold   Silver Delivery Volume (Present Month) 613,288.68 939,750.00 Withdrawal Volume (Present Month) 92,083.24 147,465.00 Delivery Volume (in kg)';
}

describe('the SGE monthly PDF text extractor (the venue shape, synthetic)', () => {
  it('decodes the CID fonts through their ToUnicode CMaps at non-trivial offsets', async () => {
    const text = await extractPdfText(buildVenuePdf());
    // The regression pin: the October 2026 boundary repair — every stream
    // in this PDF sits several objects deep; a dataStart that double-counts
    // the object offset slices garbage and fails loudly here.
    expect(text).toBe(expectedText());
  });

  it('fails loudly when the PDF carries no ToUnicode CMaps (a venue redesign)', async () => {
    const noCmaps =
      '%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n2 0 obj\n<< /Length 4 >>\nstream\nBT ET\nendstream\nendobj\n';
    const bytes = new Uint8Array<ArrayBuffer>(new ArrayBuffer(noCmaps.length));
    for (let i = 0; i < noCmaps.length; i++) bytes[i] = noCmaps.charCodeAt(i) & 0xff;
    await expect(extractPdfText(bytes)).rejects.toThrow(FormatChangedError);
    await expect(extractPdfText(bytes)).rejects.toThrow(/no ToUnicode CMaps/);
  });

  it('fails loudly when no text blocks decode (a file-shape change)', async () => {
    const cmapOnly =
      '%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n2 0 obj\n<< /ToUnicode 3 0 R >>\nendobj\n3 0 obj\n<< /Length L /Filter /FlateDecode >>\nstream\n' +
      deflateSync(Buffer.from(IDENTITY_CMAP, 'latin1')).toString('latin1') +
      '\nendstream\nendobj\n';
    const bytes = new Uint8Array<ArrayBuffer>(new ArrayBuffer(cmapOnly.length));
    for (let i = 0; i < cmapOnly.length; i++) bytes[i] = cmapOnly.charCodeAt(i) & 0xff;
    await expect(extractPdfText(bytes)).rejects.toThrow(/no text blocks/);
  });
});

describe('the withdrawal parse (the Gold column first)', () => {
  const month = '2026-10';
  const text = expectedText();

  it('reads the gold withdrawal volume, kg → tonnes 2dp', () => {
    expect(parseSgeWithdrawal(text, month)).toEqual({ month, goldTonnes: 92.08 });
  });

  it('tolerates the header layout slop (Gold   Silver — three spaces)', () => {
    // The venue's own October 2026 render (the recovery repair: the first
    // pin demanded exactly one space and failed the live read).
    expect(parseSgeWithdrawal(text, month).goldTonnes).toBe(92.08);
  });

  it('fails loudly when the withdrawal line is absent', () => {
    expect(() => parseSgeWithdrawal('Other MarketData Delivery Volume Gold Silver', month)).toThrow(
      /withdrawal-volume line is absent/,
    );
  });

  it('fails loudly when the Gold/Silver header does not precede the values (a column swap)', () => {
    const swapped = 'Other MarketData Delivery Volume Silver   Gold Withdrawal Volume (Present Month) 92,083.24 147,465.00';
    expect(() => parseSgeWithdrawal(swapped, month)).toThrow(/column header does not precede/);
  });

  it('fails loudly on non-positive values', () => {
    const zero = 'Gold Silver Withdrawal Volume (Present Month) 0 147,465.00';
    expect(() => parseSgeWithdrawal(zero, month)).toThrow(/not positive numbers/);
  });
});

describe('the monthly-report index parse (both label shapes)', () => {
  const base = SGE_MONTHLY_REPORT_URL;

  function indexHtml(labels: string[]): string {
    const hrefs = [
      '/upload/file/202608/12/aaa.pdf',
      '/upload/file/202609/12/bbb.pdf',
      '/upload/file/202610/12/ccc.pdf',
    ];
    const anchors = labels
      .map((label, i) => `<a href="${hrefs[i]}" title="x">${label}</a>`)
      .join('\n');
    return `<html><body><div class="data_MonthlyReport">${anchors}</div></body></html>`;
  }

  it('parses the "Data Highlights--October 2026.pdf" shape', () => {
    const links = parseSgeMonthlyReportIndex(
      indexHtml([
        'Monthly Report of Data Highlights(July, 2026)',
        'Data Highlights--August 2026.pdf',
        'Data Highlights--September 2026.pdf',
      ]),
    );
    expect(links).toHaveLength(3);
    expect(links[0]).toEqual<SgeMonthlyReportLink>({
      url: `${base.slice(0, base.lastIndexOf('/'))}/upload/file/202608/12/aaa.pdf`,
      month: '2026-07',
      label: 'Monthly Report of Data Highlights(July, 2026)',
    });
    expect(links[2]!.month).toBe('2026-09');
    expect(links[2]!.url).toBe('https://en.sge.com.cn/upload/file/202610/12/ccc.pdf');
  });

  it('parses the "Monthly Report of Data Highlights(August, 2026)" shape', () => {
    const links = parseSgeMonthlyReportIndex(
      indexHtml(['Data Highlights--July 2026.pdf', 'Monthly Report of Data Highlights(August, 2026)', 'Data Highlights--September 2026.pdf']),
    );
    expect(links[1]!.month).toBe('2026-08');
  });

  it('skips non-monthly anchors and dedupes months, sorting ascending', () => {
    const html = [
      '<a href="/x.pdf">Annual Report 2025.pdf</a>',
      '<a href="/a.pdf">Data Highlights--October 2026.pdf</a>',
      '<a href="/b.pdf">Data Highlights--October 2026.pdf</a>',
      '<a href="/c.pdf">Data Highlights--September 2026.pdf</a>',
    ].join('\n');
    const links = parseSgeMonthlyReportIndex(`<div class="MonthlyReport">${html}</div>`);
    expect(links.map((l) => l.month)).toEqual(['2026-09', '2026-10']);
  });

  it('fails loudly when the page marker is absent (a venue redesign)', () => {
    expect(() => parseSgeMonthlyReportIndex('<html><body>nothing here</body></html>')).toThrow(
      /page marker is absent/,
    );
  });
});
