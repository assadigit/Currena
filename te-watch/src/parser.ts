/**
 * The production News Stream parser for the Trading Economics daily gold
 * briefing — the parsing contract of docs/te-daily-briefing-spec.md §4.4,
 * implemented once and shared by everything that parses the page: the
 * currena-te-watch Worker's scheduled fire, the one-off seed
 * (scripts/te-seed.ts) and the verification harness (tests/te-harness.ts).
 * Never copied.
 *
 * The contract (validated against the 2026-11-24 census,
 * docs/evidence/te-gold-census-2026-11-24.json, and re-probed live before
 * this implementation — no drift):
 *
 * 1. Locate the stream: the <div class="card-header"> whose trimmed text
 *    equals "News Stream"; take the following sibling region up to the
 *    next card-header (the enclosing card's close is the defensive
 *    fallback: a bounded 60 KB cut, the WGC parser's own fallback ladder).
 * 2. Tokenize the region in document order:
 *    <div class="list-group-item indc_news_stream te-stream-repeater">
 *    blocks; within each: the <b><a href='/commodity/gold/news/{id}'> →
 *    the item's id + title; the <div class="comment more"> → the body
 *    (tags stripped, whitespace collapsed, entities decoded).
 * 3. Record verbatim: the title and the body are stored exactly as served
 *    — no normalization, no re-capitalisation; datePublished verbatim from
 *    the detail page's Article JSON-LD.
 *
 * The observed markup (the census, byte-recorded; refined by the
 * 2026-11-24 16:25 UTC addendum — the flash-item discovery): the stream
 * exposes the latest three slots, a MIX of briefing items (observed
 * 910–948 chars) and SHORT FLASH ITEMS (price-change notes, 37 chars
 * observed) that rotate in on volatile days; the capture scope is the
 * briefing-qualified items only (body ≥ 200 chars — the owner's §11 Q1
 * answer defines the scope, BRIEFING_BODY_FLOOR implements it). The
 * top briefing-qualified item's body is byte-identical to the page's
 * own <h2 id="description"> (the Gold - Summary card's body — 939
 * chars on census day, no truncation despite the "more" class name;
 * the flash at the raw top slot does not move the h2, verified live).
 * The detail page /commodity/gold/news/{id} carries the authoritative
 * Article JSON-LD (headline, datePublished, dateModified, author) and
 * the article's own full body in its <meta name="description"> —
 * rotation-proof (see detailBody).
 *
 * Zero dependencies, like the whole worker: entity decoding, hashing and
 * JSON-LD extraction are all local.
 */

/** One news-stream item, recorded verbatim. */
export interface TeStreamItem {
  news_id: string;
  title: string;
  body: string;
}

/** The parser's answer for one commodity page. */
export interface TeStreamParse {
  /** Whether a News Stream card was located at all. */
  found: boolean;
  /** The items, in document order (newest first, as served). */
  items: TeStreamItem[];
  /** Why the stream was not found, when found is false. */
  reason?: string;
}

/** The Article JSON-LD block the detail page carries (the authoritative fields). */
export interface TeArticleLd {
  headline?: string;
  datePublished?: string;
  dateModified?: string;
  url?: string;
  author?: string | null;
}

/* ------------------------------------------------------------------ *
 * Text extraction (tags stripped, entities decoded, whitespace collapsed)
 * ------------------------------------------------------------------ */

/** The common named entities TE's markup actually uses (numeric always works). */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  laquo: "«",
  raquo: "»",
  deg: "°",
  middot: "·",
  bull: "•",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  plusmn: "±",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  times: "×",
  divide: "÷",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body: string) => {
    try {
      if (body.startsWith("#x") || body.startsWith("#X")) {
        const cp = Number.parseInt(body.slice(2), 16);
        if (Number.isInteger(cp) && cp >= 0 && cp <= 0x10ffff) return String.fromCodePoint(cp);
      } else if (body.startsWith("#")) {
        const cp = Number.parseInt(body.slice(1), 10);
        if (Number.isInteger(cp) && cp >= 0 && cp <= 0x10ffff) return String.fromCodePoint(cp);
      } else {
        const named = NAMED_ENTITIES[body.toLowerCase()];
        if (named !== undefined) return named;
      }
    } catch {
      /* an undecodable entity stays verbatim — never a throw */
    }
    return whole;
  });
}

