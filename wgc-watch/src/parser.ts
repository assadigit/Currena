/**
 * The production Highlights parser for the WGC monthly Gold Market
 * Commentary — the parsing contract of docs/wgc-monthly-commentary-spec.md
 * §4.4, implemented once and shared by everything that parses a page:
 * the currena-wgc-watch Worker's scheduled fire, the one-off backfill,
 * and the verification harness. Never copied.
 *
 * The contract (validated against every one of the 17 box issues and the
 * owner's pasted September snippet, byte-identically — the research
 * record is docs/evidence/wgc-census-2026-11-24.json):
 *
 * 1. Locate the box: the first heading element <h2|h3|h4> whose trimmed
 *    inner text, case-insensitive, is exactly "Highlights".
 * 2. Take the block: from just after that heading's closing tag to the
 *    first </div> — the enclosing .wrapper's close, verified to contain
 *    no nested <div> in every observed box. Defensive fallback, in case
 *    a nested <div> ever appears: re-cut at the earliest of the next
 *    <aside, the next <div class="paragraph", or the next <h2.
 * 3. Tokenize in document order:
 *    - <h3|h4>text</h3|h4> → a segment heading;
 *    - a <p> whose inner starts with <strong>X</strong>: when the
 *      remainder (after the strong, tags stripped) is non-empty → a
 *      segment with heading X and that remainder as body (the
 *      strong+<br> style); otherwise → a segment heading X awaiting
 *      its body (the strong-p style);
 *    - a plain <p> or an <li> → body text appended to the current
 *      segment (a leading one before any subhead opens a heading-less
 *      segment; a trailing note verbatim-appends to the last segment);
 *    - strip tags, collapse whitespace, &nbsp; → space.
 * 4. Record verbatim: headings are never normalized ("October in
 *    review" stays "October in review"); the variant actually seen is
 *    reported (block_variant).
 *
 * The five markup shapes this tokenizes (the 2026-11-24 census):
 *   h2 + <h3> subheads + <p> bodies        (e.g. 2025-04, 2026-10)
 *   h2 + <h3> subheads + <ul><li> bodies   (2025-03, 2025-07)
 *   h2 + <p><strong> heads + <p> bodies    (2026-02, 2026-04, 2026-07)
 *   h2 + <p><strong>…</strong><br> one-paragraph (2026-05 + trailing note)
 *   h3 box + <p><strong> heads + <p> bodies (2026-08, 2026-09)
 */

/** One Highlights segment, recorded verbatim. */
export interface WgcSegment {
  heading: string;
  body: string;
}

/** The parser's answer for one page. */
export interface ParseResult {
  /** Whether a Highlights box was located at all. */
  found: boolean;
  /** The box heading's level, "h2" | "h3" | "h4" ("" when not found). */
  headingLevel: string;
  /** The segments, in document order, verbatim. */
  segments: WgcSegment[];
  /** The observed variant, e.g. "h2+h3-subheads" ("" when not found). */
  variant: string;
  /** Why the box was not found, when found is false. */
  reason?: string;
}

/** The schema.org Report JSON-LD block the page carries. */
export interface ReportLd {
  datePublished?: string;
  description?: string;
  headline?: string;
}

/** Extract the Report JSON-LD block (the probe's exact logic). */
export function reportLd(html: string): ReportLd | null {
  const idx = html.indexOf('"@type":"Report"');
  if (idx < 0) return null;
  const s = html.lastIndexOf("<script", idx);
  const e = html.indexOf("</script>", idx);
  if (s < 0 || e < 0) return null;
  const raw = html.slice(s, e);
  const b = raw.indexOf("{");
  try {
    return JSON.parse(raw.slice(b)) as ReportLd;
  } catch {
    return null;
  }
}

/**
 * The Highlights box parser. Tokenizes the block in document order — it
 * does not template-match — so the five observed body styles all parse
 * through one code path. Byte-compatible with the research probe
 * (scripts/wgc-probe.ts parseHighlights) on every observed page.
 */
