import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '@induktr/contracts';
import type { RootState } from './index';

export type AuthMethod = 'telegram' | 'demo' | 'token' | 'verify-db';

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  authMethod: AuthMethod;
  userExistsInDb: boolean | null;
  verifiedIdentifier: string | null;
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('induktr_auth_token');
  } catch {
    return null;
  }
};

const getStoredUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('induktr_auth_user');
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
};

const initialToken = getStoredToken();
const initialUser = getStoredUser();

const initialState: AuthState = {
  token: initialToken,
  user: initialUser,
  isAuthenticated: Boolean(initialToken),
  status: 'idle',
  error: null,
  authMethod: 'telegram',
  userExistsInDb: initialToken ? true : null,
  verifiedIdentifier: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.status = 'succeeded';
      state.error = null;
      state.userExistsInDb = true;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('induktr_auth_token', action.payload.token);
          localStorage.setItem('induktr_auth_user', JSON.stringify(action.payload.user));
        } catch {
          // ignore localStorage quota exceptions
        }
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      state.userExistsInDb = null;
      state.verifiedIdentifier = null;

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('induktr_auth_token');
          localStorage.removeItem('induktr_auth_user');
        } catch {
          // ignore
        }
      }
    },
    setAuthStatus: (state, action: PayloadAction<'idle' | 'loading' | 'succeeded' | 'failed'>) => {
      state.status = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = 'failed';
    },
    resetAuthError: (state) => {
      state.error = null;
      if (state.status === 'failed') {
        state.status = 'idle';
      }
    },
    setAuthMethod: (state, action: PayloadAction<AuthMethod>) => {
      state.authMethod = action.payload;
      state.error = null;
    },
    setUserExistence: (
      state,
      action: PayloadAction<{ exists: boolean; identifier?: string | null }>,
    ) => {
      state.userExistsInDb = action.payload.exists;
      state.verifiedIdentifier = action.payload.identifier ?? null;
      state.status = 'idle';
    },
  },
});

export const {
  setCredentials,
  logout,
  setAuthStatus,
  setAuthError,
  resetAuthError,
  setAuthMethod,
  setUserExistence,
} = authSlice.actions;

export const authReducer = authSlice.reducer;

// Atomic Selectors (ИСРМО Standard)
export const selectIsAuthenticated = (state: RootState): boolean => state.auth.isAuthenticated;
export const selectAuthUser = (state: RootState): UserProfile | null => state.auth.user;
export const selectAuthToken = (state: RootState): string | null => state.auth.token;
export const selectAuthStatus = (state: RootState): 'idle' | 'loading' | 'succeeded' | 'failed' => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectAuthMethod = (state: RootState): AuthMethod => state.auth.authMethod;
export const selectUserExistsInDb = (state: RootState): boolean | null => state.auth.userExistsInDb;
export const selectVerifiedIdentifier = (state: RootState): string | null => state.auth.verifiedIdentifier;