/** Strip tags → decode entities → collapse whitespace → trim (the census probe's exact order). */
export function textOf(html: string): string {
  const stripped = html.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(stripped);
  return decoded.replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------------ *
 * The News Stream parser
 * ------------------------------------------------------------------ */

/** The item block's opening marker (the census's own class chain, verbatim). */
const ITEM_OPEN = '<div class="list-group-item indc_news_stream te-stream-repeater">';

/** The stream region's size bound when no following card-header exists (the defensive exit). */
const REGION_FALLBACK_BYTES = 60_000;

/**
 * Parse the commodity page's News Stream. Tokenizes the region in document
 * order — it does not template-match — so the block's internal layout
 * (whitespace between <b> and <a>, the trailing <small> date) is free to
 * vary. Items whose block lacks the news link or the comment body are
 * skipped (a defensive silence, never a partial item).
 */
export function parseNewsStream(html: string): TeStreamParse {
  const header = /<div class="card-header"[^>]*>\s*News Stream\s*<\/div>/i.exec(html);
  if (!header) {
    return { found: false, items: [], reason: "no <div class=\"card-header\"> whose text is exactly “News Stream”" };
  }
  const after = header.index + header[0].length;
  const nextHeader = html.indexOf('<div class="card-header"', after);
  const region = html.slice(after, nextHeader > 0 ? nextHeader : after + REGION_FALLBACK_BYTES);

  // The item starts, in document order.
  const starts: number[] = [];
  let at = region.indexOf(ITEM_OPEN);
  while (at >= 0) {
    starts.push(at);
    at = region.indexOf(ITEM_OPEN, at + ITEM_OPEN.length);
  }
  if (starts.length === 0) {
    return { found: true, items: [], reason: "the News Stream card was located but zero list-group items parsed" };
  }

  const items: TeStreamItem[] = [];
  for (let i = 0; i < starts.length; i++) {
    const block = region.slice(starts[i]!, i + 1 < starts.length ? starts[i + 1]! : region.length);

    // The <b><a href='/commodity/gold/news/{id}'>title</a></b> — the id and the title.
    const link = /<b>\s*<a\s+href=["']\/commodity\/gold\/news\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(block);
    // The <div class="comment more">body</div> — the full briefing body.
    const comment = /<div class="comment more">([\s\S]*?)<\/div>/i.exec(block);
    if (!link || !comment) continue; // a defensive skip — never a partial item

    const news_id = link[1]!;
    const title = textOf(link[2]!);
    const body = textOf(comment[1]!);
    if (!news_id || !title || !body) continue;

    items.push({ news_id, title, body });
  }

  return { found: true, items };
}

/** The page's own summary paragraph — <h2 id="description">, when present. */
export function h2Description(html: string): string | null {
  const m = /<h2 id="description"[^>]*>([\s\S]*?)<\/h2>/i.exec(html);
  return m ? textOf(m[1]!) : null;
}

/* ------------------------------------------------------------------ *
 * The detail page's Article JSON-LD
 * ------------------------------------------------------------------ */

/**
 * Extract the Article JSON-LD from a detail page: the authoritative
 * headline, datePublished, dateModified, url and author. The author field
 * may be a string or a {name} object — the person's name is what the row
 * stores (verbatim), null when absent.
 */
export function articleLd(html: string): TeArticleLd | null {
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(m[1]!.trim());
    } catch {
      continue; // a non-JSON block (a malformed one) is skipped, never fatal
    }
    const obj = parsed as { "@type"?: unknown; headline?: unknown; datePublished?: unknown; dateModified?: unknown; url?: unknown; author?: unknown };
    const type = obj["@type"];
    const isArticle = type === "Article" || type === "NewsArticle" || (Array.isArray(type) && (type as unknown[]).includes("Article"));
    if (!isArticle) continue;

    let author: string | null = null;
    if (typeof obj.author === "string") author = obj.author;
    else if (typeof obj.author === "object" && obj.author !== null) {
      const name = (obj.author as { name?: unknown }).name;
      if (typeof name === "string" && name.trim() !== "") author = name;
    }
    return {
      headline: typeof obj.headline === "string" ? obj.headline : undefined,
      datePublished: typeof obj.datePublished === "string" ? obj.datePublished : undefined,
      dateModified: typeof obj.dateModified === "string" ? obj.dateModified : undefined,
      url: typeof obj.url === "string" ? obj.url : undefined,
      author,
    };
  }
  return null;
}

