/**
 * converter/ConvertForm — the converting card's form: the AMOUNT-FIRST
 * hero panel (owner request 2026-09-17) with the quick-amount chips
 * inside it, the compact FROM ⇄ TO row with inline flags and the
 * full-names caption, the pair's live rate line, the custom-rate
 * disclosure and the CTA (Phase: WS-4 module split of the former
 * Converter.tsx monolith — zero behavior change, code moved verbatim;
 * the shell owns every piece of state — the conversion machine must
 * keep reading the same values — and passes value/setter pairs down).
 */

import { formatNumber, thousandSeparateInput } from '@currena/core';
import type { CurrencyCode, Snapshot } from '@currena/core';
import { AmountInput } from '../../components/AmountInput';
import { CurrencySelect } from '../../components/CurrencySelect';
import { LiveRateLine } from '../../components/LiveRateLine';
import { Button, Card } from '../../components/ui';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { QUICK_AMOUNTS_INTL, QUICK_AMOUNTS_IRR } from './shared';

export function ConvertForm(props: {
  amount: string;
  setAmount: (v: string) => void;
  amountInvalid: boolean;
  setAmountInvalid: (v: boolean) => void;
  from: CurrencyCode;
  setFrom: (v: CurrencyCode) => void;
  to: CurrencyCode;
  setTo: (v: CurrencyCode) => void;
  swap: () => void;
  parsedAmount: number | null;
  manualOpen: boolean;
  setManualOpen: (updater: (open: boolean) => boolean) => void;
  manualRate: string;
  setManualRate: (v: string) => void;
  manualRateId: string;
  /** The pair's booted snapshot (store[sourceForPair(from, to)]). */
  pairSnapshot: Snapshot | null;
  showStaleBanner: boolean;
  onSubmit: () => void;
}) {
  const { t, numberLocale } = useI18n();
  const {
    amount,
    setAmount,
    amountInvalid,
    setAmountInvalid,
    from,
    setFrom,
    to,
    setTo,
    swap,
    parsedAmount,
    manualOpen,
    setManualOpen,
    manualRate,
    setManualRate,
    manualRateId,
    pairSnapshot,
    showStaleBanner,
    onSubmit,
  } = props;

  const quickAmounts = from === 'IRR' ? QUICK_AMOUNTS_IRR : QUICK_AMOUNTS_INTL;
  const fromName = t(`currencies.${from}` as TranslationKey);
  const toName = t(`currencies.${to}` as TranslationKey);

  return (
    <Card padding="p-5 lg:p-7">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* 1 — Amount hero panel (quick chips live inside the panel so they
            read as one control: tap a chip, the big field fills) */}
        <AmountInput
          id="amount"
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setAmountInvalid(false);
          }}
          currency={from}
          invalid={amountInvalid}
          footer={
            <div className="flex flex-wrap gap-1.5">
              {quickAmounts.map((value) => {
                const active = parsedAmount === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAmount(thousandSeparateInput(String(value)));
                      setAmountInvalid(false);
                    }}
                    aria-pressed={active}
                    className={`min-h-[34px] cursor-pointer rounded-full border px-3 py-1 text-[0.8rem] font-bold transition-all duration-300 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue ${
                      active
                        ? 'amount-chip-active border-transparent shadow-[0_6px_18px_rgba(240,180,41,0.45)] dark:shadow-[0_6px_18px_rgba(102,126,234,0.4)]'
                        : 'border-[#EBD48A] bg-white text-currena-dark hover:border-[#E8B923] hover:shadow-[0_4px_12px_rgba(240,180,41,0.18)] dark:border-white/10 dark:bg-[#222C3B] dark:hover:border-currena-blue/40 dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    {formatNumber(value, numberLocale, { maximumFractionDigits: 0 })}
                  </button>
                );
              })}
            </div>
          }
        />

        {/* 2 — Currency pair: compact row, flags inline inside the selects */}
        <div className="mb-1.5 mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-currena-muted">{t('common.from')}</span>
          <span aria-hidden="true" className="w-11" />
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-currena-muted">{t('common.to')}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="relative">
            <img
              src={`/images/flags/${from.toLowerCase()}.png`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 z-10 h-3.5 w-[22px] -translate-y-1/2 rounded-[3px] object-cover shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/60"
            />
            <CurrencySelect id="fromCurrency" value={from} onChange={setFrom} ariaLabel={t('common.from')} className="ps-10 text-[0.82rem]" />
          </div>
          <button
            type="button"
            onClick={swap}
            title={t('converter.swapCurrencies')}
            aria-label={t('converter.swapCurrencies')}
            className="h-11 w-11 cursor-pointer rounded-full border-0 bg-currena-blue text-xl font-bold text-white shadow-[0_4px_15px_rgba(74,144,226,0.3)] transition-all duration-300 hover:rotate-180 hover:scale-110 hover:shadow-[0_6px_20px_rgba(74,144,226,0.4)]"
          >
            ⇄
          </button>
          <div className="relative">
            <img
              src={`/images/flags/${to.toLowerCase()}.png`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 z-10 h-3.5 w-[22px] -translate-y-1/2 rounded-[3px] object-cover shadow-[0_1px_3px_rgba(0,0,0,0.3)] ring-1 ring-white/60"
            />
            <CurrencySelect id="toCurrency" value={to} onChange={setTo} ariaLabel={t('common.to')} className="ps-10 text-[0.82rem]" />
          </div>
        </div>
        {/* Full names caption — restores the clarity of the old flags
            section in one 16px line (the select boxes truncate long names) */}
        <p className="mt-2.5 text-center text-xs font-medium text-currena-muted">
          <bdi>{fromName}</bdi>{' '}
          <span aria-hidden="true" className="inline-block opacity-50 rtl:-scale-x-100">→</span>{' '}
          <bdi>{toName}</bdi>
        </p>

        {/* I11 — the pair's live rate, always on (previously only visible
            inside the result popup). Local math over the booted snapshot;
            hidden for same-currency pairs, unresolvable pairs and while a
            custom rate overrides the market. */}
        <LiveRateLine
          from={from}
          to={to}
          snapshot={pairSnapshot}
          stale={showStaleBanner}
          hidden={manualOpen}
        />

        {/* 3 — Custom rate (legacy collapsible) */}
        <div className="mb-4 mt-4">
          <button
            type="button"
            onClick={() => setManualOpen((open) => !open)}
            aria-expanded={manualOpen}
            aria-controls={manualRateId}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5"
          >
            <span
              className={`text-xs text-currena-blue transition-transform duration-300 ${manualOpen ? 'rotate-90' : ''}`}
              aria-hidden="true"
            >
              ▶
            </span>
            {t('converter.customRate')}
          </button>
          {manualOpen ? (
            <input
              id={manualRateId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              placeholder={t('converter.enterCustomRate')}
              aria-label={t('converter.enterCustomRate')}
              className="mt-2.5 w-full rounded-[15px] border-2 border-gray-200 bg-white px-3.5 py-3 text-sm text-currena-dark focus:border-currena-blue focus:outline-none focus:ring-3 focus:ring-currena-blue/10 dark:border-white/10 dark:bg-[#222C3B]"
            />
          ) : null}
        </div>

        <Button variant="cta" type="submit" className="w-full py-4 text-[1.15rem] sm:py-5 sm:text-[1.25rem]">
          {t('converter.convertNow')}
        </Button>
      </form>
    </Card>
  );
}
