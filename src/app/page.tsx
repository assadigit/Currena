"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TriangleAlert } from "lucide-react";
import type { ContinuityPayload, DeskResponse, SectionId } from "@/lib/gold/types";
import { fmtDayLabel } from "@/lib/gold/format";
import { DeskHeader } from "@/components/gold/header";
import { MarketStrip } from "@/components/gold/market-strip";
import { SectionNav } from "@/components/gold/section-nav";
import { BriefingCard } from "@/components/gold/briefing-card";
import { DeskFooter } from "@/components/gold/footer";
import { VisualSlot } from "@/components/gold/visuals/visual-slot";
import { TrackRecordBand } from "@/components/gold/track-record";
import { ThenVsNowLine } from "@/components/gold/then-vs-now";
import { CalibrationBand } from "@/components/gold/calibration";
import { WatchBand } from "@/components/gold/watch-band";
import type { CalibrationPayload, WatchPayload } from "@/lib/gold/types";

/** Ordinal labels for the eight S9 supporting visuals. */
const VISUAL_INDEX: Record<string, string> = {
  "price-180d": "V1",
  "driver-attribution": "V2",
  "correlation-matrix": "V3",
  "volatility-regime": "V4",
  "positioning-flows": "V5",
  "sentiment-timeline": "V6",
  "scenario-fan": "V7",
  seasonality: "V8",
};

/** Narrative column width per section — the hero visual gets the wide lane. */
const BRIEFING_COLS: Record<SectionId, string> = {
  exec: "lg:col-span-4",
  macro: "lg:col-span-4",
  "price-action": "lg:col-span-5",
  positioning: "lg:col-span-5",
  news: "lg:col-span-5",
  outlook: "lg:col-span-5",
};

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

async function fetchDesk(date: string): Promise<DeskResponse> {
  const res = await fetch(`/api/desk?date=${date}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`The desk API responded with ${res.status}`);
  }
  return res.json() as Promise<DeskResponse>;
}

/** S11 Continuity: the desk archive for the viewed date (read-only). */
async function fetchContinuity(date: string): Promise<ContinuityPayload> {
  const res = await fetch(`/api/desk/continuity?date=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`The continuity API responded with ${res.status}`);
  }
  return res.json() as Promise<ContinuityPayload>;
}

/** S12 Calibration: the desk scorecard for the viewed date (read-only). */
async function fetchCalibration(date: string): Promise<CalibrationPayload> {
  const res = await fetch(`/api/desk/calibration?date=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`The calibration API responded with ${res.status}`);
  }
  return res.json() as Promise<CalibrationPayload>;
}

/** S13 Watch: the owner's rules, evaluated against the persisted record. */
async function fetchWatch(date: string): Promise<WatchPayload> {
  const res = await fetch(`/api/desk/watch?date=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`The watch API responded with ${res.status}`);
  }
  return res.json() as Promise<WatchPayload>;
}

