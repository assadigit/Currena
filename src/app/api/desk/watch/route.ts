import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildWatch } from "@/lib/gold/watch";
import type {
  WatchCalibrationMetric,
  WatchDirection,
  WatchRuleKind,
} from "@/lib/gold/types";

/**
 * /api/desk/watch — the S13 Watch layer endpoint.
 *
 * GET    ?date=YYYY-MM-DD   Evaluate every rule against the persisted
 *                           record (read-only; no network, no rebuilds —
 *                           re-checked on every desk load).
 * POST   { kind, label, level, direction }   Create a rule.
 * PATCH  { id, ...fields }  Update a rule (label, level, direction,
 *                           active). Unknown ids 404.
 * DELETE ?id=               Remove a rule.
 *
 * Rule CRUD is API-route-reachable; the page surfaces outcomes as
 * toasts. Validation mirrors the engine's own validateRule so a rule
 * can never be persisted in a state the engine refuses to evaluate.
 * The once-per-day EODHD sync stays the only network surface — this
 * route never calls out.
 */

export const dynamic = "force-dynamic";

function isValidIsoDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
  );
}

const KINDS: WatchRuleKind[] = [
  "price-level",
  "bias-flip",
  "scenario-band",
  "calibration",
];

/** Which direction selectors are legal per rule kind (mirrors watch.ts). */
const DIRECTIONS_BY_KIND: Record<WatchRuleKind, WatchDirection[]> = {
  "price-level": ["above", "below", "cross"],
  "bias-flip": ["sign", "above", "below"],
  "scenario-band": ["target", "implied-move"],
  calibration: ["above", "below"],
};

const METRICS: WatchCalibrationMetric[] = ["base-miss", "direction-hit-rate"];

interface RuleInput {
  kind?: unknown;
  label?: unknown;
  level?: unknown;
  direction?: unknown;
  metric?: unknown;
  active?: unknown;
}

/**
 * Validate a rule payload. Returns either the normalized fields or a
 * human reason; the same rules bind the engine, so a persisted rule is
 * always evaluable.
 */
function validateRuleInput(
  input: RuleInput,
  { requireAll }: { requireAll: boolean }
): { ok: true; fields: RuleFields } | { ok: false; reason: string } {
  const label =
    typeof input.label === "string" ? input.label.trim().slice(0, 120) : "";
  if (requireAll || input.label !== undefined) {
    if (label.length === 0) return { ok: false, reason: "a label is required" };
  }

  let kind: WatchRuleKind | undefined;
  if (requireAll || input.kind !== undefined) {
    if (
      typeof input.kind !== "string" ||
      !KINDS.includes(input.kind as WatchRuleKind)
    ) {
      return {
        ok: false,
        reason: `kind must be one of ${KINDS.join(", ")}`,
      };
    }
    kind = input.kind as WatchRuleKind;
  }

  let direction: WatchDirection | undefined;
  if (requireAll || input.direction !== undefined) {
    if (typeof input.direction !== "string") {
      return { ok: false, reason: "direction must be a string" };
    }
    const effectiveKind = kind ?? "price-level";
    const legal = DIRECTIONS_BY_KIND[effectiveKind] ?? [];
    if (!legal.includes(input.direction as WatchDirection)) {
      return {
        ok: false,
        reason: `direction must be one of ${legal.join(", ")} for ${effectiveKind} rules`,
      };
    }
    direction = input.direction as WatchDirection;
  }

  let metric: WatchCalibrationMetric | undefined;
  if (kind === "calibration" || (requireAll && input.metric !== undefined)) {
    const raw = typeof input.metric === "string" ? input.metric : "base-miss";
    if (!METRICS.includes(raw as WatchCalibrationMetric)) {
      return {
        ok: false,
        reason: `metric must be one of ${METRICS.join(", ")} for calibration rules`,
      };
    }
    metric = raw as WatchCalibrationMetric;
  }

  let level: number | undefined;
  if (requireAll || input.level !== undefined) {
    const n = typeof input.level === "string" ? Number(input.level) : input.level;
    if (typeof n !== "number" || !Number.isFinite(n)) {
      return { ok: false, reason: "level must be a finite number" };
    }
    const effectiveKind = kind ?? "price-level";
    if (effectiveKind === "calibration") {
      const m = (metric ?? "base-miss") as WatchCalibrationMetric;
      if (m === "direction-hit-rate" && (n < 0 || n > 100)) {
        return { ok: false, reason: "a hit-rate threshold is a percent (0–100)" };
      }
      if (m === "base-miss" && (n < 0 || n > 100)) {
        return { ok: false, reason: "a miss threshold is a percent (0–100)" };
      }
    } else if (effectiveKind === "bias-flip" && (n < -100 || n > 100)) {
      return { ok: false, reason: "a bias level sits between -100 and +100" };
    } else if (effectiveKind === "price-level" && n <= 0) {
      return { ok: false, reason: "a gold price level must be positive (USD/oz)" };
    }
    level = n;
  }

  if (requireAll && (kind === undefined || direction === undefined || level === undefined)) {
    return { ok: false, reason: "kind, level and direction are all required" };
  }

  return {
    ok: true,
    fields: {
      ...(kind !== undefined ? { kind } : {}),
      ...(label !== "" || input.label !== undefined ? { label } : {}),
      ...(level !== undefined ? { level } : {}),
      ...(direction !== undefined ? { direction } : {}),
      ...(metric !== undefined ? { metric } : {}),
    },
  };
}

