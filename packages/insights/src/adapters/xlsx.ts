/**
 * Minimal XLSX reader — just enough for the World Bank Pink Sheet workbook:
 * a ZIP container (local-file + central-directory records, deflate-raw or
 * stored entries) and one rectangular worksheet with shared strings.
 *
 * Platform-free per AGENTS.md rule 2: web-standard APIs ONLY —
 * `DecompressionStream('deflate-raw')`, `Blob`/`Response` streams and
 * `TextDecoder` — so the same code runs in the GitHub Actions runner (Node
 * ≥ 20) and, if ever needed, inside a Worker. No node:* imports, no zip
 * library, no dependencies.
 *
 * Everything unexpected throws loudly (rule 3): a workbook layout change is
 * an upstream change and must fail the adapter, never yield garbage.
 */

/** A parsed worksheet cell: the RESOLVED value (shared string or literal). */
export interface XlsxCell {
  /** Column letters, e.g. 'A', 'BR'. */
  col: string;
  /** 1-based row number. */
  row: number;
  /** Raw cell value: the shared string text, or the literal <v> text. */
  value: string;
  /** true when the cell was a shared-string reference (t="s"). */
  sharedString: boolean;
}

const ZIP_EOCD_SIG = 0x06054b50;
const ZIP_CDH_SIG = 0x02014b50;
const ZIP_LFH_SIG = 0x04034b50;

function u16(b: Uint8Array, off: number): number {
  return b[off]! | (b[off + 1]! << 8);
}

function u32(b: Uint8Array, off: number): number {
  return (b[off]! | (b[off + 1]! << 8) | (b[off + 2]! << 16) | (b[off + 3]! << 24)) >>> 0;
}

