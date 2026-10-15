/**
 * Minimal zero-dependency .xlsx writer (replaces the CVE-laden unmaintained
 * npm `xlsx@0.18.5` — GHSA-4r6h-8v6p-xvw6 prototype pollution and
 * GHSA-5pgg-2g8v-p4x9 ReDoS; the patched builds only exist outside npm).
 *
 * Produces a valid Office Open XML workbook: a STORE-method ZIP (no
 * compression — xlsx readers accept it and it keeps the writer ~150 lines)
 * containing workbook/sheet/styles/docProps parts, with cell text as
 * `inlineStr` (no sharedStrings table needed). Output is deterministic
 * (fixed DOS timestamp), so tests can assert byte-for-byte stability.
 *
 * 2026-10-18 hardening (the Insights full export must open cleanly in
 * strict viewers — Excel mobile / WPS repair-or-refuse minimal packages):
 * docProps parts, a named "Normal" cell style, a per-sheet <dimension> and
 * <cols> width, xml:space moved onto <t> (the conventional placement), a
 * plain-decimal guard for numbers (never "1.2e-7" in <v>), and an optional
 * rightToLeft sheet view for the fa workbook.
 *
 * Scope: string/number grids, one or more named sheets — exactly what the
 * Receipt export needs. Not a general-purpose spreadsheet engine.
 */

/** One worksheet: a grid of cells; a cell is a string, number, or null. */
export interface XlsxSheet {
  /** 1–31 chars, no `[]:*?/\` (Excel sheet-name rules). */
  name: string;
  /** Rows of cells; row/col order is preserved as-is. */
  rows: (string | number | null)[][];
}

/* ----------------------------- CRC-32 (IEEE) ----------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]!) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* ------------------------------ ZIP (STORE) ------------------------------ */

/** Fixed DOS timestamp 1980-01-01 00:00 — keeps archives deterministic. */
const DOS_TIME = 0x0000;
const DOS_DATE = 0x0021;

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  /** Byte offset of the local header (filled while building). */
  offset: number;
}

function buildZip(files: { name: string; contents: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = files.map((file) => {
    const data = encoder.encode(file.contents);
    return { name: file.name, data, crc: crc32(data), offset: 0 };
  });

  const chunks: Uint8Array[] = [];
  let offset = 0;

  const push = (bytes: Uint8Array): void => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  // Local file headers + contents.
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    entry.offset = offset;
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // local file header signature
    view.setUint16(4, 20, true); // version needed (2.0)
    view.setUint16(6, 0, true); // flags (ASCII names, no UTF-8 bit)
    view.setUint16(8, 0, true); // method: STORE
    view.setUint16(10, DOS_TIME, true);
    view.setUint16(12, DOS_DATE, true);
    view.setUint32(14, entry.crc, true);
    view.setUint32(18, entry.data.length, true); // compressed size
    view.setUint32(22, entry.data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra length
    header.set(nameBytes, 30);
    push(header);
    push(entry.data);
  }

  // Central directory.
  const centralStart = offset;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const central = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(central.buffer);
    view.setUint32(0, 0x02014b50, true); // central directory signature
    view.setUint16(4, 20, true); // version made by
    view.setUint16(6, 20, true); // version needed
    view.setUint16(8, 0, true); // flags
    view.setUint16(10, 0, true); // method: STORE
    view.setUint16(12, DOS_TIME, true);
    view.setUint16(14, DOS_DATE, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.data.length, true);
    view.setUint32(24, entry.data.length, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true); // extra
    view.setUint16(32, 0, true); // comment
    view.setUint16(34, 0, true); // disk start
    view.setUint16(36, 0, true); // internal attrs
    view.setUint32(38, 0, true); // external attrs
    view.setUint32(42, entry.offset, true); // local header offset
    central.set(nameBytes, 46);
    push(central);
  }
  const centralSize = offset - centralStart;

  // End of central directory.
  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true); // disk number
  view.setUint16(6, 0, true); // disk with central directory
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralStart, true);
  view.setUint16(20, 0, true); // comment length
  push(eocd);

  const out = new Uint8Array(offset);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

