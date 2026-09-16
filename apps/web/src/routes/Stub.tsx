/**
 * Stub route — calculator / history / receipt / splitter / settle / batch /
 * about ship in Phase 5b (this task is shell + converter + live-rates).
 * The card keeps nav + titles legacy-shaped so 5b is a drop-in swap.
 */

import { Button, Card } from '../components/ui';
import { navigate } from '../router';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';

export interface StubProps {
  emoji: string;
  titleKey: TranslationKey;
}

export function Stub({ emoji, titleKey }: StubProps) {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-10 lg:max-w-[1200px] lg:px-10">
      <Card className="text-center">
        <div className="mb-4 text-6xl" aria-hidden="true">
          {emoji}
        </div>
        <h1 className="mb-2 text-xl font-bold text-currena-dark dark:text-white">{t(titleKey)}</h1>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-currena-blue dark:text-currena-cyan">
          {t('stub.title')}
        </p>
        <p className="mb-6 text-sm text-currena-muted dark:text-white/70">{t('stub.text')}</p>
        <Button variant="cta" className="px-6 py-3" onClick={() => navigate('/')}>
          {t('nav.backToHome')}
        </Button>
      </Card>
    </div>
  );
}