/**
 * The detail page's own copy of the article body: its
 * `<meta name="description">` content — full, verbatim, and
 * ROTATION-PROOF (the addendum's own finding, verified live both ways:
 * byte-identical to the commodity page's stream copy for the in-window
 * item 603757 — 939 chars, true — and matching the census fingerprint
 * for the rotated-out 603349 — 948 chars, first and last both true).
 * The detail page's own News Stream is the GLOBAL current stream (flash
 * items included) and does NOT reliably contain the article's own body
 * once the item rotates out of the commodity page's 3-slot window, so
 * the meta description is the only stable source. Attribute order is
 * free (TE writes `id="metaDesc"` before `name`); entities are decoded
 * — the same textOf pipeline the stream body goes through.
 */
export function detailBody(html: string): string | null {
  const m = /<meta\s+(?=[^>]*name=["']description["'])(?=[^>]*content=["']([\s\S]*?)["'])[^>]*>/i.exec(html);
  return m ? textOf(m[1]!) : null;
}

/* ------------------------------------------------------------------ *
 * The briefing-qualification floor (the 2026-11-24 16:25 UTC addendum)
 * ------------------------------------------------------------------ */

/**
 * The minimum body length a stream item must carry to be a BRIEFING
 * (observed 910–948 chars; the 200-char floor is the discovery's own
 * boundary). The News Stream carries SHORT FLASH ITEMS beside the
 * briefings — price-change notes like "Gold decreased 2% to 3562.37
 * USD/t.oz" (37 chars) that rotate in on volatile days. A flash is not
 * a briefing (the owner's §11 Q1 answer: "just the box of briefing +
 * title"): it is skipped — never stored, never fetched, never an alarm.
 */
export const BRIEFING_BODY_FLOOR = 200;

/** The briefing-qualified subset of a parsed stream, in document order. */
export function briefingItemsOf(items: TeStreamItem[]): TeStreamItem[] {
  return items.filter((it) => it.body.length >= BRIEFING_BODY_FLOOR);
}

/* ------------------------------------------------------------------ *
 * The gates (spec §4.5, refined by the flash-item discovery)
 * ------------------------------------------------------------------ */

export interface GatesResult {
  pass: boolean;
  reason: string | null;
}

/**
 * The page-level gates, three reactions (the addendum's own list):
 *
 * 1. A page whose stream has zero briefing-qualified items AND no (or
 *    short) h2#description → structure alarm (the login/interstitial
 *    negative's semantics, preserved — a walled page truncates every
 *    body and carries no real summary).
 * 2. A page whose stream has zero briefing-qualified items but a REAL
 *    h2#description (≥ the floor) → PASS, the quiet fire: the stream
 *    window rotated past the briefing (all three slots flash items);
 *    the page's own summary is real and unchanged.
 * 3. Briefings present + h2 present-but-different from the TOP
 *    briefing-qualified item's body → structure alarm (template drift
 *    — the h2 tracks the top briefing, not the raw top slot, verified
 *    live: the flash at the top did not move the h2).
 */
export function pageGates(parsed: TeStreamParse, h2: string | null): GatesResult {
  if (!parsed.found) return { pass: false, reason: `no News Stream card: ${parsed.reason ?? "not found"}` };
  if (parsed.items.length < 1) return { pass: false, reason: `zero stream items parsed: ${parsed.reason ?? "the region tokenized to nothing"}` };
  const briefings = briefingItemsOf(parsed.items);
  if (briefings.length === 0) {
    if (h2 !== null && h2.length >= BRIEFING_BODY_FLOOR) {
      // Reaction 2 — the window rotated past the briefing; the page's own
      // summary is real. The fire iterates zero briefings and exits quiet.
      return { pass: true, reason: null };
    }
    const longest = Math.max(...parsed.items.map((i) => i.body.length));
    return {
      pass: false,
      reason: `the stream has zero briefing-qualified items (the longest body is ${longest} characters, under the 200-character gate) and no real page summary — a login/interstitial page is not a briefing`,
    };
  }
  const top = briefings[0]!;
  if (!top.title.trim()) return { pass: false, reason: "the top briefing's title is empty" };
  if (h2 !== null && h2 !== "" && h2 !== top.body) {
    return { pass: false, reason: "the h2#description cross-check failed: the page's summary paragraph differs from the top briefing-qualified item's body (template drift)" };
  }
  return { pass: true, reason: null };
}

/**
 * The item-level gates, over the detail page's answer: the JSON-LD
 * headline must equal the stream title verbatim (the authoritative
 * cross-check); a datePublished must be present; and the detail page's own
 * copy of the body must be byte-identical to the commodity page's.
 */
export function itemGates(item: TeStreamItem, ld: TeArticleLd | null, detail: string | null): GatesResult {
  if (!ld) return { pass: false, reason: `item ${item.news_id}: the detail page carries no Article JSON-LD` };
  if (!ld.datePublished) return { pass: false, reason: `item ${item.news_id}: no JSON-LD datePublished on the detail page` };
  if (ld.headline !== item.title) {
    return { pass: false, reason: `item ${item.news_id}: the detail JSON-LD headline differs from the stream title (verbatim identity failed)` };
  }
  if (detail !== null && detail !== item.body) {
    return { pass: false, reason: `item ${item.news_id}: the detail page's body copy differs from the commodity page's (byte-identity failed)` };
  }
  return { pass: true, reason: null };
}

/* ------------------------------------------------------------------ *
 * The content hash + the challenge signature
 * ------------------------------------------------------------------ */

/** The canonical serialization the hash is taken over — one definition. */
export function canonicalBriefingJson(title: string, body: string): string {
  return JSON.stringify({ title, body });
}

/** sha256 hex of the canonicalized title + body (WebCrypto — workerd and Bun both carry it). */
export async function contentHash(title: string, body: string): Promise<string> {
  const data = new TextEncoder().encode(canonicalBriefingJson(title, body));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** sha256 of the canonical serialization of nothing (the structure-alert marker's hash). */
export async function emptyContentHash(): Promise<string> {
  return contentHash("", "");
}

/**
 * The bot-challenge signature — the spec's own rule (§4.5): a challenge/
 * interstitial page is a fetch-failed, NEVER a structure alarm. The real
 * commodity page carries none of these strings (verified live 2026-11-24:
 * "Just a moment" count 0 — the page's cdn-cgi script names do contain the
 * word "challenge" but none of these exact interstitial markers).
 */
export function isChallengePage(html: string): boolean {
  return (
    /<title[^>]*>\s*Just a moment/i.test(html) ||
    html.includes("challenge-error-text") ||
    html.includes("Enable JavaScript and cookies to continue") ||
    /<title[^>]*>\s*Attention Required/i.test(html)
  );
}
