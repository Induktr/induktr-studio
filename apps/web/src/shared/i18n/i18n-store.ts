import { useSyncExternalStore } from 'react';
import type { SupportedLocale, TranslationKey, TranslationSchema } from './types';
import { DEFAULT_LOCALE } from './types';
import enDict from './locales/en.json';
import { applyDocumentDirection } from './rtl-manager';
import { persistLocale } from './locale-detector';
import { store } from '../../app/store';
import { setLocale, setLocaleReady, setLocaleError } from '../../app/store/i18n-slice';
import { createCompositeSignal } from '../lib/async';

export interface I18nSnapshot {
  readonly locale: SupportedLocale;
  readonly isRTL: boolean;
  readonly isLoading: boolean;
  readonly version: number;
}

const LOCALE_LOADERS: Record<SupportedLocale, () => Promise<{ default: TranslationSchema }>> = {
  en: () => Promise.resolve({ default: enDict }),
  ua: () => import('./locales/ua.json'),
  de: () => import('./locales/de.json'),
  ar: () => import('./locales/ar.json'),
  es: () => import('./locales/es.json'),
};

const dictionaryCache = new Map<SupportedLocale, TranslationSchema>();
dictionaryCache.set('en', enDict);

function flattenDictionary(
  dict: unknown,
  prefix = '',
  targetMap = new Map<string, string>()
): Map<string, string> {
  if (dict && typeof dict === 'object') {
    for (const [k, v] of Object.entries(dict)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        flattenDictionary(v, fullKey, targetMap);
      } else if (typeof v === 'string') {
        targetMap.set(fullKey, v);
      }
    }
  }
  return targetMap;
}

const flattenedCache = new Map<SupportedLocale, Map<string, string>>();
const enFlattened = flattenDictionary(enDict);
flattenedCache.set('en', enFlattened);

let currentLocale: SupportedLocale = DEFAULT_LOCALE;
let previousLocale: SupportedLocale = DEFAULT_LOCALE;
let currentDictionary: TranslationSchema = enDict;
let previousDictionary: TranslationSchema = enDict;
let currentFlattened = enFlattened;
let previousFlattened = enFlattened;
let isLoading = false;
let snapshotVersion = 0;

const listeners = new Set<() => void>();

/**
 * Static frozen server snapshot for SSR / hydration consistency.
 */
const SERVER_SNAPSHOT: I18nSnapshot = Object.freeze({
  locale: DEFAULT_LOCALE,
  isRTL: false,
  isLoading: false,
  version: 0,
});

/**
 * Module-level cached snapshot reference.
 * React 18/19 useSyncExternalStore mandates that getSnapshot() returns the exact
 * same object reference on subsequent calls unless a store mutation occurred.
 * This completely prevents "The result of getSnapshot should be cached to avoid an infinite loop"
 * and "Maximum update depth exceeded".
 */
let currentSnapshot: I18nSnapshot = Object.freeze({
  locale: DEFAULT_LOCALE,
  isRTL: false,
  isLoading: false,
  version: 0,
});

/**
 * Module-level AbortController for cancelling in-flight async transitions
 * during rapid locale switching to prevent race conditions & async re-render collisions.
 */
let currentAbortController: AbortController | null = null;

function updateSnapshot(patch?: Partial<Omit<I18nSnapshot, 'version'>>): void {
  snapshotVersion++;
  const nextLocale = patch?.locale ?? currentLocale;
  const nextLoading = patch?.isLoading ?? isLoading;

  currentSnapshot = Object.freeze({
    locale: nextLocale,
    isRTL: nextLocale === 'ar',
    isLoading: nextLoading,
    version: snapshotVersion,
  });

  for (const listener of listeners) {
    listener();
  }
}

/**
 * Functional i18n External Store (ЗЮНУ Architecture Standard)
 * Provides synchronous, tear-free cached snapshots for React 19 components.
 * Guarantees zero re-renders on static keys and instant fallbacks.
 */
