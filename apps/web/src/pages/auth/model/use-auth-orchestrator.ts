import { useCallback, useEffect } from 'react';
import { useClient, useMutation } from 'urql';
import type { UserProfile } from '@induktr/contracts';
import { useAppDispatch, useAppSelector } from '@/app/store';
import {
  type AuthMethod,
  resetAuthError,
  selectAuthError,
  selectAuthMethod,
  selectAuthStatus,
  selectUserExistsInDb,
  selectVerifiedIdentifier,
  setAuthError,
  setAuthMethod,
  setAuthStatus,
  setCredentials,
  setUserExistence,
} from '@/app/store/auth-slice';
import {
  AUTHENTICATE_WITH_TELEGRAM_MUTATION,
  CHECK_USER_EXISTS_QUERY,
  GENERATE_DEV_TELEGRAM_INIT_DATA_QUERY,
  LOGIN_AS_DEMO_FOUNDER_MUTATION,
  REGISTER_USER_MUTATION,
} from '@/shared/api/operations';
import { createCompositeSignal, useAbortController } from '@/shared/lib/async';
import { useAuthMethodQueryState } from '@/shared/lib/url';
import type { DbVerificationInput, QuickRegisterInput, TokenFormInput } from './auth-schema';

export interface UseAuthOrchestratorOptions {
  readonly onSuccessUserExists?: () => void;
  readonly onSuccessUserNotFound?: () => void;
}

const DEMO_CREATED_AT = '2026-10-23T12:00:00.000Z';

const DEMO_FOUNDER_USER: UserProfile = {
  id: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
  telegramId: '123456789',
  username: 'alexmorgan',
  firstName: 'Alex Morgan',
  email: 'alex@orbit.build',
  role: 'CLIENT',
  createdAt: DEMO_CREATED_AT,
};

/**
 * useAuthOrchestrator (ВФОХУ & ОБТНП Standard)
 * Isolates cryptographic handshakes, DB existence queries, and Redux commits.
 */
