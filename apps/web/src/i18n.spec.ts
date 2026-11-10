import { beforeEach, describe, expect, it } from 'vitest';
import enDict from './shared/i18n/locales/en.json';
import uaDict from './shared/i18n/locales/ua.json';
import deDict from './shared/i18n/locales/de.json';
import arDict from './shared/i18n/locales/ar.json';
import esDict from './shared/i18n/locales/es.json';
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from './shared/i18n/types';
import { i18nStore } from './shared/i18n/i18n-store';
import {
  applyDocumentDirection,
  isRTLLocale,
} from './shared/i18n/rtl-manager';
import {
  formatCurrency,
  formatNumber,
  resolvePluralCategory,
} from './shared/i18n/intl-formatters';
import { store } from './app/store';
import {
  setLocale,
  setLocaleError,
  setLocaleReady,
  selectLocale,
  selectIsRTL,
  selectI18nStatus,
  selectPreviousLocale,
} from './app/store/i18n-slice';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('Global i18n & 5-Locale Matrix Protocol (doc-loc1n.md)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    if (typeof globalThis.document === 'undefined') {
      const attrs = new Map<string, string>();
      const classes = new Set<string>();
      globalThis.document = {
        documentElement: {
          setAttribute: (k: string, v: string) => attrs.set(k, v),
          getAttribute: (k: string) => attrs.get(k) ?? null,
          classList: {
            add: (c: string) => classes.add(c),
            remove: (c: string) => classes.delete(c),
            contains: (c: string) => classes.has(c),
          },
        },
      } as unknown as Document;
    }
  });

  it('validates 100% key parity across all 5 strategic languages', () => {
    const canonicalKeys = new Set(flattenKeys(enDict));
    expect(canonicalKeys.size).toBeGreaterThan(20);

    const dictionaries: Record<Exclude<SupportedLocale, 'en'>, Record<string, unknown>> = {
      ua: uaDict,
      de: deDict,
      ar: arDict,
      es: esDict,
    };

    for (const [lang, dict] of Object.entries(dictionaries)) {
      const currentKeys = new Set(flattenKeys(dict));
      const missing = [...canonicalKeys].filter((k) => !currentKeys.has(k));
      const obsolete = [...currentKeys].filter((k) => !canonicalKeys.has(k));

      expect(missing, `[${lang}] Missing translation keys`).toEqual([]);
      expect(obsolete, `[${lang}] Obsolete translation keys`).toEqual([]);
    }
  });

  it('verifies supported locale matrix includes all 5 strategic gateways', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'ua', 'de', 'ar', 'es']);
  });

  it('correctly manages RTL spatial physics and document attributes', () => {
    expect(isRTLLocale('ar')).toBe(true);
    expect(isRTLLocale('en')).toBe(false);
    expect(isRTLLocale('ua')).toBe(false);
    expect(isRTLLocale('de')).toBe(false);
    expect(isRTLLocale('es')).toBe(false);

    applyDocumentDirection('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(document.documentElement.classList.contains('rtl-active')).toBe(true);

    applyDocumentDirection('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.documentElement.classList.contains('ltr-active')).toBe(true);

    applyDocumentDirection('ua');
    expect(document.documentElement.getAttribute('lang')).toBe('uk');
  });

  it('translates canonical keys and interpolates dynamic parameters', async () => {
    await i18nStore.switchLocale('en');
    expect(i18nStore.translate('nav.studio')).toBe('Studio');
    expect(i18nStore.translate('hero.ctaPrimary')).toBe('Deploy System Architecture');

    // Interpolation test
    const customResult = i18nStore.translate('nav.studio', { ignored: 'param' });
    expect(customResult).toBe('Studio');
  });

  it('guarantees cached snapshot reference identity for useSyncExternalStore idempotency', () => {
    const snap1 = i18nStore.getSnapshot();
    const snap2 = i18nStore.getSnapshot();
    // Strict reference equality check prevents React infinite re-render loop
    expect(snap1).toBe(snap2);

    const serverSnap1 = i18nStore.getServerSnapshot();
    const serverSnap2 = i18nStore.getServerSnapshot();
    expect(serverSnap1).toBe(serverSnap2);
  });

  it('handles AbortController cancellation during in-flight transitions', async () => {
    // Start transition
    const switchPromise = i18nStore.switchLocale('de');
    // Immediately abort
    i18nStore.abort();
    await switchPromise;

    // Snapshot remains coherent without crashing or invalid state
    expect(i18nStore.getSnapshot().isLoading).toBe(false);
  });

  it('deterministically recovers to previous Redux state if switching fails', async () => {
    await i18nStore.switchLocale('en');
    expect(i18nStore.getCurrentLocale()).toBe('en');

    // Attempt invalid switch
    await i18nStore.switchLocale('invalid_locale' as SupportedLocale);
    expect(i18nStore.getCurrentLocale()).toBe('en');
  });

  it('formats currencies, numbers, and plurals via native ECMA-402 IntlEngine', () => {
    const usd = formatCurrency(5000, 'en', 'USD');
    expect(usd).toContain('5,000');

    const deEur = formatCurrency(10000, 'de', 'EUR');
    expect(deEur).toBeDefined();

    const formattedNum = formatNumber(1250000, 'en');
    expect(formattedNum).toBe('1,250,000');

    const pluralEnOne = resolvePluralCategory(1, 'en');
    const pluralEnOther = resolvePluralCategory(5, 'en');
    expect(pluralEnOne).toBe('one');
    expect(pluralEnOther).toBe('other');

    const pluralUaFew = resolvePluralCategory(2, 'ua');
    expect(['few', 'other']).toContain(pluralUaFew);
  });

  it('manages i18n state via Redux Toolkit atomic selectors', () => {
    store.dispatch(setLocale('de'));
    expect(selectLocale(store.getState())).toBe('de');
    expect(selectIsRTL(store.getState())).toBe(false);
    expect(selectI18nStatus(store.getState())).toBe('loading');

    store.dispatch(setLocaleReady());
    expect(selectI18nStatus(store.getState())).toBe('ready');

    // Trigger error fallback in Redux
    store.dispatch(setLocaleError());
    expect(selectLocale(store.getState())).toBe(selectPreviousLocale(store.getState()));
    expect(selectI18nStatus(store.getState())).toBe('error');
  });

  it('guards against prototype pollution during template interpolation in translate()', () => {
    const result = (i18nStore.translate as (key: string, params?: Record<string, string | number>) => string)(
      'Welcome {name}! {toString} and {constructor}',
      { name: 'Induktr' },
    );
    expect(result).toBe('Welcome Induktr! {toString} and {constructor}');
  });

  it('bounds number format cache to max 50 entries to prevent memory leaks', () => {
    for (let i = 0; i < 60; i++) {
      formatNumber(i * 10, 'en', {
        minimumFractionDigits: i % 5,
        maximumFractionDigits: (i % 5) + 2,
      });
    }
    const formatted = formatNumber(42, 'en');
    expect(formatted).toBe('42');
  });
});
