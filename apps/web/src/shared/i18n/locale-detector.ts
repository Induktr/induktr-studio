import type { SupportedLocale } from './types';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types';

const COOKIE_KEY = 'induktr_locale';
const STORAGE_KEY = 'induktr_locale';

const TG_MAP = new Map<string, SupportedLocale>([
  ['en', 'en'],
  ['uk', 'ua'],
  ['ua', 'ua'],
  ['de', 'de'],
  ['ar', 'ar'],
  ['es', 'es'],
]);

const NAV_MAP = new Map<string, SupportedLocale>([
  ['en', 'en'],
  ['uk', 'ua'],
  ['de', 'de'],
  ['ar', 'ar'],
  ['es', 'es'],
]);

function isSupportedLocale(val: string | null | undefined): val is SupportedLocale {
  return SUPPORTED_LOCALES.includes(val as SupportedLocale);
}

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    return match && match[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readTelegramLocale(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    interface TelegramWindow extends Window {
      Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } };
    }
    const tgLang = (window as unknown as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.toLowerCase();
    if (!tgLang) return null;
    return TG_MAP.get(tgLang) ?? null;
  } catch {
    return null;
  }
}

function readNavigatorLocale(): string | null {
  if (typeof navigator === 'undefined') return null;
  try {
    const firstLang = Array.isArray(navigator.languages) && navigator.languages.length > 0 ? navigator.languages[0] : navigator.language;
    const lang = firstLang ?? '';
    const prefix = (lang.split('-')[0] ?? '').toLowerCase();
    return NAV_MAP.get(prefix) ?? null;
  } catch {
    return null;
  }
}

/**
 * Locale Detection Priority Chain (doc-loc1n.md §5.1):
 * URL param > Cookie > LocalStorage > Telegram WebApp > navigator.language > DEFAULT
 *
 * This is a pure utility — no React, no Redux.
 * Redux is the source of truth after initial detection.
 */
export function detectLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // 1. URL search param ?lang=de
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (isSupportedLocale(urlLang)) return urlLang;
  } catch { /* ignore */ }

  // 2. HTTP Cookie (set by Edge Worker or previous session)
  const cookie = readCookie();
  if (isSupportedLocale(cookie)) return cookie;

  // 3. LocalStorage (client-side persistence)
  const stored = readStorage();
  if (isSupportedLocale(stored)) return stored;

  // 4. Telegram WebApp initData language_code
  const tg = readTelegramLocale();
  if (isSupportedLocale(tg)) return tg;

  // 5. navigator.language
  const nav = readNavigatorLocale();
  if (isSupportedLocale(nav)) return nav;

  return DEFAULT_LOCALE;
}

export function persistLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch { /* ignore */ }
}
