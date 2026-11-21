"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { BriefingSection } from "@/lib/gold/types";

interface SectionNavProps {
  sections: BriefingSection[];
}

/**
 * Sticky in-page navigation across the six briefing sections,
 * with an IntersectionObserver scroll-spy for the active chip.
 */
export function SectionNav({ sections }: SectionNavProps) {
  const [active, setActive] = React.useState<string>(sections[0]?.id ?? "");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Briefing sections"
      className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur"
    >
      <div className="scroll-slim mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
              active === s.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="tabular text-[10px] opacity-70">
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.title.length > 34 ? s.title.slice(0, 32) + "…" : s.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
