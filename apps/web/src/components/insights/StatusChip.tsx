/**
 * StatusChip — icon + word, never colour alone (02-page-design-spec.md §9).
 * Tones map onto the existing theme tokens; the icon is decoration
 * (aria-hidden) because the word carries the meaning.
 */

import type { IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { STATUS_META, type StatusTone } from './config';

const TONE_CLASSES: Record<StatusTone, string> = {
  danger: 'bg-currena-warning/15 text-currena-warning',
  success: 'bg-currena-success/15 text-currena-success',
  info: 'bg-currena-blue/10 text-currena-blue',
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
