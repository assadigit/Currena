"use client";

import * as React from "react";
import type { VisualsPayload } from "@/lib/gold/types";
import { VisualCard } from "./visual-card";
import { PriceChartVisual } from "./price-chart";
import { DriversVisual } from "./drivers";
import { CorrelationMatrixVisual } from "./correlation-matrix";
import { VolatilityVisual } from "./volatility";
import { PositioningVisual } from "./positioning";
import { SentimentVisual } from "./sentiment";
import { ScenarioFanVisual } from "./scenario-fan";
import { SeasonalityVisual } from "./seasonality";

interface VisualSlotProps {
  /** S9 visual id. */
  id: string;
  /** Ordinal, e.g. "V1". */
  index?: string;
  visuals: VisualsPayload;
}

/**
 * Renders one S9 supporting visual: the right chart component wrapped in
 * the VisualCard explanation shell, using the insight / takeaway / guide
 * copy computed for this desk date.
 */
export function VisualSlot({ id, index, visuals }: VisualSlotProps) {
  const insight = visuals.insights[id];
  const takeaway = visuals.takeaways[id];
  const guides = visuals.guides[id] ?? [];

  if (!insight || !takeaway) {
    return null;
  }

  const shell = (meta: string, children: React.ReactNode) => (
    <VisualCard
      id={id}
      index={index}
      insight={insight}
      takeaway={takeaway}
      guides={guides}
      meta={meta}
    >
      {children}
    </VisualCard>
  );

  switch (id) {
    case "price-180d":
      return shell(
        `${visuals.price.window} trading days · daily closes`,
        <PriceChartVisual data={visuals.price} />
      );
    case "driver-attribution":
      return shell(
        "today's move decomposition · basis points",
        <DriversVisual data={visuals.drivers} />
      );
    case "correlation-matrix":
      return shell(
        `trailing ${visuals.correlations.window} trading days`,
        <CorrelationMatrixVisual data={visuals.correlations} />
      );
    case "volatility-regime":
      return shell(
        "annualised 20-day realised vol · trailing year",
        <VolatilityVisual data={visuals.volatility} />
      );
    case "positioning-flows":
      return shell(
        "net spec position · weekly ETF flows",
        <PositioningVisual data={visuals.positioning} />
      );
    case "sentiment-timeline":
      return shell(
        "30 days · aggregated headline scores",
        <SentimentVisual data={visuals.sentiment} />
      );
    case "scenario-fan":
      return shell(
        `${visuals.scenarios.horizonDays}-day horizon · three paths`,
        <ScenarioFanVisual data={visuals.scenarios} />
      );
    case "seasonality":
      return shell(
        "calendar-month return profile",
        <SeasonalityVisual data={visuals.seasonality} />
      );
    default:
      return null;
  }
}