export function useAuthOrchestrator({
  onSuccessUserExists,
  onSuccessUserNotFound,
}: UseAuthOrchestratorOptions = {}) {
  const dispatch = useAppDispatch();
  const client = useClient();

  // 1. Redux Atomic Selectors (ИСРМО Standard)
  const status = useAppSelector(selectAuthStatus);
  const errorMessage = useAppSelector(selectAuthError);
  const authMethod = useAppSelector(selectAuthMethod);
  const userExistsInDb = useAppSelector(selectUserExistsInDb);
  const verifiedIdentifier = useAppSelector(selectVerifiedIdentifier);

  // 1.1 URL Query Sync via nuqs
  const [methodQuery, setMethodQuery] = useAuthMethodQueryState();

  // URL-to-Redux synchronization: external changes to ?method=... update Redux
  useEffect(() => {
    if (methodQuery && methodQuery !== authMethod) {
      dispatch(setAuthMethod(methodQuery));
    }
  }, [methodQuery, authMethod, dispatch]);

  const [, executeTgAuth] = useMutation(AUTHENTICATE_WITH_TELEGRAM_MUTATION);
  const [, executeRegister] = useMutation(REGISTER_USER_MUTATION);
  const [, executeLoginAsDemoFounder] = useMutation(LOGIN_AS_DEMO_FOUNDER_MUTATION);
  const authAbort = useAbortController();

  // 2. Cryptographic Telegram HMAC Handshake with AbortController (ОБТНП Standard)
  const handleTelegramAuth = useCallback((customInitData?: string) => {
    const controller = authAbort.renew();
    const { signal, cleanup } = createCompositeSignal(controller.signal, 10000);

    Promise.try(async () => {
      dispatch(setAuthStatus('loading'));
      dispatch(resetAuthError());

      interface TelegramWindow extends Window {
        Telegram?: {
          WebApp?: {
            initData?: string;
          };
        };
      }

      const realTgInitData =
        typeof window !== 'undefined'
          ? (window as unknown as TelegramWindow).Telegram?.WebApp?.initData
          : undefined;

      let initDataToUse = (typeof customInitData === 'string' && customInitData.trim())
        ? customInitData.trim()
        : realTgInitData;

      if (!initDataToUse) {
        // Fetch fresh valid dev signature from backend
        const genRes = await client.query(GENERATE_DEV_TELEGRAM_INIT_DATA_QUERY, {}).toPromise();
        if (genRes.data?.generateDevTelegramInitData) {
          initDataToUse = genRes.data.generateDevTelegramInitData;
        } else if (genRes.error) {
          throw new Error(`Failed to generate signed handshake: ${genRes.error.message}`);
        } else {
          throw new Error('Telegram runtime not detected. Please generate a signed dev handshake or run inside Telegram.');
        }
      }

      const result = await executeTgAuth(
        { input: { initData: initDataToUse } },
        { fetchOptions: { signal } },
      );

      if (signal.aborted) return;

      if (result.error) {
        throw new Error(result.error.message);
      }

      const payload = result.data?.authenticateWithTelegram;
      if (payload) {
        dispatch(
          setCredentials({
            token: payload.token,
            user: payload.user as UserProfile,
          }),
        );
        onSuccessUserExists?.();
      }
    }).catch((err: unknown) => {
      if (signal.aborted) return;
      const rawMsg = err instanceof Error ? err.message : 'Cryptographic authentication failed';
      const cleanMsg = rawMsg.includes('Failed to fetch')
        ? '[Network] API server unreachable. Ensure API is running on port 4000'
        : rawMsg;
      dispatch(setAuthError(cleanMsg));
    }).finally(() => {
      cleanup();
    });
  }, [authAbort, client, dispatch, executeTgAuth, onSuccessUserExists]);

  // 3. PostgreSQL Database Existence Verification with AbortController (ОБТНП Standard)
  const handleVerifyDbUser = useCallback((data: DbVerificationInput) => {
    const controller = authAbort.renew();
    const { signal, cleanup } = createCompositeSignal(controller.signal, 8000);

    Promise.try(async () => {
      dispatch(setAuthStatus('loading'));
      dispatch(resetAuthError());

      const result = await client
        .query(CHECK_USER_EXISTS_QUERY, { identifier: data.identifier }, { fetchOptions: { signal } })
        .toPromise();

      if (signal.aborted) return;

      if (result.error) {
        throw new Error(result.error.message);
      }

      const checkData = result.data?.checkUserExists;
      if (checkData?.exists && checkData.user) {
        dispatch(setUserExistence({ exists: true, identifier: data.identifier }));
        dispatch(
          setCredentials({
            token: 'ind_session_' + Date.now().toString(16),
            user: checkData.user as UserProfile,
          }),
        );
        onSuccessUserExists?.();
      } else {
        dispatch(setUserExistence({ exists: false, identifier: data.identifier }));
        onSuccessUserNotFound?.();
      }
    }).catch((err: unknown) => {
      if (signal.aborted) return;
      dispatch(setAuthError(err instanceof Error ? err.message : 'Database identity lookup failed'));
    }).finally(() => {
      cleanup();
    });
  }, [authAbort, client, dispatch, onSuccessUserExists, onSuccessUserNotFound]);

  // 4. Founder Gateway: Verified in Database (Alex Morgan)
  const handleDemoVerifiedAuth = useCallback(() => {
    const controller = authAbort.renew();
    const { signal, cleanup } = createCompositeSignal(controller.signal, 10000);

    Promise.try(async () => {
      dispatch(setAuthStatus('loading'));
      dispatch(resetAuthError());
      dispatch(setUserExistence({ exists: true, identifier: 'alexmorgan' }));

      const result = await executeLoginAsDemoFounder({}, { fetchOptions: { signal } });
      if (signal.aborted) return;

      if (result.error) {
        // Fallback to seeded demo token if offline or network error
        const demoToken = 'ind_session_7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a';
        dispatch(setCredentials({ token: demoToken, user: DEMO_FOUNDER_USER }));
        onSuccessUserExists?.();
        return;
      }

      const payload = result.data?.loginAsDemoFounder;
      if (payload) {
        dispatch(
          setCredentials({
            token: payload.token,
            user: payload.user as UserProfile,
          }),
        );
        onSuccessUserExists?.();
      }
    }).catch((err: unknown) => {
      if (signal.aborted) return;
      dispatch(setAuthError(err instanceof Error ? err.message : 'Founder gateway activation failed'));
    }).finally(() => {
      cleanup();
    });
  }, [authAbort, dispatch, executeLoginAsDemoFounder, onSuccessUserExists]);

  // 5. Founder Gateway: Unregistered Visitor (Not in Database)
  const handleDemoUnregisteredAuth = useCallback(() => {
    authAbort.abort();
    Promise.try(() => {
      dispatch(setAuthStatus('loading'));
      dispatch(setUserExistence({ exists: false, identifier: 'guest_unregistered' }));
      dispatch(setAuthStatus('idle'));
      onSuccessUserNotFound?.();
    }).catch((err: unknown) => {
      dispatch(setAuthError(err instanceof Error ? err.message : 'Guest simulation failed'));
    });
  }, [authAbort, dispatch, onSuccessUserNotFound]);

  // 6. Direct Bearer Token Login
  const handleTokenSubmit = useCallback((data: TokenFormInput) => {
    authAbort.abort();
    Promise.try(() => {
      dispatch(setAuthStatus('loading'));
      const token = data.sessionToken.trim();

      const user: UserProfile = {
        id: 'session-client-token',
        telegramId: '987654321',
        username: 'studio_engineer',
        firstName: 'Studio Engineer',
        email: 'engineer@induktr.studio',
        role: 'CLIENT',
        createdAt: DEMO_CREATED_AT,
      };

      dispatch(setCredentials({ token, user }));
      dispatch(setUserExistence({ exists: true, identifier: token }));
      onSuccessUserExists?.();
    }).catch((err: unknown) => {
      dispatch(setAuthError(err instanceof Error ? err.message : 'Session token assignment failed'));
    });
  }, [authAbort, dispatch, onSuccessUserExists]);

  // 7. Instant DB User Registration with AbortController (ОБТНП Standard)
  const handleRegisterSubmit = useCallback((data: QuickRegisterInput) => {
    const controller = authAbort.renew();
    const { signal, cleanup } = createCompositeSignal(controller.signal, 10000);

    Promise.try(async () => {
      dispatch(setAuthStatus('loading'));
      dispatch(resetAuthError());

      const result = await executeRegister(
        {
          input: {
            username: data.username,
            firstName: data.firstName,
            email: data.email,
          },
        },
        { fetchOptions: { signal } },
      );

      if (signal.aborted) return;

      if (result.error) {
        throw new Error(result.error.message);
      }

      const payload = result.data?.registerUser;
      if (payload) {
        dispatch(
          setCredentials({
            token: payload.token,
            user: payload.user as UserProfile,
          }),
        );
        dispatch(setUserExistence({ exists: true, identifier: data.username }));
        onSuccessUserExists?.();
      }
    }).catch((err: unknown) => {
      if (signal.aborted) return;
      dispatch(setAuthError(err instanceof Error ? err.message : 'Registration failed in Studio database'));
    }).finally(() => {
      cleanup();
    });
  }, [authAbort, dispatch, executeRegister, onSuccessUserExists]);

  const handleSelectMethod = useCallback((method: AuthMethod) => {
    authAbort.abort();
    void setMethodQuery(method);
    dispatch(setAuthMethod(method));
  }, [authAbort, dispatch, setMethodQuery]);

  return {
    status,
    isLoading: status === 'loading',
    errorMessage,
    authMethod,
    userExistsInDb,
    verifiedIdentifier,
    handleTelegramAuth,
    handleVerifyDbUser,
    handleDemoVerifiedAuth,
    handleDemoUnregisteredAuth,
    handleTokenSubmit,
    handleRegisterSubmit,
    handleSelectMethod,
  };
}
