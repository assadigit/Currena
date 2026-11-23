"use client";

/**
 * CountryFlag — the flag glyph beside every country name on the desk.
 *
 * The full ISO-3166 alpha-2 set (254 flags, w40 size) is vendored at
 * /flags/{iso2}.png from flagcdn (public domain / CC0 artwork), so the
 * page never depends on a third-party request to render a flag. Unknown
 * codes fall back to a neutral globe glyph — never a wrong flag.
 */

import * as React from "react";
import { deskBasePath } from "@/lib/utils";

/** The IMF-style codes the desk prints, mapped to their ISO-2 flags. */
export const FLAGS: Record<string, string> = {
  POL: "pl", CHN: "cn", UZB: "uz", KAZ: "kz", CZE: "cz", BRA: "br",
  MYS: "my", JOR: "jo", AUS: "au", KGZ: "kg", SRB: "rs", KHM: "kh",
  IDN: "id", EZB: "az", GEO: "ge", GTM: "gt", PHL: "ph", EGY: "eg",
  IRQ: "iq", IND: "in", TUR: "tr", QAT: "qa", RUS: "ru", ARE: "ae",
  ARM: "am", SGP: "sg", IRL: "ie",
  // the curated sellers' codes (the demand band's own record)
  DEU: "de", MNG: "mn", TJK: "tj", VNM: "vn", LKA: "lk",
  CHE: "ch", GBR: "gb", JPN: "jp", CAN: "ca", NZD: "nz", UKR: "ua",
  // the physical-market trio's countries
  SWE: "se", NOR: "no", ZAF: "za", MEX: "mx", THA: "th", PAK: "pk",
  BGD: "bd", NGA: "ng", MAR: "ma", DZA: "dz", TUN: "tn",
  // the calendar's jurisdictions (the Fed, the ECB, the BoE, the BoJ)
  USA: "us", EURO: "eu",
};

export function CountryFlag({
  code,
  name,
  size = "md",
}: {
  /** The printable country name (for the alt text). */
  code: string;
  name: string;
  size?: "sm" | "md";
}) {
  const iso = FLAGS[code];
  const box = size === "sm" ? "h-[11px] w-[16px]" : "h-[13px] w-[19px]";
  if (iso === undefined) {
    return (
      <span
        aria-hidden="true"
        className={`${box} inline-flex shrink-0 items-center justify-center rounded-[2.5px] bg-[var(--color-currena-bg-light)] text-[8px] leading-none text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border)]`}
      >
        ◌
      </span>
    );
  }
  return (
    <img
      src={`${deskBasePath}/flags/${iso}.png`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      width={19}
      height={13}
      className={`${box} inline-block shrink-0 rounded-[2.5px] object-cover ring-1 ring-[var(--color-border)]/70`}
    />
  );
}

/** A bank glyph for the non-country rows (the bullion banks). */
export function BankGlyph() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[13px] w-[19px] shrink-0 items-center justify-center rounded-[2.5px] bg-[var(--color-currena-bg-light)] text-[9px] leading-none text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border)]"
    >
      ⌂
    </span>
  );
}
