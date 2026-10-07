/**
 * StatusChip — icon + word, never colour alone (02-page-design-spec.md §9).
 * Tones map onto the existing theme tokens; the icon is decoration
 * (aria-hidden) because the word carries the meaning.
 */

import type { IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { STATUS_META, type StatusTone } from './config';

// I6 audit F1: the brand accents fail WCAG AA as small text on light cards
// (2.78–3.29:1) — text uses the ink-grade `-deep` tokens (≥4.5:1 on the tinted
// pill in BOTH themes; dark remaps them to the bright hues).
const TONE_CLASSES: Record<StatusTone, string> = {
  danger: 'bg-currena-warning/15 text-currena-warning-deep',
  success: 'bg-currena-success/15 text-currena-success-deep',
  info: 'bg-currena-blue/10 text-currena-blue-deep',
  muted: 'bg-currena-muted/15 text-currena-muted',
};

export function StatusChip({
  status,
  copy,
}: {
  status: IndicatorReading['status'];
  copy: InsightsCopy;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${TONE_CLASSES[meta.tone]}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {copy.status[status]}
    </span>
  );
}
