import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { CachedLeadData } from '@/features/lead-submission/lib/lead-cache';

export interface LeadState {
  activeLead: CachedLeadData | null;
  currentSlug: string | null;
  isRehydrating: boolean;
  leadNotFound: boolean;
  errorMessage: string | null;
  copiedLink: boolean;
}

const initialState: LeadState = {
  activeLead: null,
  currentSlug: null,
  isRehydrating: false,
  leadNotFound: false,
  errorMessage: null,
  copiedLink: false,
};

export const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    setSlug: (state, action: PayloadAction<string | null>) => {
      state.currentSlug = action.payload;
    },
    setActiveLead: (state, action: PayloadAction<CachedLeadData | null>) => {
      state.activeLead = action.payload;
      state.isRehydrating = false;
      state.leadNotFound = false;
    },
    setRehydrating: (state, action: PayloadAction<boolean>) => {
      state.isRehydrating = action.payload;
    },
    setLeadNotFound: (state, action: PayloadAction<boolean>) => {
      state.leadNotFound = action.payload;
      state.isRehydrating = false;
    },
    setErrorMessage: (state, action: PayloadAction<string | null>) => {
      state.errorMessage = action.payload;
    },
    setCopiedLink: (state, action: PayloadAction<boolean>) => {
      state.copiedLink = action.payload;
    },
    resetLeadState: (state) => {
      state.activeLead = null;
      state.currentSlug = null;
      state.isRehydrating = false;
      state.leadNotFound = false;
      state.errorMessage = null;
      state.copiedLink = false;
    },
  },
});

export const {
  setSlug,
  setActiveLead,
  setRehydrating,
  setLeadNotFound,
  setErrorMessage,
  setCopiedLink,
  resetLeadState,
} = leadSlice.actions;

export const leadReducer = leadSlice.reducer;

// Atomic Selectors (ИСРМО standard)
export const selectActiveLead = (state: RootState) => state.lead.activeLead;
export const selectCurrentLeadSlug = (state: RootState) => state.lead.currentSlug;
export const selectIsRehydrating = (state: RootState) => state.lead.isRehydrating;
export const selectLeadNotFound = (state: RootState) => state.lead.leadNotFound;
export const selectLeadErrorMessage = (state: RootState) => state.lead.errorMessage;
export const selectIsLinkCopied = (state: RootState) => state.lead.copiedLink;