interface RuleFields {
  kind?: WatchRuleKind;
  label?: string;
  level?: number;
  direction?: WatchDirection;
  metric?: WatchCalibrationMetric;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const date = params.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Dates must be valid YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const payload = await buildWatch(date);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[desk] GET /api/desk/watch failed:", e);
    return NextResponse.json(
      { error: "The watch could not be evaluated." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: RuleInput;
  try {
    body = (await req.json()) as RuleInput;
  } catch {
    return NextResponse.json(
      { error: "Body must be valid JSON." },
      { status: 400 }
    );
  }

  const validated = validateRuleInput(body, { requireAll: true });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  try {
    const rule = await db.watchRule.create({
      data: {
        kind: validated.fields.kind!,
        label: validated.fields.label!,
        level: validated.fields.level!,
        direction: validated.fields.direction!,
        metric: validated.fields.metric ?? "base-miss",
        active: true,
      },
    });
    return NextResponse.json({ rule }, { status: 201 });
  } catch (e) {
    console.error("[desk] POST /api/desk/watch failed:", e);
    return NextResponse.json(
      { error: "The rule could not be created." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  let body: (RuleInput & { id?: unknown });
  try {
    body = (await req.json()) as RuleInput & { id?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Body must be valid JSON." },
      { status: 400 }
    );
  }

  if (typeof body.id !== "string" || body.id.length === 0) {
    return NextResponse.json(
      { error: "An id is required." },
      { status: 400 }
    );
  }

  const existing = await db.watchRule.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json(
      { error: "No rule with that id exists." },
      { status: 404 }
    );
  }

  // Merge the patch over the stored row so kind/direction pairs stay legal.
  const merged: RuleInput = {
    kind: body.kind !== undefined ? body.kind : existing.kind,
    label: body.label !== undefined ? body.label : existing.label,
    level: body.level !== undefined ? body.level : existing.level,
    direction: body.direction !== undefined ? body.direction : existing.direction,
    metric: body.metric !== undefined ? body.metric : existing.metric,
  };
  const validated = validateRuleInput(merged, { requireAll: true });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  try {
    const rule = await db.watchRule.update({
      where: { id: body.id },
      data: {
        kind: validated.fields.kind!,
        label: validated.fields.label ?? existing.label,
        level: validated.fields.level!,
        direction: validated.fields.direction!,
        metric: validated.fields.metric ?? existing.metric,
        ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      },
    });
    return NextResponse.json({ rule });
  } catch (e) {
    console.error("[desk] PATCH /api/desk/watch failed:", e);
    return NextResponse.json(
      { error: "The rule could not be updated." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const id = params.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "An id query parameter is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await db.watchRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "No rule with that id exists." },
        { status: 404 }
      );
    }
    await db.watchRule.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch (e) {
    console.error("[desk] DELETE /api/desk/watch failed:", e);
    return NextResponse.json(
      { error: "The rule could not be deleted." },
      { status: 500 }
    );
  }
}
