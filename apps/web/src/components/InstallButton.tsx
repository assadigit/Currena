/**
 * InstallButton — in-app install CTA (A2HS, Task 23 / PWABuilder prep).
 *
 * Chrome fires `beforeinstallprompt` on every load of an installable PWA
 * (HTTPS + manifest + SW) but its own mini-infobar is one-shot: once
 * dismissed it never returns, leaving visitors with no visible path to
 * install. This component captures that event and surfaces a persistent
 * entry point instead:
 *
 *   - `variant="icon"`  → compact 📲 icon button for the header top bar
 *                         (h-11 w-11, same pattern as the theme/language
 *                         toggles so the bar stays visually balanced).
 *   - `variant="row"`   → labeled row for the mobile side menu (same
 *                         pattern as the theme/language rows).
 *
 * Visibility rules:
 *   - hidden until `beforeinstallprompt` fires (not installable / not
 *     Chrome / already dismissed → renders nothing, zero layout shift);
 *   - hidden permanently once `appinstalled` fires or the user accepts
 *     our own prompt;
 *   - hidden when the app already runs standalone (`display-mode:
 *     standalone` / iOS `navigator.standalone`) — the installed app has
 *     no business offering an install button.
 *
 * PWABuilder packages the site as a TWA from the live URL; this button is
 * for the *browser* install surface, which stays useful either way.
 */

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../lib/locale';
import { HEADER_ICON_BUTTON_CLASS } from './ui';

/** Chrome's non-standard install-prompt event (not in lib.dom). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Already launched from the home screen? (Chrome / Chromium / iOS Safari) */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true;
}

export function InstallButton({ variant }: { variant: 'icon' | 'row' }): React.JSX.Element | null {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Standalone (or iOS without the event at all) → never show.
    if (isStandalone()) return;

    const onBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault(); // keep Chrome's own infobar suppressed
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!deferredPrompt) return null;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title={t('nav.installApp')}
        aria-label={t('nav.installApp')}
        className={`${HEADER_ICON_BUTTON_CLASS} text-lg`}
      >
        📲
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3.5 py-3 text-sm font-medium text-currena-muted transition-all duration-300 hover:bg-currena-blue/5"
    >
      <span className="text-lg" aria-hidden="true">
        📲
      </span>
      {t('nav.installApp')}
    </button>
  );
}
