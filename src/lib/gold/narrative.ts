/**
 * Strategist-model narrative writer (S8 briefing layer).
 *
 * Server-side only — uses z-ai-web-dev-sdk to have a senior-gold-strategist
 * persona write the six briefing sections from the engine's factual digest.
 * Falls back to the deterministic template whenever the model call fails,
 * times out, or returns invalid JSON, so the desk always has a narrative.
 *
 * The SDK is loaded dynamically inside the model call (inside the existing
 * retry/fallback guard) because it is a sandbox-internal service: it reads
 * its endpoint from a local config file (`fs`), which does not exist on the
 * Cloudflare Worker. There the import or the model call throws, the guard
 * catches it, and the desk honestly serves the template narrative — exactly
 * the designed fail-closed path; `narrativeSource` records which one served.
 */

import { z } from "zod";
import type { BriefingPayload, EngineFacts } from "./types";

const llmSectionSchema = z.object({
  id: z.enum(["exec", "macro", "price-action", "positioning", "news", "outlook"]),
  title: z.string().min(8).max(140),
  body: z.string().min(60).max(900),
  bullets: z.array(z.string().min(6).max(220)).min(2).max(5),
});

const llmResponseSchema = z.object({
  sections: z.array(llmSectionSchema).min(6).max(6),
});

const SYSTEM_PROMPT = [
  "You are a senior gold-market strategist writing the daily internal desk briefing for a bullion trading team.",
  "Tone: institutional, precise, concise. Short declarative sentences. No hype, no emojis, no markdown formatting.",
  "Use ONLY the numbers provided in the facts digest. Never invent data, prices or events. If a number is not provided, describe it qualitatively.",
  "Never give investment advice or tell the reader what to do; describe conditions, risks and paths.",
  "Respond with valid JSON only — no prose outside the JSON, no code fences.",
  "JSON shape: {\"sections\":[{\"id\":\"exec|macro|price-action|positioning|news|outlook\",\"title\":\"insight-first headline stating a conclusion\",\"body\":\"2-3 sentences with concrete numbers\",\"bullets\":[\"3-4 short factual bullets\"]}]}",
  "Every one of the six section ids must appear exactly once. Titles must state conclusions, not field names.",
].join(" ");

function digestFacts(facts: EngineFacts, briefing: BriefingPayload): string {
  const n = facts.dates.length;
  const dxy = facts.dxy[n - 1];
  const dxyChg = ((facts.dxy[n - 1] / facts.dxy[n - 2] - 1) * 100).toFixed(2);
  const ry = facts.realYield[n - 1].toFixed(2);
  const ryChg = (facts.realYield[n - 1] - facts.realYield[n - 2]).toFixed(2);
  const spxChg = ((facts.spx[n - 1] / facts.spx[n - 2] - 1) * 100).toFixed(2);

  return JSON.stringify(
    {
      date: facts.date,
      spot: Math.round(facts.spot * 100) / 100,
      change_pct_today: Math.round(facts.changePct * 100) / 100,
      returns: {
        "5d_pct": Math.round(facts.ret5d * 100) / 100,
        "1m_pct": Math.round(facts.ret1m * 100) / 100,
        "3m_pct": Math.round(facts.ret3m * 100) / 100,
        ytd_pct: Math.round(facts.retYtd * 100) / 100,
      },
      technicals: {
        ma20: Math.round(facts.ma20),
        ma50: Math.round(facts.ma50),
        rsi14: Math.round(facts.rsi14),
        high_52w: Math.round(facts.high52),
        distance_from_high_pct: Math.round(facts.distFromHigh * 100) / 100,
        support: facts.support,
        resistance: facts.resistance,
      },
      macro: {
        dxy_level: Math.round(dxy * 10) / 10,
        dxy_change_pct: dxyChg,
        real_10y_yield_pct: ry,
        real_10y_change_pp: ryChg,
        spx_change_pct: spxChg,
      },
      volatility: {
        realised_vol_20d_annualised_pct: Math.round(facts.vol20 * 10) / 10,
        percentile_of_year: facts.volPercentile,
        regime: facts.volRegime,
      },
      drivers_today_bps: facts.drivers.map((d) => ({
        driver: d.driver,
        bps: d.bps,
        note: d.note,
      })),
      correlations_120d: {
        gold_vs_dxy: facts.correlations.matrix[0][1],
        gold_vs_real10y: facts.correlations.matrix[0][2],
        gold_vs_silver: facts.correlations.matrix[0][4],
        gold_vs_specs: facts.correlations.matrix[0][6],
      },
      positioning: {
        net_specs_k_contracts: Math.round(facts.netSpecs[n - 1]),
        percentile_of_year: facts.netSpecsPercentile,
        etf_flow_4w_tonnes: Math.round(facts.etfFlow4w * 10) / 10,
        latest_week_flow_tonnes: facts.etfFlowWeekly[facts.etfFlowWeekly.length - 1],
      },
      news_tape: facts.news.map((x) => ({
        time: x.time,
        source: x.source,
        headline: x.headline,
        sentiment: x.sentiment,
        impact: x.impact,
      })),
      news_sentiment_today: facts.sentimentToday,
      scenarios: facts.scenarios.map((s) => ({
        id: s.id,
        probability_pct: s.probability,
        target: s.target,
        trigger: s.trigger,
        horizon: s.horizon,
      })),
      bias_score: facts.bias,
      seasonality: {
        current_month: facts.seasonality.months[facts.seasonality.currentMonth],
        note: briefing.sections.find((s) => s.id === "outlook")?.body.slice(0, 0),
      },
    },
    null,
    1
  );
}

function extractJson(raw: string): unknown {
  let text = raw.trim();
  // Strip markdown code fences if the model added them.
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  // Grab the outermost JSON object if anything else slipped through.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || start >= end) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function callModel(
  digest: string
): Promise<z.infer<typeof llmResponseSchema>> {
  const { default: ZAI } = await import("z-ai-web-dev-sdk");
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Write today's six-section desk briefing from this facts digest:\n\n${digest}`,
      },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw || raw.trim().length === 0) {
    throw new Error("Empty model response");
  }
  return llmResponseSchema.parse(extractJson(raw));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Model call timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface StrategistNarrativeResult {
  briefing: BriefingPayload;
  source: "llm" | "template";
}

/**
 * Rewrite the template briefing's narrative sections with the strategist
 * model. Kicker, bias and visual bindings are structural and stay put;
 * titles, bodies and bullets are model-written. Returns the template
 * briefing unchanged on any failure.
 */
export async function writeStrategistNarrative(
  facts: EngineFacts,
  template: BriefingPayload
): Promise<StrategistNarrativeResult> {
  const digest = digestFacts(facts, template);

  let parsed: z.infer<typeof llmResponseSchema> | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      parsed = await withTimeout(callModel(digest), 30_000);
      break;
    } catch (e) {
      lastError = e;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  if (!parsed) {
    console.warn(
      "[desk] strategist narrative fell back to template:",
      lastError instanceof Error ? lastError.message : lastError
    );
    return { briefing: template, source: "template" };
  }

  const byId = new Map(parsed.sections.map((s) => [s.id, s]));
  const briefing: BriefingPayload = {
    ...template,
    narrativeSource: "llm",
    sections: template.sections.map((section) => {
      const model = byId.get(section.id);
      if (!model) return section;
      return {
        ...section,
        title: model.title,
        body: model.body,
        bullets: model.bullets,
      };
    }),
  };
  return { briefing, source: "llm" };
}
