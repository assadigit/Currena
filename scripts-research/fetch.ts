/**
 * Research helper (W4) — fetch a page and print readable text.
 * Not part of the app; run with: bun scripts-research/fetch.ts <url> [grep]
 */
import ZAI from "z-ai-web-dev-sdk";

const url = process.argv[2];
const filter = process.argv[3];

async function main() {
  const zai = await ZAI.create();
  const r = (await zai.functions.invoke("page_reader", { url })) as {
    data?: { html?: string; text?: string };
  };
  let html = r.data?.html ?? r.data?.text ?? "";
  // Strip to readable text
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");
  if (filter) {
    const lines = text.split("\n");
    const hits: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(filter.toLowerCase())) {
        hits.push(lines[i].trim().slice(0, 400));
      }
    }
    console.log(hits.slice(0, 40).join("\n---\n"));
  } else {
    console.log(text.slice(0, 12000));
  }
}

main().catch((e) => {
  console.error("FETCH-ERROR", String(e).slice(0, 300));
  process.exit(1);
});
