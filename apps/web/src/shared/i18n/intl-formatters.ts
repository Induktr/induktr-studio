import type { SupportedLocale } from './types';
import { LOCALE_TO_BCP47 } from './types';

const MAX_NUMBER_FORMAT_CACHE_SIZE = 50;
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const pluralRulesCache = new Map<string, Intl.PluralRules>();

function getOrCreateNumberFormat(
  cacheKey: string,
  factory: () => Intl.NumberFormat,
): Intl.NumberFormat {
  const existing = numberFormatCache.get(cacheKey);
  if (existing) {
    // Refresh entry for LRU cache ordering
    numberFormatCache.delete(cacheKey);
    numberFormatCache.set(cacheKey, existing);
    return existing;
  }

  if (numberFormatCache.size >= MAX_NUMBER_FORMAT_CACHE_SIZE) {
    const oldestKey = numberFormatCache.keys().next().value;
    if (oldestKey !== undefined) {
      numberFormatCache.delete(oldestKey);
    }
  }

  const created = factory();
  numberFormatCache.set(cacheKey, created);
  return created;
}

/**
 * Functional Intl Formatter Engine (ECMA-402 Native Standard)
 * Replaces heavy ICU libraries with browser-native, zero-bundle implementations.
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale,
  currency: 'USD' | 'EUR' | 'AED' | 'UAH' = 'USD',
): string {
  const bcp47 = LOCALE_TO_BCP47[locale] ?? 'en';
  const cacheKey = `${bcp47}-${currency}`;

  const formatter = getOrCreateNumberFormat(cacheKey, () => {
    return new Intl.NumberFormat(locale === 'ua' ? 'uk-UA' : bcp47, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  });

  return formatter.format(amount);
}

export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions,
): string {
  const bcp47 = LOCALE_TO_BCP47[locale] ?? 'en';
  const cacheKey = `${bcp47}-${JSON.stringify(options ?? {})}`;

  const formatter = getOrCreateNumberFormat(cacheKey, () => {
    return new Intl.NumberFormat(locale === 'ua' ? 'uk-UA' : bcp47, options);
  });

  return formatter.format(value);
}

export function resolvePluralCategory(
  count: number,
  locale: SupportedLocale,
): Intl.LDMLPluralRule {
  const bcp47 = LOCALE_TO_BCP47[locale] ?? 'en';

  let rules = pluralRulesCache.get(bcp47);
  if (!rules) {
    rules = new Intl.PluralRules(locale === 'ua' ? 'uk' : bcp47);
    pluralRulesCache.set(bcp47, rules);
  }

  return rules.select(count);
}
