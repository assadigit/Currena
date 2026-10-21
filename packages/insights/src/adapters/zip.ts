/**
 * Minimal ZIP reader for text entries (2026-10-21 data-integrity round) —
 * the FRED multi-series fredgraph.csv answers arrive as a ZIP whenever the
 * requested series span different frequency labels (one CSV per frequency:
 * `daily.csv`, `weekly,_ending_friday.csv`, `daily,_close.csv`, …). The
 * answer is always RIGHT — just packaged.
 *
 * Platform-free per AGENTS.md rule 2 (web-standard APIs only): the same
 * inflate/TextDecoder machinery as xlsx.ts. Only STORED and DEFLATE-RAW
 * entries are supported — the only methods FRED's server emits.
 */

/** One central-directory entry. */
interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

const EOCD_SIG = 0x06054b50;
const CDH_SIG = 0x02014b50;
const LFH_SIG = 0x04034b50;

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

function readCentralDirectory(zip: Uint8Array<ArrayBuffer>): ZipEntry[] {
  // Scan for the EOCD from the tail (the comment field can be up to 64k).
  const minEocd = 22;
  if (zip.length < minEocd) throw new Error('zip: too small to hold an EOCD');
  let eocd = -1;
  const scanStart = Math.max(0, zip.length - 66_000);
  for (let i = zip.length - minEocd; i >= scanStart; i--) {
    if (u32(zip, i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('zip: end-of-central-directory signature not found');
  const count = u16(zip, eocd + 10);
  let offset = u32(zip, eocd + 16);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (u32(zip, offset) !== CDH_SIG) throw new Error(`zip: central directory entry ${i} signature mismatch`);
    const method = u16(zip, offset + 10);
    const compressedSize = u32(zip, offset + 20);
    const uncompressedSize = u32(zip, offset + 24);
    const nameLen = u16(zip, offset + 28);
    const extraLen = u16(zip, offset + 30);
    const commentLen = u16(zip, offset + 32);
    const localHeaderOffset = u32(zip, offset + 42);
    const name = new TextDecoder().decode(zip.subarray(offset + 46, offset + 46 + nameLen));
    entries.push({ name, compressionMethod: method, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function readEntry(zip: Uint8Array<ArrayBuffer>, entry: ZipEntry): Promise<Uint8Array<ArrayBuffer>> {
  const off = entry.localHeaderOffset;
  if (u32(zip, off) !== LFH_SIG) throw new Error(`zip: local header signature mismatch for "${entry.name}"`);
  const nameLen = u16(zip, off + 26);
  const extraLen = u16(zip, off + 28);
  const dataStart = off + 30 + nameLen + extraLen;
  const data = zip.subarray(dataStart, dataStart + entry.compressedSize);
  if (entry.compressionMethod === 0) {
    const copy = new Uint8Array(data);
    return copy;
  }
  if (entry.compressionMethod === 8) return await inflateRaw(data);
  throw new Error(`zip: entry "${entry.name}" uses unsupported compression method ${entry.compressionMethod}`);
}

/** True when a payload starts with the ZIP magic ("PK\x03\x04"). */
export function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && u32(bytes, 0) === 0x04034b50;
}

/**
 * Read every entry as UTF-8 text, keyed by entry name. Throws loudly on a
 * malformed archive (rule 3) — never a partial guess.
 */
export async function readZipTextEntries(bytes: Uint8Array<ArrayBuffer>): Promise<Map<string, string>> {
  const entries = readCentralDirectory(bytes);
  const out = new Map<string, string>();
  for (const entry of entries) {
    const raw = await readEntry(bytes, entry);
    out.set(entry.name, new TextDecoder().decode(raw));
  }
  return out;
}
