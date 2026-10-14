/**
 * converter/FailureCard — the I12 failure card: honest kind-aware copy,
 * the Try-again button, the self-healing countdown (while the failing
 * source has nothing to serve) and the last-good timestamp (Phase: WS-4
 * module split of the former Converter.tsx monolith — zero behavior
 * change, code moved verbatim; the shell owns the failure state, the
 * source state and the retry action).
 */

import { formatRelative } from '@currena/core';
import { Button, Card } from '../../components/ui';
import { useI18n } from '../../lib/locale';
import type { ConvertFailure } from './shared';
import { RetryCountdown } from './RetryCountdown';

export function FailureCard(props: {
  failure: ConvertFailure;
  nextRetryAt: number | null;
  snapshotFetchedAt: string | null;
  onRetry: () => void;
}) {
  const { t, numberLocale } = useI18n();
  const { failure, nextRetryAt, snapshotFetchedAt, onRetry } = props;

  return (
    <div role="alert" data-testid="convert-failure" className="slide-down">
      <Card className="mt-5 border-s-4 border-currena-warning!" padding="p-5">
        <div className="flex items-start gap-3.5">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-currena-warning/15 text-xl"
            aria-hidden="true"
          >
            ⚠️
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-currena-warning-deep">{failure.title}</h2>
            <div className="mt-1 space-y-0.5">
              {failure.lines.map((line, i) =>
                line === '' ? (
                  <div key={i} className="h-2" />
                ) : (
                  <p key={i} className="text-xs leading-relaxed text-currena-dark dark:text-slate-300">
                    {line}
                  </p>
                ),
              )}
            </div>
            {/* Self-healing countdown — only while the failing source has
                nothing to serve (first-visit during an outage window). */}
            {nextRetryAt !== null && snapshotFetchedAt === null ? (
              <RetryCountdown targetMs={nextRetryAt} />
            ) : null}
            {snapshotFetchedAt !== null ? (
              <p className="mt-2 text-xs text-currena-muted">
                {t('common.lastUpdated')}: {formatRelative(snapshotFetchedAt, numberLocale)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={onRetry}
            className="px-5 py-2.5 text-sm"
            data-testid="convert-retry"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">↻</span> {t('converter.tryAgain')}
            </span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
