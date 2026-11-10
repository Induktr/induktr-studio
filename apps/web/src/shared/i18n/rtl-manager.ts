import type { SupportedLocale } from './types';
import { RTL_LOCALES, LOCALE_TO_BCP47 } from './types';

/**
 * RTL Manager (ЗЮНУ Physical Geometry Standard)
 * Applies dir/lang attributes to the document root deterministically.
 * Never triggers React re-renders — all writes go directly to the DOM.
 */
export function applyDocumentDirection(locale: SupportedLocale): void {
  if (typeof document === 'undefined') return;

  const isRTL = RTL_LOCALES.has(locale);
  const root = document.documentElement;

  root.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  root.setAttribute('lang', LOCALE_TO_BCP47[locale]);

  if (isRTL) {
    root.classList.add('rtl-active');
    root.classList.remove('ltr-active');
  } else {
    root.classList.add('ltr-active');
    root.classList.remove('rtl-active');
  }
}

export function isRTLLocale(locale: SupportedLocale): boolean {
  return RTL_LOCALES.has(locale);
}
