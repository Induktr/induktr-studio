import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { AppTab } from '@/shared/lib/url';

export type { AppTab };

export interface NavigationState {
  activeTab: AppTab;
}

const initialState: NavigationState = {
  activeTab: 'studio',
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<AppTab>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = navigationSlice.actions;
export const navigationReducer = navigationSlice.reducer;

// Atomic Selectors (ИСРМО standard)
export const selectActiveTab = (state: RootState): AppTab => state.navigation.activeTab;

export const selectFooterSubtext = (state: RootState): string => {
  const activeTab = state.navigation.activeTab;
  const user = state.auth.user;

  switch (activeTab) {
    case 'store':
    case 'knowledge':
      return 'INDUKTR® / KNOWLEDGE IS THE HIGHEST-LEVERAGE DEPENDENCY.';
    case 'cases':
      return 'INDUKTR® / PROVEN ARCHITECTURES & LAB JOURNAL.';
    case 'client-hub':
      return user
        ? `INDUKTR® / PRIVATE CLIENT WORKSPACE / ${user.firstName?.toUpperCase() || user.username?.toUpperCase() || 'STUDIO CLIENT'}`
        : 'INDUKTR® / PRIVATE CLIENT WORKSPACE / STUDIO CLIENT';
    case 'auth':
      return 'INDUKTR® / CRYPTOGRAPHIC SOVEREIGN GATEWAY / ZERO-TRUST';
    default:
      return 'INDUKTR® / ENGINEERED IN THE LAB. BUILT FOR THE FIELD.';
  }
};
