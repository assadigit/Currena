/**
 * About route (`#/about`) — checklist #14. Port of the legacy static about
 * page: logo, app name, the Persian tagline, two about paragraphs, 5 feature
 * bullets, creator section and the version line (now injected at build time
 * from package.json via __APP_VERSION__ instead of the legacy hardcoded
 * "Version 1.0.0"). All copy lives in the i18n dictionary (en = verbatim
 * legacy strings, fa = translation).
 */

import { Button, Card } from '../components/ui';
import { navigate } from '../router';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';

/** The 5 legacy feature bullets with their emoji (captured about.html). */
const FEATURES: readonly { emoji: string; key: TranslationKey }[] = [
  { emoji: '✈️', key: 'about.featureTravel' },
  { emoji: '🌍', key: 'about.featureImmigration' },
  { emoji: '📊', key: 'about.featureRates' },
  { emoji: '💾', key: 'about.featureOffline' },
  { emoji: '🧠', key: 'about.featureMental' },
];

export function About() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-8 sm:max-w-[600px] lg:max-w-[880px] lg:px-10">
      {/* Logo block (legacy .logo-container) */}
      <div className="mb-7 text-center">
        <img
          src="/images/currena-logo.png"
          alt="Currena"
          className="mx-auto mb-4 h-24 w-auto drop-shadow-[0_6px_18px_rgba(74,144,226,0.25)]"
        />
        <h1 className="mb-1 text-3xl font-extrabold text-currena-dark">
          {t('app.name')}
        </h1>
        {/* Legacy tagline — Persian on the English page, by design. */}
        <p dir="rtl" lang="fa" className="text-base font-medium text-currena-blue">
          {t('app.tagline')}
        </p>
      </div>

      <Card>
        <p className="mb-6 text-sm leading-relaxed text-currena-dark">
          {t('about.aboutText1')}
        </p>

        {/* Feature list (legacy .feature-list; 2-up from tablet up) */}
        <ul className="mb-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {FEATURES.map(({ emoji, key }) => (
            <li key={key} className="flex items-start gap-3 text-sm text-currena-dark">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-currena-soft text-lg"
                aria-hidden="true"
              >
                {emoji}
              </span>
              {t(key)}
            </li>
          ))}
        </ul>

        <p className="mb-7 text-sm leading-relaxed text-currena-dark">
          {t('about.aboutText2')}
        </p>

        {/* Creator section (legacy .creator-section) */}
        <div className="rounded-[15px] bg-currena-soft px-5 py-4 text-center">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-currena-muted">
            {t('app.createdBy')}
          </p>
          <p className="text-lg font-bold text-currena-blue">
            {t('app.creatorName')}
          </p>
        </div>
      </Card>

      {/* Version line (legacy .version — from package.json at build) */}
      <p className="mt-5 text-center text-xs font-medium text-currena-muted">
        {t('app.versionLabel', { version: __APP_VERSION__ })}
      </p>

      <div className="mt-6 text-center">
        <Button variant="cta" className="px-6 py-3" onClick={() => navigate('/')}>
          {t('nav.backToHome')}
        </Button>
      </div>
    </div>
  );
}