export function parseHighlights(html: string): ParseResult {
  const m = /<(h[234])[^>]*>\s*Highlights\s*<\/\1>/i.exec(html);
  if (!m) {
    return { found: false, headingLevel: "", segments: [], variant: "", reason: "no <h2|h3|h4> whose text is exactly “Highlights”" };
  }
  const headingLevel = m[1].toLowerCase();
  const after = m.index + m[0].length;

  // The block: from just after the heading to the enclosing .wrapper's
  // close (the first </div>) — with the spec's defensive fallback when a
  // nested <div> means that first </div> is not the wrapper's own.
  const close = html.indexOf("</div>", after);
  const end = close < 0 ? after + 6000 : close;
  let block = html.slice(after, end);
  if (/<div[\s>]/i.test(block)) {
    const markers = ["<aside", '<div class="paragraph', "<h2"]
      .map((s) => html.indexOf(s, after))
      .filter((i) => i >= 0);
    if (markers.length > 0) {
      block = html.slice(after, Math.min(...markers));
    }
  }

  type Tok = { i: number; kind: "h" | "strong" | "strong-br" | "p"; text: string; br?: string };
  const toks: Tok[] = [];
  let r: RegExpExecArray | null;

  // <h3|h4> subheads → segment headings
  const hh = /<h[34][^>]*>\s*(.*?)\s*<\/h[34]>/g;
  while ((r = hh.exec(block))) toks.push({ i: r.index, kind: "h", text: r[1].trim() });

  // <p>/<li> → strong+<br> bodies, strong-only headings, or plain body text
  const pp = /<p>([\s\S]*?)<\/p>|<li>([\s\S]*?)<\/li>/g;
  while ((r = pp.exec(block))) {
    const inner = (r[1] ?? r[2] ?? "").trim();
    const strongBr = /^<strong>\s*([\s\S]*?)\s*<\/strong>(?:\s*<br\s*\/?>)?\s*([\s\S]*)$/.exec(inner);
    const strongOnly = /^<strong>\s*([\s\S]*?)\s*<\/strong>$/.exec(inner);
    if (strongBr && strongBr[2].replace(/<[^>]+>/g, "").trim()) {
      toks.push({
        i: r.index,
        kind: "strong-br",
        text: strongBr[1].trim(),
        br: strongBr[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim(),
      });
    } else if (strongOnly) {
      toks.push({ i: r.index, kind: "strong", text: strongOnly[1].trim() });
    } else {
      toks.push({ i: r.index, kind: "p", text: inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim() });
    }
  }

  toks.sort((a, b) => a.i - b.i);

  const segments: WgcSegment[] = [];
  for (const t of toks) {
    if (t.kind === "h" || t.kind === "strong") segments.push({ heading: t.text, body: "" });
    else if (t.kind === "strong-br") segments.push({ heading: t.text, body: t.br ?? "" });
    else if (segments.length) {
      const cur = segments[segments.length - 1]!;
      cur.body += (cur.body ? " " : "") + t.text;
    } else {
      segments.push({ heading: "", body: t.text }); // a leading plain paragraph
    }
  }

  const style = toks.some((t) => t.kind === "strong-br")
    ? "strong-br-p"
    : toks.some((t) => t.kind === "strong")
      ? "strong-p"
      : toks.some((t) => t.kind === "h")
        ? "h3-subheads"
        : "no-subheads";
  return { found: true, headingLevel, segments, variant: `${headingLevel}+${style}` };
}

/* ------------------------------------------------------------------ *
 * The storage gates (spec §4.5)
 * ------------------------------------------------------------------ */

export interface GatesResult {
  pass: boolean;
  reason: string | null;
}

/**
 * Store nothing that fails the gates: at least one segment; every
 * heading non-empty; every body at least 40 characters (observed bodies
 * run 60–200); and a JSON-LD datePublished present on the page. A 200
 * that fails these is a structure alarm, never a partial store.
 */
export function storageGates(parsed: ParseResult, ld: ReportLd | null): GatesResult {
  if (!parsed.found) return { pass: false, reason: `no Highlights box: ${parsed.reason ?? "not found"}` };
  if (parsed.segments.length < 1) return { pass: false, reason: "the Highlights box parsed to zero segments" };
  for (let i = 0; i < parsed.segments.length; i++) {
    const s = parsed.segments[i]!;
    if (!s.heading.trim()) return { pass: false, reason: `segment ${i + 1} has an empty heading` };
    const bodyLen = s.body.trim().length;
    if (bodyLen < 40) return { pass: false, reason: `segment ${i + 1}'s body is ${bodyLen} characters, under the 40-character gate` };
  }
  if (!ld?.datePublished) return { pass: false, reason: "no JSON-LD datePublished on the page" };
  return { pass: true, reason: null };
}

/* ------------------------------------------------------------------ *
 * The content hash
 * ------------------------------------------------------------------ */

/** The canonical serialization the hash is taken over — one definition. */
export function canonicalSegmentsJson(segments: WgcSegment[]): string {
  return JSON.stringify(segments);
}

/** sha256 hex of the canonicalized segments JSON (WebCrypto — workerd and Bun both carry it). */
export async function contentHash(segments: WgcSegment[]): Promise<string> {
  const data = new TextEncoder().encode(canonicalSegmentsJson(segments));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
