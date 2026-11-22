"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coins,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";
import { fmtDayLabel } from "@/lib/gold/format";

interface DeskHeaderProps {
  date: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  canNextDay: boolean;
  narrativeSource: "llm" | "template" | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-lg"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Toggle light / dark</TooltipContent>
    </Tooltip>
  );
}

export function DeskHeader({
  date,
  onPrevDay,
  onNextDay,
  canNextDay,
  narrativeSource,
  onRegenerate,
  isRegenerating,
}: DeskHeaderProps) {
  return (
    <header className="border-b border-border/70 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <TooltipProvider delayDuration={200}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Coins className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">AURUM Desk</p>
            <p className="text-xs text-muted-foreground">
              Gold Intelligence &amp; Visual Explanation
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-10 lg:block" />

        {/* Programme layer status */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/5 font-normal text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            S8 Briefing · live
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 border-chart-4/50 bg-chart-4/5 font-normal text-chart-4"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-chart-4" />
            S9 Visuals · live
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 border-bull/50 bg-bull/5 font-normal text-bull"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-bull" />
            S10 Roots · live
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Date navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={onPrevDay}
              aria-label="Previous trading day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex min-w-[8.5rem] items-center justify-center gap-1.5 px-2 text-sm font-medium tabular">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {fmtDayLabel(date)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={onNextDay}
              disabled={!canNextDay}
              aria-label="Next trading day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-lg font-normal"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Re-pull live market data and rebuild this day&apos;s briefing
            </TooltipContent>
          </Tooltip>

          <ThemeToggle />
        </div>
      </div>
      </TooltipProvider>
      {narrativeSource ? (
        <p className="mx-auto max-w-7xl px-4 pb-2 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
          Narrative:{" "}
          {narrativeSource === "llm"
            ? "strategist model (LLM)"
            : "deterministic template fallback"}
        </p>
      ) : null}
    </header>
  );
}