export const i18nStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): I18nSnapshot {
    return currentSnapshot;
  },

  getServerSnapshot(): I18nSnapshot {
    return SERVER_SNAPSHOT;
  },

  getCurrentLocale(): SupportedLocale {
    return currentLocale;
  },

  getCurrentDictionary(): TranslationSchema {
    return currentDictionary;
  },

  /**
   * Explicitly abort any pending asynchronous locale transition.
   */
  abort(): void {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      if (isLoading) {
        isLoading = false;
        updateSnapshot({ locale: currentLocale, isLoading: false });
      }
    }
  },

  /**
   * Deterministic Locale Switcher with State Synchronization and AbortController (ОБТНП Standard)
   * Cancels any in-flight dynamic imports if a new locale is requested,
   * eliminating race conditions and unwanted async state flushes.
   */
  async switchLocale(targetLocale: SupportedLocale): Promise<void> {
    if (targetLocale === currentLocale && dictionaryCache.has(targetLocale) && !isLoading) {
      return;
    }

    // Cancel any previous in-flight transition
    if (currentAbortController) {
      currentAbortController.abort();
    }
    const controller = new AbortController();
    currentAbortController = controller;
    const { signal, cleanup } = createCompositeSignal(controller.signal, 8000);

    isLoading = true;
    store.dispatch(setLocale(targetLocale));
    updateSnapshot({ locale: targetLocale, isLoading: true });

    try {
      let dict = dictionaryCache.get(targetLocale);
      let flatMap = flattenedCache.get(targetLocale);
      if (!dict || !flatMap) {
        const loader = LOCALE_LOADERS[targetLocale];
        if (!loader) {
          throw new Error(`No loader configured for locale: ${targetLocale}`);
        }
        const module = await loader();
        if (signal.aborted) {
          return;
        }
        dict = module.default;
        flatMap = flattenDictionary(dict);
        dictionaryCache.set(targetLocale, dict);
        flattenedCache.set(targetLocale, flatMap);
      }

      if (signal.aborted) {
        return;
      }

      // Commit successful state transition
      previousLocale = currentLocale;
      previousDictionary = currentDictionary;
      previousFlattened = currentFlattened;
      currentLocale = targetLocale;
      currentDictionary = dict;
      currentFlattened = flatMap;
      isLoading = false;

      // Synchronize DOM physics and persistence
      applyDocumentDirection(targetLocale);
      persistLocale(targetLocale);

      // Synchronize Redux
      store.dispatch(setLocaleReady());
      updateSnapshot({ locale: targetLocale, isLoading: false });
    } catch (err: unknown) {
      if (signal.aborted) {
        return;
      }

      // Deterministic recovery: revert to previous valid state
      console.warn(`[i18n] Failed to load locale "${targetLocale}", falling back to "${previousLocale}"`, err);

      currentLocale = previousLocale;
      currentDictionary = previousDictionary;
      currentFlattened = previousFlattened;
      isLoading = false;

      applyDocumentDirection(previousLocale);
      store.dispatch(setLocaleError());
      updateSnapshot({ locale: previousLocale, isLoading: false });
    } finally {
      cleanup();
      if (currentAbortController === controller) {
        currentAbortController = null;
      }
    }
  },

  /**
   * O(1) Translation Key Resolver with Flattened Dictionary Cache (ЗЮНУ Architecture Standard)
   * Key resolution order: Current Flattened Map -> Previous Flattened Map -> Canonical English Map -> Raw Key
   */
  translate(key: TranslationKey, params?: Record<string, string | number>): string {
    const keyStr = key as string;
    const raw =
      currentFlattened.get(keyStr) ??
      previousFlattened.get(keyStr) ??
      enFlattened.get(keyStr) ??
      keyStr;

    if (!params) {
      return raw;
    }

    return raw.replace(/{([^{}]+)}/g, (_, name) => {
      return params && Object.hasOwn(params, name) ? String(params[name]) : `{${name}}`;
    });
  },
};

export function useI18nSnapshot(): I18nSnapshot {
  return useSyncExternalStore(
    i18nStore.subscribe,
    i18nStore.getSnapshot,
    i18nStore.getServerSnapshot,
  );
}
