// WGC monthly Gold Market Commentary — the research probe.
//
// Run: `bun scripts/wgc-probe.ts [out.json]`
//
// Fetches the canonical URL of every Gold Market Commentary issue in the
// RANGE below (plus the June/November skip months and the not-yet-published
// months as negative controls), then records, per issue:
//   * HTTP status and any redirect target (June 2026 redirects to July),
//   * the Report JSON-LD datePublished / description / headline,
//   * the Highlights box (located tolerantly across the three observed
//     markup variants: h2+h3 subheads, h3+strong-p, and strong+<br> in one
//     paragraph), parsed into {heading, body} segments.
//
// The recorded findings that shaped the spec (2026-11-24 run, 2023-01 →
// 2026-10): June and November have no issue every year; genuine issues
// publish 4–12 days after the reviewed month's end (median 7, always at
// 08:00 London); the Highlights box exists only since 2025-03 and sits
// outside the paywall; every box observed has two segments.
//
// The output JSON is the spec's evidence file
// (docs/evidence/wgc-census-2026-11-24.json).

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const FROM_YEAR = 2023;
const THROUGH = { y: 2026, m: 10 }; // inclusive; months beyond are probed as controls
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface Row {
  monthKey: string; slug: string; status: number; redirectedTo?: string;
  publishedAt?: string; delayDays?: number; variant: string;
  segments: { heading: string; body: string }[];
  ldDescription?: string; ldMatch: boolean;
}

function reportLd(html: string) {
  const idx = html.indexOf('"@type":"Report"');
  if (idx < 0) return null;
  const s = html.lastIndexOf("<script", idx);
  const e = html.indexOf("</script>", idx);
  if (s < 0 || e < 0) return null;
  const raw = html.slice(s, e);
  const b = raw.indexOf("{");
  try {
    return JSON.parse(raw.slice(b)) as { datePublished?: string; description?: string; headline?: string };
  } catch { return null; }
}

// The tolerant Highlights parser — the parsing contract the spec proposes.
function parseHighlights(html: string) {
  const m = /<(h[234])[^>]*>\s*Highlights\s*<\/\1>/i.exec(html);
  if (!m) return null;
  const headingLevel = m[1].toLowerCase();
  const after = m.index + m[0].length;
  const close = html.indexOf("</div>", after);
  const block = html.slice(after, close < 0 ? after + 6000 : close);
  type Tok = { i: number; kind: "h" | "strong" | "strong-br" | "p"; text: string; br?: string };
  const toks: Tok[] = [];
  let r: RegExpExecArray | null;
  const hh = /<h[34][^>]*>\s*(.*?)\s*<\/h[34]>/g;
  while ((r = hh.exec(block))) toks.push({ i: r.index, kind: "h", text: r[1].trim() });
  const pp = /<p>([\s\S]*?)<\/p>|<li>([\s\S]*?)<\/li>/g;
  while ((r = pp.exec(block))) {
    const inner = (r[1] ?? r[2] ?? "").trim();
    const strongBr = /^<strong>\s*([\s\S]*?)\s*<\/strong>(?:\s*<br\s*\/?>)?\s*([\s\S]*)$/.exec(inner);
    const strongOnly = /^<strong>\s*([\s\S]*?)\s*<\/strong>$/.exec(inner);
    if (strongBr && strongBr[2].replace(/<[^>]+>/g, "").trim()) {
      toks.push({ i: r.index, kind: "strong-br", text: strongBr[1].trim(), br: strongBr[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim() });
    } else if (strongOnly) {
      toks.push({ i: r.index, kind: "strong", text: strongOnly[1].trim() });
    } else {
      toks.push({ i: r.index, kind: "p", text: inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim() });
    }
  }
  toks.sort((a, b) => a.i - b.i);
  const segments: { heading: string; body: string }[] = [];
  for (const t of toks) {
    if (t.kind === "h" || t.kind === "strong") segments.push({ heading: t.text, body: "" });
    else if (t.kind === "strong-br") segments.push({ heading: t.text, body: t.br ?? "" });
    else if (segments.length) {
      const cur = segments[segments.length - 1];
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
  return { headingLevel, segments, variant: `${headingLevel}+${style}` };
}

function endOfMonth(y: number, m: number) { return new Date(Date.UTC(y, m, 0)); }

async function one(y: number, m: number): Promise<Row> {
  const slug = `${MONTH_NAMES[m - 1]}-${y}`;
  const url = `https://www.gold.org/goldhub/research/gold-market-commentary-${slug}`;
  const row: Row = { monthKey: `${y}-${String(m).padStart(2, "0")}`, slug, status: 0, variant: "none", segments: [], ldMatch: false };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-GB,en;q=0.9" },
      redirect: "follow", signal: AbortSignal.timeout(25_000),
    });
    row.status = res.status;
    if (res.url !== url) row.redirectedTo = res.url.split("/").pop();
    if (res.status !== 200) return row;
    const html = await res.text();
    const ld = reportLd(html);
    if (ld?.datePublished) {
      row.publishedAt = ld.datePublished;
      row.ldDescription = ld.description;
      const d = new Date(ld.datePublished.slice(0, 10) + "T00:00:00Z");
      row.delayDays = Math.round((d.getTime() - endOfMonth(y, m).getTime()) / 86_400_000);
    }
    const hl = parseHighlights(html);
    if (hl) {
      row.variant = hl.variant;
      row.segments = hl.segments;
      if (row.ldDescription && row.segments.length) {
        const firstBody = row.segments[0].body.split(/[.!?]/)[0].slice(0, 40).toLowerCase();
        row.ldMatch = row.ldDescription.toLowerCase().includes(firstBody.slice(0, 30));
      }
    }
  } catch (e) { row.variant = "error:" + String(e).slice(0, 40); }
  return row;
}

const rows: Row[] = [];
const queue: { y: number; m: number }[] = [];
for (let y = FROM_YEAR; y <= THROUGH.y; y++) {
  for (let m = 1; m <= 12; m++) {
    if (y === THROUGH.y && m > THROUGH.m + 2) continue; // two future controls max
    queue.push({ y, m });
  }
}
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) { const t = queue.shift()!; rows.push(await one(t.y, t.m)); }
}));
rows.sort((a, b) => a.monthKey.localeCompare(b.monthKey));

for (const r of rows) {
  console.log([r.monthKey, r.status, r.variant, r.segments.length, r.publishedAt ?? "-", r.delayDays ?? "-", r.ldMatch, r.redirectedTo ?? "-"].join("\t"));
}
const out = process.argv[2];
if (out) await Bun.write(out, JSON.stringify(rows, null, 2));
