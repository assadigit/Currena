"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  WatchCalibrationMetric,
  WatchDirection,
  WatchEvaluation,
  WatchPayload,
  WatchRuleKind,
} from "@/lib/gold/types";
import { fmtDayLabel } from "@/lib/gold/format";

interface WatchBandProps {
  watch: WatchPayload;
  /** Invalidate the watch query after a rule change. */
  onRulesChanged: () => void;
  /** Toast helper — the page owns the toaster. */
  toast: (t: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => void;
}

/* ------------------------------------------------------------------ */
/* Rule-family labels                                                   */
/* ------------------------------------------------------------------ */

const KIND_LABELS: Record<WatchRuleKind, string> = {
  "price-level": "price level",
  "bias-flip": "stance",
  "scenario-band": "scenario band",
  calibration: "calibration",
};

const DIRECTION_LABELS: Partial<Record<WatchDirection, string>> = {
  above: "crosses upward",
  below: "crosses downward",
  cross: "crosses either way",
  sign: "flips sign",
  target: "target level",
  "implied-move": "implied move",
};

const METRIC_LABELS: Record<WatchCalibrationMetric, string> = {
  "base-miss": "mean base-case miss",
  "direction-hit-rate": "direction hit rate",
};

/** The watched level, formatted per family. */
function fmtLevel(kind: WatchRuleKind, level: number): string {
  if (kind === "price-level" || kind === "scenario-band") {
    return `$${level.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (kind === "bias-flip") return `${level > 0 ? "+" : ""}${level}`;
  return `${level.toFixed(0)}%`;
}

/** The watched value, formatted per family (matches the statement). */
function fmtWatched(kind: WatchRuleKind, v: number): string {
  if (kind === "price-level" || kind === "scenario-band") {
    return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (kind === "bias-flip") return `${v > 0 ? "+" : ""}${v}`;
  if (kind === "calibration") return `${v.toFixed(v >= 10 ? 0 : 2)}%`;
  return v.toFixed(2);
}

function eraChipClass(era: string): string {
  if (era === "live") return "border-bull/50 bg-bull/5 text-bull";
  if (era === "modelled") return "border-gold/50 bg-gold/5 text-gold";
  return "border-flat/50 bg-flat/10 text-muted-foreground";
}

function eraChipLabel(era: string): string {
  if (era === "live") return "live";
  if (era === "modelled") return "modelled";
  return "no data";
}

/* ------------------------------------------------------------------ */
/* One rule row                                                         */
/* ------------------------------------------------------------------ */

function RuleRow({
  ev,
  deskDate,
  onToggle,
  onDelete,
  busy,
}: {
  ev: WatchEvaluation;
  deskDate: string | null;
  onToggle: (ev: WatchEvaluation) => void;
  onDelete: (ev: WatchEvaluation) => void;
  busy: boolean;
}) {
  const { rule } = ev;
  const triggered = ev.state === "triggered";
  const paused = !rule.active;
  const viewed = ev.watchedDate !== null && deskDate === ev.watchedDate;

  return (
    <div
      role="group"
      aria-label={`Watch rule: ${rule.label}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-3.5 py-3",
        paused
          ? "border-border/50 bg-card/30 opacity-75"
          : triggered
            ? "border-primary/40 bg-primary/[0.05]"
            : "border-border/70 bg-card/60"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* Trigger state — the fact, never advice */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
            paused
              ? "border-flat/50 bg-flat/10 text-muted-foreground"
              : triggered
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground"
          )}
          role="status"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              paused ? "bg-muted-foreground/50" : triggered ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
          {paused ? "paused" : triggered ? "triggered" : "quiet"}
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">
          {rule.label}
        </p>
        {/* Actions — 44px touch floor */}
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 shrink-0 p-0"
          aria-label={rule.active ? `Pause rule ${rule.label}` : `Resume rule ${rule.label}`}
          onClick={() => onToggle(ev)}
          disabled={busy}
        >
          {rule.active ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 shrink-0 p-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete rule ${rule.label}`}
          onClick={() => onDelete(ev)}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* The observation — statement + provenance */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {ev.statement}
      </p>

      {/* Provenance strip: era, sample, dates */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span
          className={cn(
            "rounded-full border px-1.5 py-px font-medium leading-none",
            eraChipClass(ev.era)
          )}
          title="The era of the evidence behind this reading"
        >
          {eraChipLabel(ev.era)}
        </span>
        {ev.sample !== null ? (
          <span className="rounded-full border border-border bg-background px-1.5 py-px font-medium leading-none text-muted-foreground">
            n={ev.sample}
          </span>
        ) : null}
        {ev.watchedDate ? (
          <span
            className={cn(
              "rounded-full border px-1.5 py-px font-medium leading-none text-muted-foreground",
              viewed && "border-primary/50 text-primary"
            )}
          >
            as of {fmtDayLabel(ev.watchedDate)}
          </span>
        ) : null}
        <span className="rounded-full border border-border bg-background px-1.5 py-px font-medium leading-none text-muted-foreground">
          {KIND_LABELS[rule.kind]} · {DIRECTION_LABELS[rule.direction] ?? rule.direction}
          {rule.kind === "calibration" ? ` · ${METRIC_LABELS[rule.metric]}` : ""} ·{" "}
          {fmtLevel(rule.kind, rule.level)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The rule editor                                                      */
/* ------------------------------------------------------------------ */

interface DraftRule {
  kind: WatchRuleKind;
  label: string;
  level: string;
  direction: WatchDirection;
  metric: WatchCalibrationMetric;
}

const DEFAULT_DRAFT: DraftRule = {
  kind: "price-level",
  label: "",
  level: "",
  direction: "above",
  metric: "base-miss",
};

const DIRECTION_OPTIONS: Record<WatchRuleKind, WatchDirection[]> = {
  "price-level": ["above", "below", "cross"],
  "bias-flip": ["sign", "above", "below"],
  "scenario-band": ["target", "implied-move"],
  calibration: ["above", "below"],
};

function levelPlaceholder(kind: WatchRuleKind, metric: WatchCalibrationMetric): string {
  switch (kind) {
    case "price-level":
      return "e.g. 3550";
    case "bias-flip":
      return "e.g. -55";
    case "scenario-band":
      return "e.g. 3600";
    default:
      return metric === "direction-hit-rate" ? "e.g. 50" : "e.g. 3";
  }
}

function levelSuffix(kind: WatchRuleKind): string {
  if (kind === "price-level" || kind === "scenario-band") return "USD/oz";
  if (kind === "bias-flip") return "bias points";
  return "%";
}

function RuleEditor({
  onCreate,
  creating,
}: {
  onCreate: (draft: DraftRule) => void;
  creating: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftRule>(DEFAULT_DRAFT);

  const setKind = (kind: WatchRuleKind) => {
    // Reset the direction/metric to the first legal option for the kind.
    setDraft((d) => ({
      ...d,
      kind,
      direction: DIRECTION_OPTIONS[kind][0],
      ...(kind === "calibration" ? { metric: d.metric } : {}),
    }));
  };

  const submit = () => {
    onCreate(draft);
    setDraft({ ...DEFAULT_DRAFT, kind: draft.kind, direction: DIRECTION_OPTIONS[draft.kind][0] });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-1.5 font-normal"
          aria-expanded={open}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a watch rule
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 grid gap-3 rounded-lg border border-border/70 bg-card/40 p-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="watch-kind" className="text-xs">
              Watch what?
            </Label>
            <Select value={draft.kind} onValueChange={(v) => setKind(v as WatchRuleKind)}>
              <SelectTrigger id="watch-kind" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-level" className="h-11">
                  Gold price level
                </SelectItem>
                <SelectItem value="bias-flip" className="h-11">
                  Desk stance (bias)
                </SelectItem>
                <SelectItem value="scenario-band" className="h-11">
                  Base-case scenario
                </SelectItem>
                <SelectItem value="calibration" className="h-11">
                  Calibration scorecard
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="watch-label" className="text-xs">
              Rule name
            </Label>
            <Input
              id="watch-label"
              className="h-11"
              placeholder="e.g. Gold reclaims $3,535"
              value={draft.label}
              maxLength={120}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            />
          </div>

          {draft.kind === "calibration" ? (
            <div className="space-y-1.5">
              <Label htmlFor="watch-metric" className="text-xs">
                Metric
              </Label>
              <Select
                value={draft.metric}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, metric: v as WatchCalibrationMetric }))
                }
              >
                <SelectTrigger id="watch-metric" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base-miss" className="h-11">
                    Mean base-case miss
                  </SelectItem>
                  <SelectItem value="direction-hit-rate" className="h-11">
                    Direction hit rate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="watch-direction" className="text-xs">
                Condition
              </Label>
              <Select
                value={draft.direction}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, direction: v as WatchDirection }))
                }
              >
                <SelectTrigger id="watch-direction" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTION_OPTIONS[draft.kind].map((d) => (
                    <SelectItem key={d} value={d} className="h-11">
                      {DIRECTION_LABELS[d] ?? d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {draft.kind === "calibration" ? (
            <div className="space-y-1.5">
              <Label htmlFor="watch-cal-direction" className="text-xs">
                Condition
              </Label>
              <Select
                value={draft.direction}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, direction: v as WatchDirection }))
                }
              >
                <SelectTrigger id="watch-cal-direction" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above" className="h-11">
                    at or beyond (≥)
                  </SelectItem>
                  <SelectItem value="below" className="h-11">
                    at or under (≤)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="watch-level" className="text-xs">
              Threshold ({levelSuffix(draft.kind)})
            </Label>
            <div className="flex gap-2">
              <Input
                id="watch-level"
                className="h-11"
                inputMode="decimal"
                placeholder={levelPlaceholder(draft.kind, draft.metric)}
                value={draft.level}
                onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
              />
              <Button
                className="h-11 shrink-0 gap-1.5"
                onClick={submit}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Bell className="h-4 w-4" aria-hidden="true" />
                )}
                Watch it
              </Button>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2">
            Rules evaluate on every desk load against what the desk already
            persists — cached desk days, the live observation store and the S12
            scorecard. No new polling is added: the once-per-day EODHD sync
            stays the only network surface. Every reading states its era and,
            where a rate is involved, its sample size.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------ */
/* The band                                                             */
/* ------------------------------------------------------------------ */

/**
 * The S13 watch band: the owner's pinned questions, answered from the
 * persisted record. Insight-first title + current reading + collapsible
 * guide (the S9 convention); states, last-held dates, eras and sample
 * sizes stated honestly. Rule CRUD rides the /api/desk/watch route with
 * toast feedback. No push infrastructure — an in-desk surface only.
 */
export function WatchBand({ watch, onRulesChanged, toast }: WatchBandProps) {
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const rules = watch.rules;
  const triggered = rules.filter((r) => r.rule.active && r.state === "triggered");
  const active = rules.filter((r) => r.rule.active);
  const paused = rules.filter((r) => !r.rule.active);

  async function api(
    path: string,
    init: RequestInit
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(path, init);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: body.error ?? `The watch API responded ${res.status}` };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "The watch API could not be reached." };
    }
  }

  const toggleRule = React.useCallback(
    async (ev: WatchEvaluation) => {
      setBusyId(ev.rule.id);
      const activating = !ev.rule.active;
      const result = await api("/api/desk/watch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ev.rule.id, active: activating }),
      });
      if (result.ok) {
        toast({
          title: activating ? "Watch rule resumed" : "Watch rule paused",
          description: activating
            ? `"${ev.rule.label}" is being evaluated again on every desk load.`
            : `"${ev.rule.label}" is paused — it keeps its place in the band but is not evaluated.`,
        });
        onRulesChanged();
      } else {
        toast({
          title: "The rule could not be updated",
          description: result.error,
          variant: "destructive",
        });
      }
      setBusyId(null);
    },
    [onRulesChanged, toast]
  );

  const deleteRule = React.useCallback(
    async (ev: WatchEvaluation) => {
      setBusyId(ev.rule.id);
      const result = await api(`/api/desk/watch?id=${encodeURIComponent(ev.rule.id)}`, {
        method: "DELETE",
      });
      if (result.ok) {
        toast({
          title: "Watch rule deleted",
          description: `"${ev.rule.label}" no longer watches the desk.`,
        });
        onRulesChanged();
      } else {
        toast({
          title: "The rule could not be deleted",
          description: result.error,
          variant: "destructive",
        });
      }
      setBusyId(null);
    },
    [onRulesChanged, toast]
  );

  const createRule = React.useCallback(
    async (draft: DraftRule) => {
      setCreating(true);
      const result = await api("/api/desk/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          label: draft.label,
          level: Number(draft.level),
          direction: draft.direction,
          metric: draft.metric,
        }),
      });
      if (result.ok) {
        toast({
          title: "Watch rule added",
          description: `"${draft.label || "Untitled rule"}" is now evaluated on every desk load.`,
        });
        onRulesChanged();
      } else {
        toast({
          title: "The rule could not be created",
          description: result.error,
          variant: "destructive",
        });
      }
      setCreating(false);
    },
    [onRulesChanged, toast]
  );

  /* Insight-first title: what the watch says right now. */
  const insight =
    rules.length === 0
      ? "No watch rules yet — pin the desk to the questions you actually care about."
      : triggered.length === 0
        ? `All quiet — ${active.length} active rule${active.length === 1 ? "" : "s"} watched, none currently triggered.`
        : `${triggered.length} of ${active.length} active rule${active.length === 1 ? "" : "s"} triggered: ${triggered
            .map((t) => t.rule.label)
            .join("; ")}.`;

  const guides = [
    "Every watch is an observation, never advice. A trigger states the fact, the date it last held, its era, and its sample size where a rate is involved — it never tells you to buy or sell.",
    "Price levels watch gold's latest observed close from the live observation store (realized closes only); a crossing compares the two latest observed trading days.",
    "Stance rules watch the published bias score read back from the desk cache — a sign flip compares the two latest cached desk days, and the era chip says whether both are live-era.",
    "Scenario-band rules watch the latest base-case call — its USD target or its implied percent move off spot — and state the desk day it came from, with its era.",
    "Calibration rules threshold the S12 scorecard (mean base-case miss, direction hit rate). Those numbers pool live-era desk days only, state their n, and exclude flat and neutral days — modelled-era days are labelled and never graded.",
    "Rules re-check on every desk load against what the desk already persists. No new polling is added — the once-per-day EODHD sync stays the only network surface, and nothing here pushes notifications: the watch band is an in-desk surface only.",
  ];

  return (
    <Card className="w-full border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/5 font-normal text-primary"
          >
            <Bell className="h-3 w-3" />
            S13 Watch · owner rules
          </Badge>
          <p className="text-[11px] text-muted-foreground">
            {rules.length} rule{rules.length === 1 ? "" : "s"} ·{" "}
            {triggered.length} triggered ·{" "}
            {watch.liveDays} live + {watch.modelledDays} modelled desk days
            {watch.anchor
              ? ` · anchor ${fmtDayLabel(watch.anchor.asOf)}`
              : ""}
          </p>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {insight}
        </h3>
      </CardHeader>
      <CardContent>
        {/* The rules, triggered first */}
        <div className="grid gap-2.5">
          {[...triggered, ...active.filter((r) => r.state === "quiet"), ...paused].map(
            (ev) => (
              <RuleRow
                key={ev.rule.id}
                ev={ev}
                deskDate={watch.effectiveDeskDate}
                onToggle={toggleRule}
                onDelete={deleteRule}
                busy={busyId === ev.rule.id}
              />
            )
          )}
          {rules.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3.5 py-6 text-center text-xs text-muted-foreground">
              Pin a question — a gold price level, a stance threshold, a
              scenario band, or a calibration limit — and the desk will answer
              it from its own record on every load.
            </p>
          ) : null}
        </div>

        {/* Rule editor */}
        <div className="mt-3">
          <RuleEditor onCreate={createRule} creating={creating} />
        </div>

        {/* Current reading */}
        <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/[0.06] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-primary">Current reading · </span>
            {watch.anchor
              ? `Rules are evaluated against the persisted record as of the latest observed gold close ($${watch.anchor.close.toLocaleString("en-US", { maximumFractionDigits: 0 })}, ${fmtDayLabel(watch.anchor.asOf)}) and the desk's ${watch.liveDays} live-era cached day${watch.liveDays === 1 ? "" : "s"}${watch.modelledDays > 0 ? ` (${watch.modelledDays} modelled day${watch.modelledDays === 1 ? "" : "s"} labelled, never pooled)` : ""}. Realized-price evidence pools live desk days only; modelled-era data may inform the record but is labelled.`
              : "No live observations in the store yet — rules will evaluate once the desk has data."}
          </p>
        </div>

        {/* Reading guide — the S9 convention */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mt-3">
          <CollapsibleTrigger
            className="flex w-full items-center justify-between rounded-md px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={guideOpen}
          >
            <span>How to read this watch</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                guideOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ol className="mt-1 space-y-1.5 border-t border-border/60 pt-3">
              {guides.map((g, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground tabular">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-muted-foreground">{g}</span>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
