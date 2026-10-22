/**
 * biff.ts — a minimal dependency-free OLE2 + BIFF8 reader, JUST enough for
 * the EIA `hist_xls/*.xls` spot-price workbooks (the 2026-10-22 reliability
 * round's FRED fallback — see eia.ts).
 *
 * Scope, verified against the live workbooks (venue-probed 2026-10-22):
 *  - an OLE2 compound file (512-byte sectors, header DIFAT ≤ 109 FAT sectors)
 *    whose "Workbook" (or "Book") directory stream is a REGULAR FAT chain
 *    (the EIA workbook stream is ~400 KB — mini-streams are refused loudly,
 *    not guessed at);
 *  - BIFF8 records: BOF/EOF substream framing, SST shared strings (8-bit
 *    and 16-bit, rich/ext runs skipped, single-record only — a continuation
 *    truncates the table and unparsed indexes resolve to undefined, which
 *    the adapter's identity assertions turn into a loud format-changed
 *    failure), and the cell records NUMBER / RK / MULRK / LABEL / LABELSST;
 *  - every sheet's cells into a sparse row-major grid. Formula results,
 *    charts, styles and everything else are skipped by record size.
 *
 * Platform-free per AGENTS.md rule 2 (web-standard APIs only): pure
 * ArrayBuffer/DataView arithmetic, no node:* imports, no dependencies.
 * Everything unexpected throws loudly (rule 3) — an upstream layout change
 * must fail the adapter, never yield garbage numbers.
 */

/** One worksheet's parsed cells: rows of (col → string|number). */
export interface BiffSheet {
  name: string;
  /** Row-major grid; empty cells are absent (undefined). */
  rows: Array<Map<number, string | number>>;
}

/** An .xls workbook parsed to its worksheets (BOF/EOF substream framing). */
export interface BiffWorkbook {
  sheets: BiffSheet[];
}

/* ------------------------------------------------------------------ *
 * OLE2 compound file layer
 * ------------------------------------------------------------------ */

const OLE2_SIG = 0xe11ab1a1e011cfd0n; // D0 CF 11 E0 A1 B1 1A E1 as read LE
const FAT_FREE = 0xffffffff;
const FAT_END = 0xfffffffe;
const MAX_DIFAT = 109; // header-carried FAT sector pointers

/** A parsed OLE2 file: sector-size + the FAT chain table. */
interface Ole2File {
  data: Uint8Array;
  view: DataView;
  sectorSize: number;
  fat: Uint32Array;
}

function readU16(v: DataView, off: number): number {
  return v.getUint16(off, true);
}
function readU32(v: DataView, off: number): number {
  return v.getUint32(off, true);
}

/** Parse the OLE2 header + FAT. Throws loudly on anything unexpected. */
function parseOle2(buf: ArrayBuffer): Ole2File {
  const data = new Uint8Array(buf);
  if (buf.byteLength < 512) throw new Error('BIFF: file shorter than one OLE2 sector');
  const view = new DataView(buf);
  if (view.getBigUint64(0, true) !== OLE2_SIG) {
    throw new Error('BIFF: not an OLE2 compound file (bad signature — not a real .xls?)');
  }
  const sectorShift = readU16(view, 0x1e);
  const sectorSize = 1 << sectorShift;
  if (sectorSize !== 512) throw new Error(`BIFF: unsupported OLE2 sector size ${sectorSize} (expected 512)`);
  const nFatSectors = readU32(view, 0x2c);
  if (nFatSectors > MAX_DIFAT) {
    throw new Error(`BIFF: ${nFatSectors} FAT sectors exceed the header DIFAT (${MAX_DIFAT}) — unsupported`);
  }
  // Header DIFAT: 109 u32 entries at 0x4C.
  const fatSectorIds: number[] = [];
  for (let i = 0; i < nFatSectors; i += 1) {
    const id = readU32(view, 0x4c + i * 4);
    if (id === FAT_FREE) throw new Error(`BIFF: DIFAT slot ${i} empty before ${nFatSectors} FAT sectors`);
    fatSectorIds.push(id);
  }
  // Read the FAT: each FAT sector holds sectorSize/4 u32 entries.
  const entriesPerSector = sectorSize / 4;
  const fat = new Uint32Array(nFatSectors * entriesPerSector);
  let w = 0;
  for (const id of fatSectorIds) {
    const base = 512 + id * sectorSize;
    if (base + sectorSize > data.length) throw new Error(`BIFF: FAT sector ${id} out of bounds`);
    for (let e = 0; e < entriesPerSector; e += 1) {
      fat[w] = readU32(view, base + e * 4);
      w += 1;
    }
  }
  return { data, view, sectorSize, fat };
}

