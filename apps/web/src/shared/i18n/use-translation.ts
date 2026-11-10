import { useCallback } from 'react';
import type { TranslationKey, SupportedLocale } from './types';
import { useI18nSnapshot, i18nStore } from './i18n-store';
import { formatCurrency, formatNumber, resolvePluralCategory } from './intl-formatters';

/**
 * useTranslation Hook (ВФОХУ Standard)
 * Provides reactive translation strings via useSyncExternalStore (ЗЮНУ).
 * No React context re-renders on static keys; deterministic O(1) lookups.
 */
export function useTranslation() {
  const snapshot = useI18nSnapshot();

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      return i18nStore.translate(key, params);
    },
    [],
  );

  const formatCurr = useCallback(
    (amount: number, currency: 'USD' | 'EUR' | 'AED' | 'UAH' = 'USD'): string => {
      return formatCurrency(amount, snapshot.locale, currency);
    },
    [snapshot.locale],
  );

  const formatNum = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      return formatNumber(value, snapshot.locale, options);
    },
    [snapshot.locale],
  );

  const plural = useCallback(
    (count: number): Intl.LDMLPluralRule => {
      return resolvePluralCategory(count, snapshot.locale);
    },
    [snapshot.locale],
  );

  return {
    t,
    locale: snapshot.locale,
    isRTL: snapshot.isRTL,
    isLoading: snapshot.isLoading,
    formatCurrency: formatCurr,
    formatNumber: formatNum,
    resolvePlural: plural,
  };
}

/**
 * useLocale Hook (ВФОХУ Standard)
 * Controls switching locales with deterministic state recovery and persistence.
 */
export function useLocale() {
  const snapshot = useI18nSnapshot();

  const switchLocale = useCallback((target: SupportedLocale) => {
    void i18nStore.switchLocale(target);
  }, []);

  const abort = useCallback(() => {
    i18nStore.abort();
  }, []);

  return {
    locale: snapshot.locale,
    isRTL: snapshot.isRTL,
    isLoading: snapshot.isLoading,
    switchLocale,
    abort,
  };
}
