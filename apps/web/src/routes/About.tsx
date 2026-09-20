/**
 * About route (`#/about`) — checklist #14. Port of the legacy static about
 * page: logo, app name, the Persian tagline, two about paragraphs, 5 feature
 * bullets, creator section and the version line (now injected at build time
 * from package.json via __APP_VERSION__ instead of the legacy hardcoded
 * "Version 1.0.0"). All copy lives in the i18n dictionary (en = verbatim
 * legacy strings, fa = translation).
 *
 * Trust & legal sections (owner request 2026-09-20): Privacy Policy ·
 * Terms of Service · Contact — the targets of the site-wide footer trust
 * links. The hash router can't carry #anchors, so the Footer stages the
 * target section id in sessionStorage (ABOUT_SCROLL_TARGET) and this route
 * scrolls to it once on mount, then clears the stage.
 */

import { useEffect } from 'react';
import { Button, Card } from '../components/ui';
import { navigate } from '../router';
import { useI18n } from '../lib/locale';
import type { TranslationKey } from '../lib/locale';
import { ABOUT_SCROLL_TARGET } from '../components/Footer';

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

  // Footer deep-links: scroll to the staged section once, then clear it so
  // a later plain visit to /about starts at the top.
  useEffect(() => {
    let target: string | null = null;
    try {
      target = window.sessionStorage.getItem(ABOUT_SCROLL_TARGET);
      window.sessionStorage.removeItem(ABOUT_SCROLL_TARGET);
    } catch {
      target = null;
    }
    if (target) {
      // The section renders in the same commit; one rAF is enough for it
      // to be laid out before scrolling.
      requestAnimationFrame(() => {
        document.getElementById(target as string)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-[500px] px-5 py-8 sm:max-w-[600px] lg:max-w-[880px] lg:px-10">
      {/* Logo block (legacy .logo-container) */}
      <div className="mb-7 text-center">
        <img
          src="/images/currena-logo.png"
          alt="Currena"
          className="currena-brand-logo mx-auto mb-4 h-24 w-auto drop-shadow-[0_6px_18px_rgba(74,144,226,0.25)]"
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

      {/* ── Trust & legal (owner request 2026-09-20) — the footer's deep
          link targets. Honest and short: a client-side app whose user data
          never leaves the device, public rate sources, no accounts,
          no analytics. Ids are stable contract with the Footer. ── */}
      <Card className="mt-6" padding="p-5 sm:p-6">
        <section id="privacy" aria-label={t('about.privacyTitle')} className="scroll-mt-24">
          <h2 className="mb-3 text-base font-bold text-currena-dark">
            {t('about.privacyTitle')}
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-currena-dark">
            {t('about.privacyText1')}
          </p>
          <p className="text-sm leading-relaxed text-currena-dark">
            {t('about.privacyText2')}
          </p>
        </section>

        <section id="terms" aria-label={t('about.termsTitle')} className="mt-6 scroll-mt-24 border-t border-black/5 pt-6 dark:border-white/10">
          <h2 className="mb-3 text-base font-bold text-currena-dark">
            {t('about.termsTitle')}
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-currena-dark">
            {t('about.termsText1')}
          </p>
          <p className="text-sm leading-relaxed text-currena-dark">
            {t('about.termsText2')}
          </p>
        </section>

        <section id="contact" aria-label={t('about.contactTitle')} className="mt-6 scroll-mt-24 border-t border-black/5 pt-6 dark:border-white/10">
          <h2 className="mb-3 text-base font-bold text-currena-dark">
            {t('about.contactTitle')}
          </h2>
          <p className="text-sm leading-relaxed text-currena-dark">
            {t('about.contactText')}{' '}
            <a
              href="https://github.com/assadigit"
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="font-semibold text-currena-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue"
            >
              github.com/assadigit
            </a>
          </p>
        </section>
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