/** Inflate deflate-raw bytes via the web-standard DecompressionStream. */
async function inflateRaw(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/** Decode a subarray of the workbook as UTF-8 XML text. */
function decodeXml(bytes: Uint8Array<ArrayBuffer>): string {
  return new TextDecoder('utf-8').decode(bytes);
}

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

/**
 * Read the ZIP central directory. Zip64 is NOT supported and is asserted
 * absent (the Pink Sheet workbook is a few hundred KB; a zip64 workbook
 * would mean a fundamentally different file — fail loudly instead).
 */
function readCentralDirectory(zip: Uint8Array<ArrayBuffer>): ZipEntry[] {
  // EOCD lives in the last 65,535 bytes (minus its own 22-byte minimum).
  const scanFrom = Math.max(0, zip.length - 66_000);
  let eocd = -1;
  for (let i = zip.length - 22; i >= scanFrom; i--) {
    if (u32(zip, i) === ZIP_EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('XLSX: no End Of Central Directory record (not a ZIP/XLSX file?)');
  const entryCount = u16(zip, eocd + 10);
  const cdOffset = u32(zip, eocd + 16);
  if (cdOffset === 0xffffffff || entryCount === 0xffff) {
    throw new Error('XLSX: zip64 archive — unsupported (unexpected for this workbook)');
  }

  const entries: ZipEntry[] = [];
  let p = cdOffset;
  for (let n = 0; n < entryCount; n++) {
    if (u32(zip, p) !== ZIP_CDH_SIG) {
      throw new Error(`XLSX: central directory entry ${n} has a bad signature`);
    }
    const method = u16(zip, p + 10);
    const compressedSize = u32(zip, p + 20);
    const nameLen = u16(zip, p + 28);
    const extraLen = u16(zip, p + 30);
    const commentLen = u16(zip, p + 32);
    const localHeaderOffset = u32(zip, p + 42);
    if (localHeaderOffset === 0xffffffff) {
      throw new Error('XLSX: zip64 entry — unsupported (unexpected for this workbook)');
    }
    const name = decodeXml(zip.subarray(p + 46, p + 46 + nameLen));
    entries.push({ name, method, compressedSize, localHeaderOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Extract one ZIP entry's bytes (stored or deflate-raw). */
async function readEntry(zip: Uint8Array<ArrayBuffer>, entry: ZipEntry): Promise<Uint8Array<ArrayBuffer>> {
  const off = entry.localHeaderOffset;
  if (u32(zip, off) !== ZIP_LFH_SIG) {
    throw new Error(`XLSX: local header for "${entry.name}" has a bad signature`);
  }
  // The LOCAL header's name/extra lengths can differ from the central ones —
  // read them from the local header itself.
  const nameLen = u16(zip, off + 26);
  const extraLen = u16(zip, off + 28);
  const dataStart = off + 30 + nameLen + extraLen;
  const raw = zip.subarray(dataStart, dataStart + entry.compressedSize);
  if (raw.length !== entry.compressedSize) {
    throw new Error(`XLSX: entry "${entry.name}" is truncated (${raw.length} of ${entry.compressedSize} bytes)`);
  }
  if (entry.method === 0) return raw.slice() as Uint8Array<ArrayBuffer>;
  if (entry.method === 8) return inflateRaw(raw);
  throw new Error(`XLSX: entry "${entry.name}" uses compression method ${entry.method} (unsupported)`);
}

/** `<si>` runs concatenated (rich-text cells split text across multiple <t>). */
function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let text = '';
    for (const t of si[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) {
      text += t[1]!;
    }
    out.push(decodeXmlEntities(text));
  }
  return out;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Column letters from a cell reference like 'BR807'. */
function colOf(ref: string): string {
  const m = /^([A-Z]+)\d+$/.exec(ref);
  if (!m) throw new Error(`XLSX: cell reference "${ref}" is malformed`);
  return m[1]!;
}

/** Parse one worksheet's cells (values resolved against shared strings). */
function parseSheet(xml: string, sharedStrings: readonly string[]): XlsxCell[] {
  const cells: XlsxCell[] = [];
  for (const rowMatch of xml.matchAll(/<row [^>]*?r="(\d+)"[^>]*?>([\s\S]*?)<\/row>/g)) {
    const row = Number(rowMatch[1]);
    const body = rowMatch[2]!;
    for (const cellMatch of body.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = cellMatch[1]!;
      const attrs = cellMatch[2]!;
      const inner = cellMatch[3] ?? '';
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      if (type === 'e' || type === 'b') continue; // error/boolean cells carry no series value — skip
      if (type === 'inlineStr') {
        const text = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]!).join('');
        if (text === '') continue;
        cells.push({ col: colOf(ref), row, value: decodeXmlEntities(text), sharedString: false });
        continue;
      }
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      if (v === undefined) continue; // styling-only cell (no value) — skip
      if (type === 's') {
        const idx = Number(v);
        if (!Number.isInteger(idx) || idx < 0 || idx >= sharedStrings.length) {
          throw new Error(`XLSX: cell ${ref} references shared string ${v} (have ${sharedStrings.length})`);
        }
        cells.push({ col: colOf(ref), row, value: sharedStrings[idx]!, sharedString: true });
      } else if (type === 'str') {
        cells.push({ col: colOf(ref), row, value: decodeXmlEntities(v), sharedString: false });
      } else if (type === undefined) {
        cells.push({ col: colOf(ref), row, value: v, sharedString: false });
      } else {
        throw new Error(`XLSX: cell ${ref} has unsupported type "${type}"`);
      }
    }
  }
  return cells;
}

/** Map sheet NAME → worksheet ZIP entry, via workbook.xml + its .rels. */
function sheetNameToEntry(
  workbookXml: string,
  workbookRelsXml: string,
  entries: readonly ZipEntry[],
): Map<string, ZipEntry> {
  const relTargets = new Map<string, string>();
  for (const rel of workbookRelsXml.matchAll(/<Relationship\b[^>]*?\/>/g)) {
    const id = /\bId="([^"]+)"/.exec(rel[0])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(rel[0])?.[1];
    if (id !== undefined && target !== undefined) relTargets.set(id, target);
  }
  const out = new Map<string, ZipEntry>();
  for (const sheet of workbookXml.matchAll(/<sheet\b[^>]*?\/>/g)) {
    const name = /\bname="([^"]+)"/.exec(sheet[0])?.[1];
    const rid = /\br:id="([^"]+)"/.exec(sheet[0])?.[1];
    if (name === undefined || rid === undefined) continue; // non-data sheet spec — skip
    const target = relTargets.get(rid);
    if (!target) throw new Error(`XLSX: sheet "${name}" references unknown rel ${rid}`);
    // Rel targets are relative to xl/ ("worksheets/sheet2.xml").
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\.\//, '')}`;
    const entry = entries.find((e) => e.name === path);
    if (!entry) throw new Error(`XLSX: worksheet "${path}" (sheet "${name}") not found in archive`);
    out.set(name, entry);
  }
  return out;
}

/**
 * Read one named worksheet of an XLSX workbook. Returns every valued cell of
 * that sheet with shared strings resolved. Throws on any structural surprise.
 */
export async function readXlsxSheet(
  xlsx: Uint8Array<ArrayBuffer>,
  sheetName: string,
): Promise<XlsxCell[]> {
  const entries = readCentralDirectory(xlsx);
  const entryTexts = new Map<string, string>();
  for (const name of ['xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/sharedStrings.xml']) {
    const entry = entries.find((e) => e.name === name);
    if (!entry) throw new Error(`XLSX: archive part "${name}" is missing`);
    entryTexts.set(name, decodeXml(await readEntry(xlsx, entry)));
  }
  const sharedStrings = parseSharedStrings(entryTexts.get('xl/sharedStrings.xml')!);

  const sheets = sheetNameToEntry(
    entryTexts.get('xl/workbook.xml')!,
    entryTexts.get('xl/_rels/workbook.xml.rels')!,
    entries,
  );
  const sheetEntry = sheets.get(sheetName);
  if (sheetEntry === undefined) {
    throw new Error(`XLSX: no sheet named "${sheetName}" (have: ${[...sheets.keys()].join(', ')})`);
  }
  return parseSheet(decodeXml(await readEntry(xlsx, sheetEntry)), sharedStrings);
}