/** Loading skeleton mirroring the desk structure. */
function DeskSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <Skeleton className="mt-6 h-28 w-full rounded-xl" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="mt-8 grid gap-6 lg:grid-cols-12"
        >
          <Skeleton className="h-72 lg:col-span-5" />
          <Skeleton className="h-72 lg:col-span-7" />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  // Date state is set after mount to keep SSR and client renders identical.
  const [today, setToday] = React.useState<string>("");
  const [date, setDate] = React.useState<string>("");

  React.useEffect(() => {
    const iso = toISO(new Date());
    setToday(iso);
    setDate(iso);
  }, []);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["desk", date],
    queryFn: () => fetchDesk(date),
    enabled: date !== "",
  });

  // S11 Continuity — rides along with date navigation; a failure here
  // never blocks the desk itself.
  const { data: continuity } = useQuery({
    queryKey: ["continuity", date],
    queryFn: () => fetchContinuity(date),
    enabled: date !== "",
  });

  // S12 Calibration — the scorecard over the cached archive; a failure
  // here never blocks the desk itself.
  const { data: calibration } = useQuery({
    queryKey: ["calibration", date],
    queryFn: () => fetchCalibration(date),
    enabled: date !== "",
  });

  // S13 Watch — the owner's rules, re-checked on every desk load; a
  // failure here never blocks the desk itself. Rule CRUD invalidates
  // this query so the band re-evaluates against the same record.
  const { data: watch, refetch: refetchWatch } = useQuery({
    queryKey: ["watch", date],
    queryFn: () => fetchWatch(date),
    enabled: date !== "",
  });

  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const regenerate = React.useCallback(async () => {
    if (!date) return;
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        throw new Error(`Regeneration failed (${res.status})`);
      }
      await queryClient.invalidateQueries({ queryKey: ["desk", date] });
      await queryClient.invalidateQueries({ queryKey: ["continuity", date] });
      await queryClient.invalidateQueries({ queryKey: ["calibration", date] });
      await queryClient.invalidateQueries({ queryKey: ["watch", date] });
      toast({
        title: "Briefing regenerated",
        description:
          "Live observations re-pulled; a fresh strategist narrative has been written for this date.",
      });
    } catch (e) {
      toast({
        title: "Regeneration failed",
        description:
          e instanceof Error ? e.message : "The desk API could not be reached.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [date, queryClient, toast]);

  const jumpToVisual = React.useCallback((visualId: string) => {
    const el = document.getElementById(`visual-${visualId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("visual-flash");
    // restart the animation
    void el.offsetWidth;
    el.classList.add("visual-flash");
    window.setTimeout(() => el.classList.remove("visual-flash"), 3400);
  }, []);

  const briefing = data?.briefing;
  const visuals = data?.visuals;
  const provenance = data?.provenance;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DeskHeader
        date={briefing?.date ?? (date || "—")}
        onPrevDay={() => setDate((d) => (d ? shiftISO(d, -1) : d))}
        onNextDay={() => setDate((d) => (d ? shiftISO(d, 1) : d))}
        canNextDay={Boolean(date && today && date < today)}
        narrativeSource={briefing?.narrativeSource ?? null}
        onRegenerate={regenerate}
        isRegenerating={isRegenerating}
      />

      {isPending || !data ? (
        <main className="flex-1">
          <DeskSkeleton />
        </main>
      ) : isError ? (
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>The desk could not be reached</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Unknown error while loading the briefing."}
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <React.Fragment>
          <div className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <MarketStrip
              briefing={briefing}
              visuals={visuals}
              provenance={provenance}
            />
          </div>
          <SectionNav sections={briefing.sections} />

          {/* S11 Continuity — the then-vs-now reminder under date navigation */}
          {continuity ? (
            <div className="mx-auto w-full max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
              <ThenVsNowLine continuity={continuity} />
            </div>
          ) : null}

          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              {/* Briefing masthead */}
              <div className="max-w-3xl">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Daily Briefing · {fmtDayLabel(briefing.date)}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Six narrative sections from the S8 briefing layer, each
                  grounded by explainable charts from the S9
                  supporting-visuals layer. Every visual ships with its own
                  reading guide and a data-driven current reading.
                </p>
              </div>

              {/* S11 Continuity — the track-record band under the masthead */}
              {continuity && continuity.archive.length > 0 ? (
                <div className="mt-8">
                  <TrackRecordBand
                    continuity={continuity}
                    deskDate={continuity.effectiveDeskDate}
                  />
                </div>
              ) : null}

              {/* S12 Calibration — the scorecard band under the track record */}
              {calibration && calibration.record.cachedDays > 0 ? (
                <div className="mt-6">
                  <CalibrationBand
                    calibration={calibration}
                    deskDate={calibration.effectiveDeskDate}
                  />
                </div>
              ) : null}

              {/* S13 Watch — the owner's pinned questions under the scorecard */}
              {watch ? (
                <div className="mt-6">
                  <WatchBand
                    watch={watch}
                    onRulesChanged={() => void refetchWatch()}
                    toast={toast}
                  />
                </div>
              ) : null}

              {/* Sections: S8 narrative paired with S9 visuals */}
              <div className="mt-10 space-y-12">
                {briefing.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="grid items-start gap-6 lg:grid-cols-12"
                  >
                    <div
                      className={`${BRIEFING_COLS[section.id]} min-w-0 lg:sticky lg:top-20`}
                    >
                      <BriefingCard
                        section={section}
                        news={section.id === "news" ? briefing.news : undefined}
                        scenarios={
                          section.id === "outlook" ? briefing.scenarios : undefined
                        }
                        spot={briefing.spot}
                        onJumpToVisual={jumpToVisual}
                      />
                    </div>

                    <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
                      {section.visualIds
                        .filter((id) => id !== "price-180d" || section.id === "exec")
                        .map((visualId) => (
                          <VisualSlot
                            key={visualId}
                            id={visualId}
                            index={VISUAL_INDEX[visualId]}
                            visuals={visuals}
                          />
                        ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </main>
        </React.Fragment>
      )}

      <DeskFooter provenance={provenance} />
    </div>
  );
}

