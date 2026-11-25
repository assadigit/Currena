/**
 * The Persian dictionary pass for the translation step — the store-side
 * twin of src/lib/gold-page/fa-glossary.ts (the render-side last mile
 * on the page). The engines leave a few English tokens standing inside
 * otherwise-fluent Persian (دلار US, Federal Reserve, EU, Fed, a bare
 * US); the established Persian forms replace them deterministically
 * BEFORE the row is stored, so the side tables never carry them.
 *
 * Word-boundary regexes — «US» never fires inside «USD»/«AUS»; the
 * composed forms replace before the bare forms so nothing
 * double-replaces. Keep this list in sync with the page's own module.
 */

const GLOSSARY: ReadonlyArray<[RegExp, string]> = [
  [/دلار\s*US\b/g, "دلار آمریکا"],
  [/دلار\s*آمریکا\s*US\b/g, "دلار آمریکا"],
  [/\bUS\s*dollar\b/gi, "دلار آمریکا"],
  [/\bUnited\s+States\b/g, "آمریکا"],
  [/\bthe\s+Federal\s+Reserve\b/gi, "فدرال رزرو آمریکا"],
  [/\bFederal\s+Reserve\b/gi, "فدرال رزرو آمریکا"],
  [/\bthe\s+Fed\b/g, "فدرال رزرو آمریکا"],
  [/\bFed\b/g, "فدرال رزرو"],
  [/\bEU\b/g, "اتحادیه اروپا"],
  [/\bUS\b/g, "آمریکا"],
  [/\bTreasury\b/g, "خزانه‌داری آمریکا"],
  [/\bECB\b/g, "بانک مرکزی اروپا"],
];

/** Apply the dictionary to one Persian string (pure, total). */
export function faGlossary(text: string): string {
  if (text === "") return text;
  let out = text;
  for (const [pattern, replacement] of GLOSSARY) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
