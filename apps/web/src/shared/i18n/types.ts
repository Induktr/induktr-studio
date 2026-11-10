import type enDict from './locales/en.json';

export type SupportedLocale = 'en' | 'ua' | 'de' | 'ar' | 'es';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'ua', 'de', 'ar', 'es'] as const;
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const RTL_LOCALES: ReadonlySet<SupportedLocale> = new Set(['ar'] as const);

/**
 * BCP-47 mapping: internal locale code → HTML lang attribute + Intl API code
 */
export const LOCALE_TO_BCP47: Record<SupportedLocale, string> = {
  en: 'en',
  ua: 'uk',
  de: 'de',
  ar: 'ar',
  es: 'es',
} as const;

/**
 * Recursive dot-notated path extractor — derives all possible translation keys
 * from the canonical en.json schema. TypeScript resolves these at compile time.
 */
export type NestedKeyOf<T extends object> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : `${K}`;
}[keyof T & (string | number)];

export type TranslationSchema = typeof enDict;
export type TranslationKey = NestedKeyOf<TranslationSchema>;

/**
 * Strict parity type: each locale dictionary must cover 100% of keys from en.json.
 * Any divergence in nesting or key names causes a TypeScript compilation error.
 */
export type LocaleDictionary = {
  [K in keyof TranslationSchema]: TranslationSchema[K];
};
