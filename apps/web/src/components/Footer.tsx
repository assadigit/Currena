/**
 * Footer — legacy parity: "Made with ❤️ by Ali Assadi", plus the trust row
 * (owner request 2026-09-20): Privacy Policy · Terms of Service · Contact
 * alongside the credit line — baseline trust signals for a financial
 * utility. Privacy/Terms deep-link to their sections on the About route
 * (the hash router can't carry #anchors, so the target section is staged
 * in sessionStorage and About scrolls to it after mount); Contact opens
 * the developer's GitHub profile (the owner's public contact channel).
 * Sticky to the viewport bottom on short pages via the app's min-h-screen
 * flex column layout.
 */

import { navigate } from '../router';
import { useI18n } from '../lib/locale';

/** SessionStorage key staging the About section to scroll to. */
export const ABOUT_SCROLL_TARGET = 'currena:about-scroll';

/** Navigate to /about and stage a section id for About to scroll to. */
export function navigateToAboutSection(sectionId: string): void {
  try {
    window.sessionStorage.setItem(ABOUT_SCROLL_TARGET, sectionId);
  } catch {
    // Private mode: plain navigation, no scroll stage.
  }
  navigate('/about');
}

export function Footer() {
  const { t } = useI18n();

  const linkClass =
    'cursor-pointer border-0 bg-transparent font-semibold text-currena-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-currena-blue';

  return (
    <footer className="px-5 py-5 text-center text-xs text-currena-muted opacity-80">
      <p className="mb-1.5">{t('app.madeBy')}</p>
      {/* Trust row — privacy · terms · contact · about (financial-utility
          credibility; owner request 2026-09-20). */}
      <nav aria-label={t('nav.about')} className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <button type="button" onClick={() => navigateToAboutSection('privacy')} className={linkClass}>
          {t('footer.privacy')}
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => navigateToAboutSection('terms')} className={linkClass}>
          {t('footer.terms')}
        </button>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/assadigit"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {t('footer.contact')}
        </a>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => navigate('/about')} className={linkClass}>
          {t('nav.about')}
        </button>
      </nav>
    </footer>
  );
}
