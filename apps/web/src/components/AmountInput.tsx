/**
 * AmountInput — THE hero of the converter (owner request 2026-09-17:
 * "give more visual weight to where users have to input their numbers";
 * 2026-09-18: "make the input box of number pastel gold (like it used to
 * be) … an animating css effect eye-grabbing box, so user know what to
 * do. with proper contrast").
 *
 * Redesigned amount-first:
 *   - the panel sits at the very top of the converter card so it is always
 *     inside the first viewport (no scrolling to type — the old layout had
 *     the field below the fold on real phones with browser chrome + font
 *     scaling);
 *   - hero typography: ~32px extrabold tabular numerals, 64–72px tall field;
 *   - the unit (e.g. "USD" / "IRR (Toman)") renders as a bold chip pinned
 *     inside the field's inline-end edge — impossible to miss;
 *   - LIGHT mode: pastel-gold panel (the legacy look the owner asked back)
 *     that becomes an eye-grabbing ATTRACTOR while idle — a warm sheen
 *     sweeps the gold, the border breathes a glow and the 💰 coin bobs
 *     (see .amount-panel / .amount-attract in index.css). The moment the
 *     user engages (focus or value) the animation settles and a crisp gold
 *     focus ring takes over; DARK mode keeps the Currena Night family with
 *     the same affordance in blue;
 *   - `footer` slot lets the converter drop the quick-amount chips INSIDE
 *     the panel (visually bound to the field they fill).
 *
 * Thousand separators as you type via @currena/core thousandSeparateInput
 * (Persian-digit tolerant via parseAmount).
 */

import { useState, type ReactNode } from 'react';
import { parseAmount, thousandSeparateInput } from '@currena/core';
import { useCodeLabel } from '../lib/display';
import { useI18n } from '../lib/locale';

export interface AmountInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** From-currency code for the unit chip pinned inside the field. */
  currency: string;
  invalid?: boolean;
  /** Extra content rendered inside the panel under the field (quick chips). */
  footer?: ReactNode;
}

export function AmountInput({ id, value, onChange, currency, invalid, footer }: AmountInputProps) {
  const { t } = useI18n();
  const label = useCodeLabel();
  const [focused, setFocused] = useState(false);

  // Attract mode: the eye-grabbing gold animation runs ONLY while the field
  // is idle (empty + unfocused + not invalid). First focus or first digit
  // settles it — attention when needed, calm once the user is engaged.
  const attract = value.trim() === '' && !focused && invalid !== true;

  // The unit chip adapts to the label width: short codes ("USD") get the
  // roomy chip, the long "IRR (Toman)" / "IRR (تومان)" label gets a compact
  // one so the digits keep most of the field (owner rule: never truncate
  // the Toman unit — it must always read in full).
  const unit = label(currency);
  const longUnit = unit.length > 5;

  return (
    <div className={`amount-panel rounded-[20px] p-4 sm:p-5${attract ? ' amount-attract' : ''}`}>
      <label
        htmlFor={id}
        className="mb-2.5 block text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#6B5210] dark:text-currena-dark"
      >
        {t('converter.enterAmount')}
      </label>
      <div className="relative">
        <span
          className={`pointer-events-none absolute inset-y-0 start-4 flex items-center text-[1.55rem]${attract ? ' amount-coin' : ''}`}
          aria-hidden="true"
        >
          💰
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('converter.amountPlaceholder')}
          value={value}
          aria-invalid={invalid === true}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(thousandSeparateInput(e.target.value))}
          className={`h-16 w-full rounded-2xl border-2 border-[#EBD48A] bg-[#FFFDF2] ps-13 text-[1.85rem] font-extrabold tabular-nums text-currena-dark caret-[#C79100] shadow-[inset_0_1px_3px_rgba(122,90,0,0.05),0_6px_18px_rgba(240,180,41,0.10)] transition-all duration-200 placeholder:font-bold placeholder:text-[#B39B45] focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(240,180,41,0.20),0_8px_24px_rgba(240,180,41,0.22)] focus:outline-none sm:h-[72px] sm:text-[2.1rem] dark:border-white/10 dark:bg-[#222C3B] dark:caret-currena-blue dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] dark:placeholder:text-[#5B6B80] dark:focus:border-currena-blue dark:focus:shadow-[0_0_0_4px_rgba(111,174,236,0.18),0_8px_24px_rgba(0,0,0,0.5)] ${
            longUnit ? 'pe-[6.5rem]' : 'pe-[4.6rem]'
          } ${
            invalid ? 'border-currena-warning! shadow-[0_0_0_4px_rgba(255,107,107,0.18)]!' : ''
          }`}
        />
        {/* Unit chip — the from-currency, impossible to miss (gold family in
            light mode to bind it to the pastel-gold panel; Currena Night
            blue in dark mode) */}
        <span className="pointer-events-none absolute end-3 top-1/2 flex max-w-[5.4rem] -translate-y-1/2 items-center">
          <span
            className={`block truncate rounded-xl bg-[#F5B942]/15 px-2.5 font-extrabold text-[#7A5800] ring-1 ring-[#E8B923]/45 dark:bg-currena-blue/12 dark:text-currena-blue dark:ring-currena-blue/25 ${
              longUnit ? 'py-1 text-[0.62rem] leading-tight' : 'py-1.5 text-[0.8rem]'
            }`}
            dir="ltr"
          >
            <bdi>{unit}</bdi>
          </span>
        </span>
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
      {invalid ? <p className="mt-2 text-xs font-semibold text-currena-warning">{t('converter.enterValidAmount')}</p> : null}
    </div>
  );
}

/** Parse helper shared by the converter (null-safe, separator-tolerant). */
export function parseInputAmount(value: string): number | null {
  return parseAmount(value);
}
