import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { SupportedLocale, TranslationSchema } from '../../shared/i18n/types';
import { DEFAULT_LOCALE } from '../../shared/i18n/types';
import { isRTLLocale } from '../../shared/i18n/rtl-manager';

export interface I18nState {
  /**
   * Active locale code. This is the Redux source of truth.
   * External store (useSyncExternalStore) reads from here as a fallback
   * to guarantee determinism even if the async chunk load fails.
   */
  locale: SupportedLocale;
  /**
   * Computed RTL flag — derived from locale, stored so selectors are O(1).
   */
  isRTL: boolean;
  /**
   * Status of the async dictionary chunk load.
   * 'idle' → initial boot, 'loading' → chunk in flight, 'ready' → chunk mounted.
   */
  status: 'idle' | 'loading' | 'ready' | 'error';
  /**
   * Previous locale that had a successfully loaded dictionary.
   * Used as deterministic fallback if the new chunk fails to load.
   */
  previousLocale: SupportedLocale;
}

const initialState: I18nState = {
  locale: DEFAULT_LOCALE,
  isRTL: false,
  status: 'idle',
  previousLocale: DEFAULT_LOCALE,
};

export const i18nSlice = createSlice({
  name: 'i18n',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.previousLocale = state.locale;
      state.locale = action.payload;
      state.isRTL = isRTLLocale(action.payload);
      state.status = 'loading';
    },
    setLocaleReady: (state) => {
      state.status = 'ready';
    },
    setLocaleError: (state) => {
      // Deterministic fallback: revert to previousLocale that had a valid dictionary
      state.locale = state.previousLocale;
      state.isRTL = isRTLLocale(state.previousLocale);
      state.status = 'error';
    },
    /** Called on initial boot once detectLocale() runs synchronously */
    initLocale: (state, action: PayloadAction<SupportedLocale>) => {
      state.locale = action.payload;
      state.previousLocale = action.payload;
      state.isRTL = isRTLLocale(action.payload);
      state.status = 'loading';
    },
  },
});

export const { setLocale, setLocaleReady, setLocaleError, initLocale } = i18nSlice.actions;
export const i18nReducer = i18nSlice.reducer;

// Atomic Selectors (ИСРМО Standard)
export const selectLocale = (state: RootState): SupportedLocale => state.i18n.locale;
export const selectIsRTL = (state: RootState): boolean => state.i18n.isRTL;
export const selectI18nStatus = (state: RootState): I18nState['status'] => state.i18n.status;
export const selectPreviousLocale = (state: RootState): SupportedLocale => state.i18n.previousLocale;

/**
 * Selector for use with useSyncExternalStore (ЗЮНУ).
 * Returns a stable snapshot tuple [locale, isRTL] only re-emitting
 * on actual locale changes.
 */
export const selectI18nSnapshot = (
  state: RootState,
): { locale: SupportedLocale; isRTL: boolean } => ({
  locale: state.i18n.locale,
  isRTL: state.i18n.isRTL,
});

// Declare this shape for external store usage in use-translation.ts
export type I18nDictionaryRef = {
  locale: SupportedLocale;
  dictionary: TranslationSchema | null;
};