/** Byte offset of sector n's start. */
function sectorOffset(file: Ole2File, n: number): number {
  return 512 + n * file.sectorSize;
}

/** Follow a FAT chain from `start`, reading exactly `size` bytes. */
function readChain(file: Ole2File, start: number, size: number): Uint8Array {
  if (size <= 0) throw new Error('BIFF: stream size must be positive');
  const out = new Uint8Array(size);
  let sector = start;
  let copied = 0;
  let guard = 0;
  const maxSectors = file.fat.length + 1;
  while (copied < size) {
    if (sector === FAT_END) throw new Error('BIFF: FAT chain ended before the stream size');
    if (sector >= file.fat.length) throw new Error(`BIFF: FAT chain points outside the table (sector ${sector})`);
    const off = sectorOffset(file, sector);
    if (off + file.sectorSize > file.data.length) throw new Error(`BIFF: sector ${sector} out of bounds`);
    const take = Math.min(file.sectorSize, size - copied);
    out.set(file.data.subarray(off, off + take), copied);
    copied += take;
    sector = file.fat[sector]!;
    guard += 1;
    if (guard > maxSectors) throw new Error('BIFF: FAT chain loop detected');
  }
  return out;
}

/** Follow a FAT chain from `start` until it ends; returns whole sectors. */
function readWholeChain(file: Ole2File, start: number): Uint8Array {
  const parts: Uint8Array[] = [];
  let total = 0;
  let sector = start;
  let guard = 0;
  const maxSectors = file.fat.length + 1;
  while (sector !== FAT_END) {
    if (sector >= file.fat.length) throw new Error(`BIFF: FAT chain points outside the table (sector ${sector})`);
    const off = sectorOffset(file, sector);
    if (off + file.sectorSize > file.data.length) throw new Error(`BIFF: sector ${sector} out of bounds`);
    parts.push(file.data.subarray(off, off + file.sectorSize));
    total += file.sectorSize;
    sector = file.fat[sector]!;
    guard += 1;
    if (guard > maxSectors) throw new Error('BIFF: FAT chain loop detected');
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

interface Ole2DirEntry {
  name: string;
  type: number; // 1=storage, 2=stream, 5=root
  start: number;
  size: number;
}

/** Parse the 128-byte directory entries (whole chain, however long). */
function readDirectory(file: Ole2File, firstDirSector: number): Ole2DirEntry[] {
  const dirBytes = readWholeChain(file, firstDirSector);
  const view = new DataView(dirBytes.buffer, dirBytes.byteOffset, dirBytes.byteLength);
  const out: Ole2DirEntry[] = [];
  for (let i = 0; i < dirBytes.byteLength; i += 128) {
    const nameLen = readU16(view, i + 0x40);
    const type = dirBytes[i + 0x42]!;
    if (type === 0) continue; // unused entry
    const nameByteLen = Math.max(0, nameLen - 2); // trailing UTF-16 null
    let name = '';
    for (let c = 0; c < nameByteLen; c += 2) {
      name += String.fromCharCode(readU16(view, i + c));
    }
    out.push({
      name,
      type,
      start: readU32(view, i + 0x74),
      size: readU32(view, i + 0x78),
    });
  }
  return out;
}

/** The Workbook (BIFF) stream of an OLE2 file, as bytes. */
function readWorkbookStream(buf: ArrayBuffer): Uint8Array {
  const file = parseOle2(buf);
  const dir = readDirectory(file, readU32(file.view, 0x30));
  const entry = dir.find((e) => (e.name === 'Workbook' || e.name === 'Book') && e.type === 2);
  if (entry === undefined) {
    throw new Error('BIFF: no "Workbook" stream in the OLE2 directory (upstream layout change?)');
  }
  if (entry.size < 4096) {
    throw new Error(`BIFF: Workbook stream is ${entry.size} bytes (mini-stream) — unsupported`);
  }
  return readChain(file, entry.start, entry.size);
}

/* ------------------------------------------------------------------ *
 * BIFF8 record layer
 * ------------------------------------------------------------------ */

const REC_BOF = 0x0809;
const REC_EOF = 0x000a;
const REC_SST = 0x00fc;
const REC_CONTINUE = 0x003c;
const REC_NUMBER = 0x0203;
const REC_RK = 0x027e;
const REC_MULRK = 0x00bd;
const REC_LABEL = 0x0204;
const REC_LABELSST = 0x00fd;

/** One raw BIFF record slice. */
interface Record {
  id: number;
  bytes: Uint8Array; // payload
}

/** Iterate records over the whole stream (BOF/EOF included as records). */
function* records(bytes: Uint8Array): Generator<Record> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 0;
  while (pos + 4 <= bytes.byteLength) {
    const id = view.getUint16(pos, true);
    const size = view.getUint16(pos + 2, true);
    pos += 4;
    if (pos + size > bytes.byteLength) {
      throw new Error(`BIFF: record 0x${id.toString(16)} (${size}B) runs past the stream end`);
    }
    yield { id, bytes: bytes.subarray(pos, pos + size) };
    pos += size;
  }
}

/** Decode one RK value. Layout: bit0 = value is ÷100; bit1 = 1 → the
 *  30-bit signed integer lives in bits 2…31, 0 → a truncated f64 (the 30
 *  bits are the f64's high mantissa+exponent bits, low 32 zero). */
function decodeRk(rk: number): number {
  const raw = rk >>> 0;
  if (raw & 0x02) {
    // Integer: bits 2…31, sign-extended from bit 29.
    const bits = raw >>> 2;
    let value = bits >= 0x2000_0000 ? bits - 0x4000_0000 : bits;
    if (raw & 0x01) value = value / 100;
    return value;
  }
  // Floating: place the value bits into the HIGH half of an f64.
  const buf = new ArrayBuffer(8);
  const v = new DataView(buf);
  v.setUint32(4, raw & 0xfffffffc, true);
  const value = v.getFloat64(0, true);
  return raw & 0x01 ? value / 100 : value;
}

/** Parse the SST record (+CONTINUEs, best-effort single-record strings). */
function parseSst(first: Uint8Array, continues: Uint8Array[]): Array<string | undefined> {
  const strings: Array<string | undefined> = [];
  const view = new DataView(first.buffer, first.byteOffset, first.byteLength);
  const unique = readU32(view, 4);
  let pos = 8;
  // Strings may continue into CONTINUE records; on a cross-record string we
  // stop and leave the rest undefined (loudly observable via assertions).
  const chunks: Uint8Array[] = [first, ...continues];
  let chunkIdx = 0;
  let chunk = chunks[0]!;
  const dv = () => new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  for (let s = 0; s < unique; s += 1) {
    if (pos + 3 > chunk.byteLength) {
      // Move to the next CONTINUE (the flags byte repeats at its start).
      chunkIdx += 1;
      if (chunkIdx >= chunks.length) break; // truncated — leave the rest undefined
      chunk = chunks[chunkIdx]!;
      pos = 0;
      if (pos + 3 > chunk.byteLength) break;
    }
    const cch = dv().getUint16(pos, true);
    const flags = chunk[pos + 2]!;
    const wide = (flags & 0x01) !== 0;
    const rich = (flags & 0x08) !== 0;
    const ext = (flags & 0x04) !== 0;
    pos += 3;
    if (rich) {
      if (pos + 2 > chunk.byteLength) break;
      pos += 2 + dv().getUint16(pos, true) * 4;
    }
    if (ext) {
      if (pos + 4 > chunk.byteLength) break;
      pos += 4 + dv().getUint32(pos, true);
    }
    const need = wide ? cch * 2 : cch;
    if (pos + need > chunk.byteLength) break; // string crosses a CONTINUE — stop
    let str = '';
    if (wide) {
      for (let c = 0; c < cch; c += 1) {
        str += String.fromCharCode(dv().getUint16(pos + c * 2, true));
      }
    } else {
      for (let c = 0; c < cch; c += 1) {
        str += String.fromCharCode(chunk[pos + c]!);
      }
    }
    pos += need;
    strings.push(str);
  }
  return strings;
}

/** Read a worksheet substream's cells into a row-major grid. */
function readSheetCells(
  recs: Record[],
  sst: ReadonlyArray<string | undefined>,
): Array<Map<number, string | number>> {
  const rows: Array<Map<number, string | number>> = [];
  const cell = (row: number, col: number, value: string | number) => {
    while (rows.length <= row) rows.push(new Map());
    rows[row]!.set(col, value);
  };
  for (const rec of recs) {
    const v = new DataView(rec.bytes.buffer, rec.bytes.byteOffset, rec.bytes.byteLength);
    switch (rec.id) {
      case REC_NUMBER: {
        if (rec.bytes.byteLength < 14) throw new Error('BIFF: short NUMBER record');
        const row = v.getUint16(0, true);
        const col = v.getUint16(2, true);
        cell(row, col, v.getFloat64(6, true));
        break;
      }
      case REC_RK: {
        if (rec.bytes.byteLength < 10) throw new Error('BIFF: short RK record');
        cell(v.getUint16(0, true), v.getUint16(2, true), decodeRk(v.getUint32(6, true)));
        break;
      }
      case REC_MULRK: {
        const n = (rec.bytes.byteLength - 6) / 6;
        if (n < 1) throw new Error('BIFF: short MULRK record');
        const row = v.getUint16(0, true);
        const firstCol = v.getUint16(2, true);
        for (let i = 0; i < n; i += 1) {
          cell(row, firstCol + i, decodeRk(v.getUint32(4 + i * 6 + 2, true)));
        }
        break;
      }
      case REC_LABEL: {
        if (rec.bytes.byteLength < 8) throw new Error('BIFF: short LABEL record');
        const row = v.getUint16(0, true);
        const col = v.getUint16(2, true);
        const cch = v.getUint16(6, true);
        let str = '';
        for (let c = 0; c < cch && 8 + c < rec.bytes.byteLength; c += 1) {
          str += String.fromCharCode(rec.bytes[8 + c]!);
        }
        cell(row, col, str);
        break;
      }
      case REC_LABELSST: {
        if (rec.bytes.byteLength < 10) throw new Error('BIFF: short LABELSST record');
        const row = v.getUint16(0, true);
        const col = v.getUint16(2, true);
        const idx = v.getUint32(6, true);
        const str = sst[idx];
        // An unresolved index (truncated SST) is SKIPPED, not guessed at —
        // the adapter's title assertions then fail loudly downstream.
        if (str !== undefined) cell(row, col, str);
        break;
      }
      default:
        break; // styles, dimensions, ROW blocks, … skipped by record size
    }
  }
  return rows;
}

/**
 * Parse an .xls buffer into its worksheets. Sheets are identified by
 * substream ORDER (globals first, then one substream per sheet — BOUNDSHEET
 * is deliberately not parsed); names fall back to positional labels, which
 * is all the EIA adapter needs (it identifies its sheet structurally).
 */
export function readXlsWorkbook(buf: ArrayBuffer): BiffWorkbook {
  const bytes = readWorkbookStream(buf);
  let sst: Array<string | undefined> = [];
  const sheets: BiffSheet[] = [];
  let pending: Record[] = [];
  // Substream state: 'none' → 'globals' (FIRST BOF only) → sheet substreams.
  let state: 'none' | 'globals' | 'sheet' = 'none';
  let sawGlobals = false;
  let sheetIdx = 0;
  let sawSst = false;
  let sstRecord: Uint8Array | undefined;
  let sstContinues: Uint8Array[] = [];

  const flushSst = () => {
    if (!sawSst || sstRecord === undefined) return;
    sst = parseSst(sstRecord, sstContinues);
    sawSst = false;
    sstRecord = undefined;
    sstContinues = [];
  };
  const flushSheet = () => {
    sheets.push({ name: `Sheet${sheetIdx + 1}`, rows: readSheetCells(pending, sst) });
    sheetIdx += 1;
    pending = [];
  };

  for (const rec of records(bytes)) {
    if (rec.id === REC_SST) {
      sawSst = true;
      sstRecord = rec.bytes;
      sstContinues = [];
      continue;
    }
    if (sawSst && rec.id === REC_CONTINUE) {
      sstContinues.push(rec.bytes);
      continue;
    }
    flushSst(); // the SST run ended; this record processes normally below
    if (rec.id === REC_BOF) {
      if (state === 'sheet') flushSheet(); // unterminated sheet (lenient close)
      if (sawGlobals) {
        state = 'sheet';
      } else {
        sawGlobals = true;
        state = 'globals';
      }
      continue;
    }
    if (rec.id === REC_EOF) {
      if (state === 'sheet') flushSheet();
      state = 'none';
      continue;
    }
    if (state === 'sheet') pending.push(rec);
  }
  if (state === 'sheet' && pending.length > 0) flushSheet(); // trailing substream
  if (sheets.length === 0) throw new Error('BIFF: no worksheet substreams found (layout change?)');
  return { sheets };
}

/** Excel 1900-system serial (datemode 0) → ISO date (YYYY-MM-DD). */
export function excelSerialToIso(serial: number): string {
  if (!Number.isFinite(serial) || serial < 61) {
    throw new Error(`BIFF: Excel serial ${serial} out of the supported range`);
  }
  const ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}
