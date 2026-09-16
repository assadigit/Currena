/**
 * Footer — legacy parity: "Made with ❤️ by Ali Assadi | About".
 * Sticky to the viewport bottom on short pages via the app's min-h-screen
 * flex column layout.
 */

import { navigate } from '../router';
import { useI18n } from '../lib/locale';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="px-5 py-5 text-center text-xs text-currena-muted opacity-80">
      {t('app.madeBy')} |{' '}
      <button
        type="button"
        onClick={() => navigate('/about')}
        className="cursor-pointer border-0 bg-transparent font-semibold text-currena-blue underline-offset-2 hover:underline"
      >
        {t('nav.about')}
      </button>
    </footer>
  );
}
