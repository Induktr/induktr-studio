import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  type AppTab,
  selectActiveTab,
  selectFooterSubtext,
  setActiveTab,
} from '../store/navigation-slice';
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectUserExistsInDb,
} from '../store/auth-slice';
import { getLastActiveLeadSlug } from '@/features/lead-submission';
import { isProtectedTab, navigationStore, useNavigationSnapshot } from './navigation-store';
import { createCompositeSignal } from '@/shared/lib/async';
import {
  useTabQueryState,
  useLeadSlugQueryState,
  useRedirectQueryState,
} from '@/shared/lib/url';

export function useAppNavigation() {
  const dispatch = useAppDispatch();

  // 1. Reactive Typed URL Query State via nuqs (Zod/Enum Validated)
  const [tabQuery, setTabQuery] = useTabQueryState();
  const [leadQuery, setLeadQuery] = useLeadSlugQueryState();
  const [redirectQuery, setRedirectQuery] = useRedirectQueryState();

  // 2. Synchronous External Store Fallback
  const navSnapshot = useNavigationSnapshot();

  const effectiveTab = tabQuery || navSnapshot.tab;
  const effectiveLead = leadQuery || navSnapshot.lead;

  const activeTab = useAppSelector(selectActiveTab);
  const footerSubtext = useAppSelector(selectFooterSubtext);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authUser = useAppSelector(selectAuthUser);
  const userExistsInDb = useAppSelector(selectUserExistsInDb);

  useEffect(() => {
    dispatch(setActiveTab(effectiveTab));
  }, [effectiveTab, dispatch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const controller = new AbortController();
    const { signal, cleanup } = createCompositeSignal(controller.signal, 10000);

    Promise.try(() => {
      if (signal.aborted) return;

      if (!isAuthenticated) {
        if (isProtectedTab(effectiveTab)) {
          void setRedirectQuery(effectiveTab);
          void setTabQuery('auth');
          navigationStore.navigate('auth', effectiveLead);
        }
      } else {
        if (effectiveTab === 'auth') {
          if (userExistsInDb === false) {
            void setTabQuery('intake');
            navigationStore.navigate('intake', effectiveLead);
          } else {
            const destinationTab: AppTab = redirectQuery || 'client-hub';
            void setRedirectQuery(null);
            void setTabQuery(destinationTab);
            const lastSlug = getLastActiveLeadSlug();
            const targetLead = destinationTab === 'client-hub' ? (lastSlug || effectiveLead) : effectiveLead;
            if (targetLead) {
              void setLeadQuery(targetLead);
            }
            navigationStore.navigate(destinationTab, targetLead);
          }
        }
      }
    }).catch(() => {});

    return () => {
      controller.abort();
      cleanup();
    };
  }, [
    isAuthenticated,
    effectiveTab,
    effectiveLead,
    userExistsInDb,
    redirectQuery,
    setTabQuery,
    setLeadQuery,
    setRedirectQuery,
  ]);

  const navigateTo = useCallback((tab: AppTab) => {
    if (!isAuthenticated && isProtectedTab(tab)) {
      void setRedirectQuery(tab);
      void setTabQuery('auth');
      navigationStore.navigate('auth');
      return;
    }
    void setTabQuery(tab);
    navigationStore.navigate(tab);
  }, [isAuthenticated, setRedirectQuery, setTabQuery]);

  const onInitializeClick = useCallback(() => {
    if (!isAuthenticated) {
      void setTabQuery('auth');
      navigationStore.navigate('auth');
    } else {
      void setTabQuery('intake');
      navigationStore.navigate('intake');
    }
  }, [isAuthenticated, setTabQuery]);

  return {
    activeTab,
    leadSlug: effectiveLead,
    footerSubtext,
    isAuthenticated,
    userExistsInDb,
    username: authUser?.firstName?.toUpperCase() || authUser?.username?.toUpperCase() || 'STUDIO CLIENT',
    redirectQuery,
    navigateTo,
    onInitializeClick,
  };
}
