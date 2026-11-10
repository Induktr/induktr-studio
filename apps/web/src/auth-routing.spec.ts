import { beforeEach, describe, expect, it } from 'vitest';
import {
  CHECK_USER_EXISTS_QUERY,
  REGISTER_USER_MUTATION,
  AUTHENTICATE_WITH_TELEGRAM_MUTATION,
} from './shared/api';
import { store } from './app/store';
import {
  logout,
  setCredentials,
  setAuthMethod,
  setUserExistence,
  selectIsAuthenticated,
  selectAuthUser,
  selectUserExistsInDb,
  selectAuthMethod,
} from './app/store/auth-slice';
import {
  DbVerificationSchema,
  TokenFormSchema,
  QuickRegisterSchema,
} from './pages/auth/model/auth-schema';
import {
  createNavigationStore,
  PUBLIC_TABS,
  PROTECTED_TABS,
  isProtectedTab,
  isPublicTab,
} from './app/model/navigation-store';

describe('Auth Redirection & Database Existence Gating (ЗЮНУ, ИСРМО, ОБТНП)', () => {
  beforeEach(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      const storage = new Map<string, string>();
      globalThis.localStorage = {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, String(v)),
        removeItem: (k: string) => storage.delete(k),
        clear: () => storage.clear(),
        key: (i: number) => Array.from(storage.keys())[i] ?? null,
        length: 0,
      } as Storage;
    } else {
      globalThis.localStorage.clear();
    }
    store.dispatch(logout());
  });

  it('contains valid GraphQL queries and mutations for database existence checking', () => {
    expect(CHECK_USER_EXISTS_QUERY).toContain('query CheckUserExists');
    expect(CHECK_USER_EXISTS_QUERY).toContain('checkUserExists(identifier: $identifier)');
    expect(REGISTER_USER_MUTATION).toContain('mutation RegisterUser');
    expect(REGISTER_USER_MUTATION).toContain('registerUser(input: $input)');
    expect(AUTHENTICATE_WITH_TELEGRAM_MUTATION).toContain('mutation AuthenticateWithTelegram');
  });

  it('defines public and protected tab partitions correctly', () => {
    expect(PUBLIC_TABS).toEqual([
      'studio',
      'store',
      'cases',
      'systems',
      'knowledge',
      'intake',
      'auth',
    ]);
    expect(PROTECTED_TABS).toEqual(['client-hub']);
    expect(isProtectedTab('client-hub')).toBe(true);
    expect(isProtectedTab('studio')).toBe(false);
    expect(isProtectedTab('store')).toBe(false);
    expect(isProtectedTab('cases')).toBe(false);
    expect(isPublicTab('studio')).toBe(true);
    expect(isPublicTab('store')).toBe(true);
    expect(isPublicTab('cases')).toBe(true);
    expect(isPublicTab('client-hub')).toBe(false);
  });

  it('permits unauthenticated navigation on public tabs and guards protected tabs with redirect to auth', () => {
    const navStore = createNavigationStore();
    const snapshot = navStore.getSnapshot();

    // Default snapshot for unauthenticated visitor must be 'auth'
    expect(snapshot.tab).toBe('auth');

    // Unauthenticated visitors CAN freely browse public tabs
    navStore.navigate('studio');
    expect(navStore.getSnapshot().tab).toBe('studio');

    navStore.navigate('store');
    expect(navStore.getSnapshot().tab).toBe('store');

    navStore.navigate('cases');
    expect(navStore.getSnapshot().tab).toBe('cases');

    navStore.navigate('systems');
    expect(navStore.getSnapshot().tab).toBe('systems');

    navStore.navigate('knowledge');
    expect(navStore.getSnapshot().tab).toBe('knowledge');

    navStore.navigate('intake');
    expect(navStore.getSnapshot().tab).toBe('intake');

    // Attempting to navigate to protected 'client-hub' without auth redirects to 'auth'
    navStore.navigate('client-hub');
    expect(navStore.getSnapshot().tab).toBe('auth');
  });

  it('sets redirect query parameter when unauthenticated navigation to protected tab occurs with window', () => {
    const originalWindow = globalThis.window;
    try {
      const mockLocation = new URL('http://localhost:3000/?tab=auth');
      const mockHistory: string[] = [];
      (globalThis as unknown as { window: unknown }).window = {
        location: mockLocation,
        history: {
          pushState: (_state: unknown, _title: string, url: string) => {
            mockHistory.push(url);
            mockLocation.href = url;
          },
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      const navStore = createNavigationStore();
      navStore.navigate('client-hub');
      expect(navStore.getSnapshot().tab).toBe('auth');
      expect(mockLocation.searchParams.get('redirect')).toBe('client-hub');
      expect(mockLocation.searchParams.get('tab')).toBe('auth');
    } finally {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  });

  it('permits access to client hub once token exists in session storage', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('induktr_auth_token', 'test_verified_jwt_token');
    }

    const navStore = createNavigationStore();
    navStore.navigate('client-hub');
    expect(navStore.getSnapshot().tab).toBe('client-hub');

    navStore.navigate('systems');
    expect(navStore.getSnapshot().tab).toBe('systems');
  });

  it('manages database existence state via Redux atomic selectors', () => {
    expect(selectIsAuthenticated(store.getState())).toBe(false);
    expect(selectUserExistsInDb(store.getState())).toBeNull();

    // 1. Simulating User Exists in DB
    store.dispatch(setUserExistence({ exists: true, identifier: 'alexmorgan' }));
    expect(selectUserExistsInDb(store.getState())).toBe(true);

    store.dispatch(
      setCredentials({
        token: 'ind_session_verified',
        user: {
          id: 'uuid-founder',
          telegramId: '123456789',
          username: 'alexmorgan',
          firstName: 'Alex Morgan',
          role: 'CLIENT',
          createdAt: new Date().toISOString(),
        },
      }),
    );
    expect(selectIsAuthenticated(store.getState())).toBe(true);
    expect(selectAuthUser(store.getState())?.username).toBe('alexmorgan');

    // 2. Simulating User Does NOT Exist in DB (Onboarding Flow)
    store.dispatch(logout());
    store.dispatch(setUserExistence({ exists: false, identifier: 'unregistered_visitor' }));
    expect(selectIsAuthenticated(store.getState())).toBe(false);
    expect(selectUserExistsInDb(store.getState())).toBe(false);
  });

  it('switches auth methods reactively via Redux', () => {
    expect(selectAuthMethod(store.getState())).toBe('telegram');

    store.dispatch(setAuthMethod('verify-db'));
    expect(selectAuthMethod(store.getState())).toBe('verify-db');

    store.dispatch(setAuthMethod('demo'));
    expect(selectAuthMethod(store.getState())).toBe('demo');

    store.dispatch(setAuthMethod('token'));
    expect(selectAuthMethod(store.getState())).toBe('token');
  });

  it('validates auth schemas strictly with Zod', () => {
    // DbVerificationSchema
    expect(DbVerificationSchema.safeParse({ identifier: 'alexmorgan' }).success).toBe(true);
    expect(DbVerificationSchema.safeParse({ identifier: 'a' }).success).toBe(false);

    // TokenFormSchema
    expect(TokenFormSchema.safeParse({ sessionToken: 'ind_session_12345678' }).success).toBe(true);
    expect(TokenFormSchema.safeParse({ sessionToken: 'short' }).success).toBe(false);

    // QuickRegisterSchema
    expect(
      QuickRegisterSchema.safeParse({
        username: 'founder_alex',
        firstName: 'Alex',
        email: 'alex@orbit.build',
      }).success,
    ).toBe(true);

    expect(
      QuickRegisterSchema.safeParse({
        username: 'ab',
        firstName: 'Alex',
        email: 'not-an-email',
      }).success,
    ).toBe(false);
  });
});
