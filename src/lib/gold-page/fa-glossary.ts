/**
 * fa-glossary.ts — the Persian dictionary pass for the machine
 * translations (the TE daily briefing + the WGC monthly commentary).
 *
 * The translation engines leave a few English tokens standing inside
 * otherwise-fluent Persian — the observed set is exactly this list
 * («دلار US», «Federal Reserve», «EU», «Fed», a bare «US»). The
 * established Persian forms replace them deterministically, at render
 * time, so already-stored rows are healed with no re-translation and
 * new rows get the same treatment (te-watch carries the same pass at
 * store time — this module is the render-side twin, the last mile).
 *
 * The rules are word-boundary regexes — «US» never fires inside
 * «USD»/«AUS», «Fed» never inside «Federal». The longest phrases
 * replace first («دلار US» before a bare «US») so the composed forms
 * never double-replace. Pure, dependency-free, fail-never.
 */

/** The dictionary — [pattern, replacement], applied in order. */
const GLOSSARY: ReadonlyArray<[RegExp, string]> = [
  // the composed forms first (so the bare forms cannot double-replace):
  // «دلار US» / «دلار ایالات متحده» → the established «دلار آمریکا»
  [/دلار\s*US\b/g, "دلار آمریکا"],
  [/دلار\s*آمریکا\s*US\b/g, "دلار آمریکا"],
  [/\bUS\s*dollar\b/gi, "دلار آمریکا"],
  [/\bUnited\s+States\b/g, "آمریکا"],
  // the institutions — the owner's own three asks first
  [/\bthe\s+Federal\s+Reserve\b/gi, "فدرال رزرو آمریکا"],
  [/\bFederal\s+Reserve\b/gi, "فدرال رزرو آمریکا"],
  [/\bthe\s+Fed\b/g, "فدرال رزرو آمریکا"],
  [/\bFed\b/g, "فدرال رزرو"],
  [/\bEU\b/g, "اتحادیه اروپا"],
  // a bare US (the country) — after the composed forms above
  [/\bUS\b/g, "آمریکا"],
  // common neighbors the same engines leave standing
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
