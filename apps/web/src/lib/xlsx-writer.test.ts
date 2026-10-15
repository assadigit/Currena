import { describe, expect, it } from 'vitest';
import { buildXlsxBlob, XLSX_MIME, type XlsxSheet } from './xlsx-writer';

/**
 * Structural ZIP reader used by the tests: walks the end-of-central-directory
 * backwards and validates every entry (name, offsets, STORE method, CRC-32).
 */
function readZip(bytes: Uint8Array): Map<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();

  // Locate EOCD (scan backwards; comment length is 0 in our writer).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  expect(eocd).toBeGreaterThanOrEqual(0);

  const entryCount = view.getUint16(eocd + 10, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  const centralSize = view.getUint32(eocd + 12, true);
  expect(centralOffset + centralSize).toBe(eocd); // CD ends exactly at EOCD

  const files = new Map<string, string>();
  let at = centralOffset;
  for (let n = 0; n < entryCount; n++) {
    expect(view.getUint32(at, true)).toBe(0x02014b50); // central signature
    const method = view.getUint16(at + 10, true);
    expect(method).toBe(0); // STORE
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const localOffset = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLen));

    // Validate the local header it points at.
    expect(view.getUint32(localOffset, true)).toBe(0x04034b50);
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const data = bytes.subarray(dataStart, dataStart + size);
    expect(data.length).toBe(size);

    // CRC must match the (recomputed) CRC of the stored data.
    expect(crcOf(data)).toBe(crc);

    files.set(name, decoder.decode(data));
    at += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/** Reference CRC-32 (IEEE) — independent reimplementation for cross-checking. */
