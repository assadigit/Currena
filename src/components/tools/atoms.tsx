"use client";

/**
 * The tools family's shared atoms — the compound tool's own controls
 * (app.tsx's NumberField, Chip, Fold), restated once so every tool
 * speaks the same interface: text that survives typing (fa digits
 * normalized, leading zeros collapsed), 44px-class targets, the
 * tokens' quiet surfaces. No new visual language is invented here.
 */

import * as React from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { Locale } from "@/lib/compound/content";
import { clamp, normalizeDigits, toFaDigits } from "@/lib/tools/fmt";

/* =================================================================== *
 * NumberField — the labelled number box that survives typing          *
 * =================================================================== */

export function NumberField({
  value,
  onCommit,
  locale,
  suffix,
  id,
  ariaLabel,
  clampRange,
  decimals = false,
  allowEmpty = false,
  className,
  big,
}: {
  value: number;
  onCommit: (v: number) => void;
  locale: Locale;
  suffix?: string;
  id: string;
  ariaLabel: string;
  clampRange?: [number, number, number];
  decimals?: boolean;
  /** When true an emptied field stays empty (a not-yet-written value). */
  allowEmpty?: boolean;
  className?: string;
  /** The result rendition: larger, centered, no border chrome. */
  big?: boolean;
}) {
  const [text, setText] = React.useState<string>(() => String(value));
  React.useEffect(() => {
    if (Number(text) !== value) setText(String(value));
  }, [value]);

  const handle = (raw: string) => {
    const norm = normalizeDigits(raw).replace(decimals ? /[^\d.]/g : /\D/g, "");
    setText(norm);
    if (norm !== "") {
      const n = Number(norm);
      if (Number.isFinite(n)) {
        onCommit(clampRange ? clamp(n, clampRange[0], clampRange[1], clampRange[2]) : n);
      }
    } else if (allowEmpty) {
      onCommit(NaN);
    }
  };

  if (big) {
    return (
      <span className={`relative inline-flex items-center ${className ?? ""}`}>
        <input
          id={id}
          inputMode={decimals ? "decimal" : "numeric"}
          type="text"
          dir="ltr"
          value={locale === "fa" ? toFaDigits(text) : text}
          onChange={(e) => handle(e.target.value)}
          onBlur={() => {
            if (text === "" || !Number.isFinite(Number(text))) setText(String(value));
          }}
          aria-label={ariaLabel}
          className="h-12 w-[7.5rem] rounded-xl border-0 bg-transparent text-center text-[1.6rem] font-extrabold tabular-nums text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 end-1 flex items-center text-[12px] font-semibold text-[var(--color-text-tertiary)]">
            {suffix}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex items-center ${className ?? ""}`}>
      <input
        id={id}
        inputMode={decimals ? "decimal" : "numeric"}
        type="text"
        dir="ltr"
        value={locale === "fa" ? toFaDigits(text) : text}
        onChange={(e) => handle(e.target.value)}
        onBlur={() => {
          if (text === "" || !Number.isFinite(Number(text))) setText(String(value));
        }}
        aria-label={ariaLabel}
        className="h-10 w-[6.5rem] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-center text-[14.5px] font-bold tabular-nums text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-[11px] font-semibold text-[var(--color-text-tertiary)]">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}

/* =================================================================== *
 * Chip — one pill                                                      *
 * =================================================================== */

export function Chip({
  active,
  children,
  onClick,
  ariaLabel,
  asAnchor,
  href,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  asAnchor?: boolean;
  href?: string;
}) {
  const cls = `min-h-[33px] shrink-0 rounded-full px-3 text-[12.5px] font-bold transition-all active:scale-95 ${
    active
      ? "bg-[var(--color-currena-blue)] text-white shadow-sm"
      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
  }`;
  if (asAnchor && href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} aria-pressed={active} className={cls}>
      {children}
    </button>
  );
}

/* =================================================================== *
 * Picker — a styled native select (17 currencies need a list, not chips)*
 * =================================================================== */

export interface PickerOption {
  value: string;
  label: string;
}

export function Picker({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  id: string;
  value: string;
  options: PickerOption[];
  onChange: (v: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex items-center ${className ?? ""}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-10 appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ps-3 pe-8 text-[13.5px] font-bold text-[var(--color-text-primary)] outline-none ring-[var(--color-ring)] transition-shadow focus-visible:ring-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-2.5 h-4 w-4 text-[var(--color-text-tertiary)]"
        aria-hidden="true"
      />
    </span>
  );
}

/* =================================================================== *
 * Fold — a collapsible group (the More options / How patterns)          *
 * =================================================================== */

export function Fold({
  title,
  children,
  open,
  onToggle,
  idPrefix,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  idPrefix: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${idPrefix}-panel`}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-start text-[13.5px] font-extrabold text-[var(--color-text-primary)]"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div id={`${idPrefix}-panel`} className="px-4 pb-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/* =================================================================== *
 * FieldRow — a labelled control row (label start, control end)          *
 * =================================================================== */

export function FieldRow({
  label,
  hint,
  children,
  id,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-1.5">
      <label htmlFor={id} className="text-[13px] font-bold text-[var(--color-text-secondary)]">
        {label}
        {hint ? (
          <span className="ms-1.5 block max-w-[26ch] text-[11px] font-medium leading-snug text-[var(--color-text-tertiary)]">
            {hint}
          </span>
        ) : null}
      </label>
      <span className="flex flex-wrap items-center justify-end gap-2">{children}</span>
    </div>
  );
}

/* =================================================================== *
 * SectionCard — one quiet card (the tool card surface, restated)        *
 * =================================================================== */

export function SectionCard({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] sm:p-5 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

/* =================================================================== *
 * ResultLine — the answer strip: a big value with a caption             *
 * =================================================================== */

export function ResultLine({
  caption,
  value,
  sub,
  strong,
}: {
  caption: string;
  value: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        strong === false
          ? "bg-[var(--color-currena-bg-light)]"
          : "bg-[var(--color-currena-soft)]"
      }`}
    >
      <p className="m-0 text-[11.5px] font-bold text-[var(--color-text-tertiary)]">{caption}</p>
      <p
        dir="ltr"
        className="m-0 mt-0.5 text-[1.45rem] font-extrabold leading-tight tabular-nums text-[var(--color-currena-blue-deep)]"
      >
        {value}
      </p>
      {sub ? (
        <p dir="auto" className="m-0 mt-1 text-[12px] font-medium leading-relaxed text-[var(--color-text-secondary)]">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

/* =================================================================== *
 * SourceLine — the honest data line every live tool carries             *
 * =================================================================== */

export function SourceLine({
  text,
  stamp,
  state,
}: {
  text: string;
  stamp?: string;
  state: "loading" | "live" | "error";
}) {
  return (
    <p className="m-0 text-[11.5px] leading-relaxed text-[var(--color-text-tertiary)]">
      {text}
      {stamp ? <span className="mx-1">·</span> : null}
      {stamp ? <span>{stamp}</span> : null}
      {state === "error" ? (
        <span className="mt-1 block font-semibold text-[var(--color-currena-warning-deep)]">
          —
        </span>
      ) : null}
    </p>
  );
}

/* =================================================================== *
 * AddRemove — the little row buttons (add a person, drop a line)        *
 * =================================================================== */

export function AddButton({
  label,
  onClick,
  id,
}: {
  label: string;
  onClick: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[var(--color-currena-soft)] px-3 text-[12.5px] font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform hover:scale-[1.02] active:scale-95"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

export function RemoveButton({
  label,
  onClick,
  id,
}: {
  label: string;
  onClick: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border)] transition-colors hover:text-[var(--color-currena-warning-deep)]"
    >
      <X className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

/* =================================================================== *
 * PillButton — a quiet secondary action (reset, sample, print)          *
 * =================================================================== */

export function PillButton({
  label,
  onClick,
  id,
  tone = "quiet",
}: {
  label: string;
  onClick: () => void;
  id: string;
  tone?: "quiet" | "accent";
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={`min-h-[36px] rounded-xl px-3.5 text-[12.5px] font-extrabold transition-transform hover:scale-[1.02] active:scale-95 ${
        tone === "accent"
          ? "bg-[var(--color-currena-blue)] text-white shadow-sm"
          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}
