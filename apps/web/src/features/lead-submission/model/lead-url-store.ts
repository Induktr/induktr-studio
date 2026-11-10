import { useSyncExternalStore } from 'react';

export interface LeadUrlStore {
  readonly setSlug: (slug: string | null) => void;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => string | null;
  readonly getServerSnapshot: () => string | null;
  readonly abort: () => void;
}

function readSlugFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('lead') || null;
  } catch {
    return null;
  }
}

/**
 * Functional LeadUrlStore Factory (ЗЮНУ Architecture Standard)
 * Synchronizes URL ?lead=<slug> via pure lexical closure and useSyncExternalStore.
 */
export function createLeadUrlStore(): LeadUrlStore {
  const listeners = new Set<() => void>();
  let currentSlug: string | null = readSlugFromLocation();

  const emitChange = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const handleLocationChange = (): void => {
    const nextSlug = readSlugFromLocation();
    if (nextSlug !== currentSlug) {
      currentSlug = nextSlug;
      emitChange();
    }
  };

  const controller = new AbortController();
  const { signal } = controller;

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', handleLocationChange, { signal });
  }

  const abort = (): void => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', handleLocationChange);
    }
    controller.abort();
    listeners.clear();
  };

  const setSlug = (slug: string | null): void => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (slug) {
        url.searchParams.set('lead', slug);
      } else {
        url.searchParams.delete('lead');
      }
      window.history.pushState({}, '', url.toString());
    }
    currentSlug = slug;
    emitChange();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = (): string | null => {
    return currentSlug;
  };

  const getServerSnapshot = (): string | null => null;

  return {
    setSlug,
    subscribe,
    getSnapshot,
    getServerSnapshot,
    abort,
  };
}

export const leadUrlStore = createLeadUrlStore();

/**
 * React 19 hook subscribing synchronously to external URL lead slug state
 */
export function useLeadUrlStore(): string | null {
  return useSyncExternalStore(
    leadUrlStore.subscribe,
    leadUrlStore.getSnapshot,
    leadUrlStore.getServerSnapshot,
  );
}