function crcOf(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

async function entries(sheet: XlsxSheet | XlsxSheet[], opts?: { rtl?: boolean }): Promise<Map<string, string>> {
  const blob = buildXlsxBlob(Array.isArray(sheet) ? sheet : [sheet], opts);
  expect(blob.type).toBe(XLSX_MIME);
  const buffer = await blob.arrayBuffer();
  return readZip(new Uint8Array(buffer));
}

const RECEIPT_ROWS: (string | number | null)[][] = [
  ['EXPENSE RECEIPT'],
  ['Date', '2026-09-24'],
  [null],
  ['Category', 'Amount', 'Currency', 'Notes'],
  ['Taxi', 42.5, 'EUR', 'airport <run>'],
  ['Food', 12, 'EUR', 'kebab & doogh'],
  [null],
  ['TOTAL', 54.5, 'EUR', null],
];

describe('xlsx-writer — OOXML structure', () => {
  it('produces every required part with correct relationships', async () => {
    const files = await entries({ name: 'Receipt', rows: RECEIPT_ROWS });
    expect([...files.keys()].sort()).toEqual(
      [
        '[Content_Types].xml',
        '_rels/.rels',
        'docProps/app.xml',
        'docProps/core.xml',
        'xl/_rels/workbook.xml.rels',
        'xl/styles.xml',
        'xl/workbook.xml',
        'xl/worksheets/sheet1.xml',
      ].sort(),
    );

    const contentTypes = files.get('[Content_Types].xml')!;
    expect(contentTypes).toContain('/xl/workbook.xml');
    expect(contentTypes).toContain('/xl/worksheets/sheet1.xml');
    expect(contentTypes).toContain('/xl/styles.xml');
    expect(contentTypes).toContain('/docProps/core.xml');
    expect(contentTypes).toContain('/docProps/app.xml');

    const rootRels = files.get('_rels/.rels')!;
    expect(rootRels).toContain('Target="xl/workbook.xml"');
    expect(rootRels).toContain('Target="docProps/core.xml"');
    expect(rootRels).toContain('Target="docProps/app.xml"');

    const workbook = files.get('xl/workbook.xml')!;
    expect(workbook).toContain('<sheet name="Receipt" sheetId="1" r:id="rId1"/>');

    const workbookRels = files.get('xl/_rels/workbook.xml.rels')!;
    expect(workbookRels).toContain('Target="worksheets/sheet1.xml"');
    expect(workbookRels).toContain('Target="styles.xml"');

    expect(files.get('xl/styles.xml')!).toContain('<cellXfs count="1">');
    // The named "Normal" style floor — strict viewers warn/repair without it.
    expect(files.get('xl/styles.xml')!).toContain('<cellStyle name="Normal" xfId="0" builtinId="0"/>');
  });

  it('writes strings as inlineStr (XML-escaped) and numbers as <v>', async () => {
    const files = await entries({ name: 'Receipt', rows: RECEIPT_ROWS });
    const sheet = files.get('xl/worksheets/sheet1.xml')!;

    // Header cell A1 as inline string with preserved whitespace semantics
    // (xml:space sits on <t>, where Excel itself puts it).
    expect(sheet).toContain('<c r="A1" t="inlineStr"><is><t xml:space="preserve">EXPENSE RECEIPT</t></is></c>');
    // Numeric amount cell.
    expect(sheet).toContain('<c r="B5"><v>42.5</v></c>');
    // XML-escaped notes.
    expect(sheet).toContain('airport &lt;run&gt;');
    expect(sheet).toContain('kebab &amp; doogh');
    // TOTAL row numeric.
    expect(sheet).toContain('<c r="B8"><v>54.5</v></c>');
    // Empty rows are emitted as bare <row r="N"/>.
    expect(sheet).toContain('<row r="3"/>');
    expect(sheet).toContain('<row r="7"/>');
    // null cells produce no <c> element.
    expect(sheet).not.toContain('<c r="D8"');
  });

  it('supports multiple named sheets with sequential rIds', async () => {
    const files = await entries([
      { name: 'Receipt', rows: [['a']] },
      { name: 'دسته‌بندی' /* non-ASCII sheet name */, rows: [['ب']] },
    ]);
    const workbook = files.get('xl/workbook.xml')!;
    expect(workbook).toContain('r:id="rId1"');
    expect(workbook).toContain('r:id="rId2"');
    expect(files.has('xl/worksheets/sheet2.xml')).toBe(true);
    const sheet2 = files.get('xl/worksheets/sheet2.xml')!;
    expect(sheet2).toContain('<t xml:space="preserve">ب</t>');
  });

  it('frames every sheet with a dimension, a default view and column widths', async () => {
    const files = await entries({ name: 'Receipt', rows: RECEIPT_ROWS });
    const sheet = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('<dimension ref="A1:D8"/>'); // 4 columns × 8 rows
    expect(sheet).toContain('<sheetView workbookViewId="0"/>');
    expect(sheet).toContain('<cols><col min="1" max="4" width="22" customWidth="1"/></cols>');
    // Element order per the schema: dimension → sheetViews → cols → sheetData.
    expect(sheet.indexOf('<dimension')).toBeLessThan(sheet.indexOf('<sheetViews'));
    expect(sheet.indexOf('<sheetViews')).toBeLessThan(sheet.indexOf('<cols'));
    expect(sheet.indexOf('<cols')).toBeLessThan(sheet.indexOf('<sheetData'));
  });

  it('flips the sheet view to right-to-left only when asked', async () => {
    const rtl = await entries({ name: 'S', rows: [['x']] }, { rtl: true });
    expect(rtl.get('xl/worksheets/sheet1.xml')!).toContain('<sheetView rightToLeft="1" workbookViewId="0"/>');
    const ltr = await entries({ name: 'S', rows: [['x']] });
    expect(ltr.get('xl/worksheets/sheet1.xml')!).not.toContain('rightToLeft');
  });

  it('writes numbers as plain decimals (never exponent forms in <v>)', async () => {
    const files = await entries({ name: 'S', rows: [['tiny', 1.2e-7], ['zero', -0]] });
    const sheet = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('<c r="B1"><v>0.00000012</v></c>');
    expect(sheet).toContain('<c r="B2"><v>0</v></c>');
    expect(sheet).not.toMatch(/[eE][+-]?\d/); // no 1.2e-7 style values
  });

  it('is deterministic — identical input produces identical bytes', async () => {
    const first = await (await buildXlsxBlob([{ name: 'S', rows: [['x', 1]] }])).arrayBuffer();
    const second = await (await buildXlsxBlob([{ name: 'S', rows: [['x', 1]] }])).arrayBuffer();
    expect(new Uint8Array(second)).toEqual(new Uint8Array(first));
  });

  it('rejects invalid sheet names and empty sheet lists loudly', () => {
    expect(() => buildXlsxBlob([])).toThrow(/at least one sheet/);
    expect(() => buildXlsxBlob([{ name: 'a/b', rows: [] }])).toThrow(/invalid sheet name/);
    expect(() => buildXlsxBlob([{ name: 'x'.repeat(32), rows: [] }])).toThrow(/invalid sheet name/);
    expect(() => buildXlsxBlob([{ name: '', rows: [] }])).toThrow(/invalid sheet name/);
  });

  it('drops non-finite numbers instead of writing garbage', async () => {
    const files = await entries({ name: 'S', rows: [['ok', Number.NaN, Number.POSITIVE_INFINITY, 3]] });
    const sheet = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('<c r="A1"');
    expect(sheet).toContain('<c r="D1"><v>3</v></c>');
    expect(sheet).not.toContain('NaN');
    expect(sheet).not.toContain('Infinity');
  });

  it('column letters cover A→Z and AA+ (receipt tables never need it, ZIP does not care)', async () => {
    const wide: (string | number)[][] = [Array.from({ length: 27 }, (_, i) => i)];
    const files = await entries({ name: 'S', rows: wide });
    const sheet = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('<c r="Z1"><v>25</v></c>');
    expect(sheet).toContain('<c r="AA1"><v>26</v></c>');
  });
});