/* ------------------------------- OOXML parts ------------------------------ */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** A1-style column letters for a 0-based column index (0→A, 26→AA, …). */
function columnLetters(index: number): string {
  let n = index;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

/** Plain decimal for <v> — xsd:double allows "1.2e-7" but several
 * spreadsheet viewers mis-parse exponent forms; write plain decimals. */
function numberToXml(n: number): string {
  const s = String(n);
  if (!/[eE]/.test(s)) return s === '-0' ? '0' : s;
  return n
    .toFixed(20)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
    .replace(/^-0$/, '0');
}

function cellXml(rowNumber: number, columnIndex: number, cell: string | number | null): string {
  if (cell === null || cell === undefined) return '';
  const ref = `${columnLetters(columnIndex)}${rowNumber}`;
  if (typeof cell === 'number') {
    if (!Number.isFinite(cell)) return ''; // never write NaN/Infinity as <v>
    return `<c r="${ref}"><v>${numberToXml(cell)}</v></c>`;
  }
  // Preserve leading/trailing whitespace exactly (xml:space on <t>, the
  // placement Excel itself uses).
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet, rtlView: boolean): string {
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const r = rowIndex + 1;
      const cells = row
        .map((cell, columnIndex) => cellXml(r, columnIndex, cell))
        .join('');
      return cells === '' ? `<row r="${r}"/>` : `<row r="${r}">${cells}</row>`;
    })
    .join('');
  // Lightweight viewers rely on <dimension>; <cols> lifts every column off
  // the 8.43 default so Persian/English names are readable without resizing.
  const maxCols = sheet.rows.reduce((m, row) => Math.max(m, row.length), 0);
  const dimension = `A1:${columnLetters(Math.max(0, maxCols - 1))}${Math.max(1, sheet.rows.length)}`;
  const cols = maxCols > 0 ? `<cols><col min="1" max="${maxCols}" width="22" customWidth="1"/></cols>` : '';
  const rtlAttr = rtlView ? ' rightToLeft="1"' : '';
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="${dimension}"/>` +
    `<sheetViews><sheetView${rtlAttr} workbookViewId="0"/></sheetViews>` +
    cols +
    `<sheetData>${rows}</sheetData>` +
    `</worksheet>`
  );
}

const CONTENT_TYPES = (sheetCount: number): string =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
  '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  Array.from(
    { length: sheetCount },
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join('') +
  '</Types>';

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
  '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
  '</Relationships>';

/** Deterministic doc parts (fixed timestamp) — several strict viewers
 * (Excel mobile, WPS, QuickLook) expect a docProps floor. */
const DOC_PROPS_CORE =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
  'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
  '<dc:creator>Currena</dc:creator><cp:lastModifiedBy>Currena</cp:lastModifiedBy>' +
  '<dcterms:created xsi:type="dcterms:W3CDTF">1980-01-01T00:00:00Z</dcterms:created>' +
  '</cp:coreProperties>';

const DOC_PROPS_APP =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
  '<Application>Currena</Application>' +
  '</Properties>';

function workbookXml(sheets: XlsxSheet[]): string {
  const sheetTags = sheets
    .map(
      (sheet, i) =>
        `<sheet name="${escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets>${sheetTags}</sheets>` +
    '</workbook>'
  );
}

function workbookRels(sheetCount: number): string {
  const rels = [
    ...Array.from(
      { length: sheetCount },
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    ),
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
  ].join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`
  );
}

/** Excel requires a styles part with at least one cellXf. */
const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border/></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

/* --------------------------------- API ----------------------------------- */

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Build a .xlsx Blob from one or more sheets. Throws on invalid sheet names
 * (Excel's rules) — validate at the UI boundary, not here in library code.
 * `opts.rtl` flips every sheet to a right-to-left view (the fa workbook).
 */
export function buildXlsxBlob(sheets: XlsxSheet[], opts?: { rtl?: boolean }): Blob {
  if (sheets.length === 0) throw new Error('xlsx-writer: at least one sheet is required');
  for (const sheet of sheets) {
    if (!/^[^\\/?*[\]:]{1,31}$/.test(sheet.name)) {
      throw new Error(`xlsx-writer: invalid sheet name ${JSON.stringify(sheet.name)}`);
    }
  }

  const files: { name: string; contents: string }[] = [
    { name: '[Content_Types].xml', contents: CONTENT_TYPES(sheets.length) },
    { name: '_rels/.rels', contents: ROOT_RELS },
    { name: 'docProps/core.xml', contents: DOC_PROPS_CORE },
    { name: 'docProps/app.xml', contents: DOC_PROPS_APP },
    { name: 'xl/workbook.xml', contents: workbookXml(sheets) },
    { name: 'xl/_rels/workbook.xml.rels', contents: workbookRels(sheets.length) },
    { name: 'xl/styles.xml', contents: STYLES },
    ...sheets.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      contents: sheetXml(sheet, opts?.rtl === true),
    })),
  ];

  return new Blob([buildZip(files) as BlobPart], { type: XLSX_MIME });
}
