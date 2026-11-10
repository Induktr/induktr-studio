import { useSyncExternalStore } from 'react';

export interface BrowserSnapshot {
  readonly isOnline: boolean;
  readonly isMobile: boolean;
  readonly prefersReducedMotion: boolean;
  readonly hardwareConcurrency: number;
}

export interface BrowserStore {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => BrowserSnapshot;
  readonly getServerSnapshot: () => BrowserSnapshot;
  readonly abort: () => void;
}

const defaultSnapshot: BrowserSnapshot = {
  isOnline: true,
  isMobile: false,
  prefersReducedMotion: false,
  hardwareConcurrency: 8,
};

function computeBrowserSnapshot(): BrowserSnapshot {
  if (typeof window === 'undefined') return defaultSnapshot;
  return {
    isOnline: navigator.onLine ?? true,
    isMobile: window.innerWidth < 768,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 4,
  };
}

/**
 * Functional Browser State Store Factory (ЗЮНУ Architecture Standard)
 * Replaces class-based store with a pure closure and factory function.
 */
export function createBrowserStore(): BrowserStore {
  const listeners = new Set<() => void>();
  let snapshot: BrowserSnapshot = computeBrowserSnapshot();

  const handleEvent = (): void => {
    const next = computeBrowserSnapshot();
    if (
      next.isOnline !== snapshot.isOnline ||
      next.isMobile !== snapshot.isMobile ||
      next.prefersReducedMotion !== snapshot.prefersReducedMotion
    ) {
      snapshot = next;
      for (const listener of listeners) {
        listener();
      }
    }
  };

  const controller = new AbortController();
  const { signal } = controller;

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleEvent, { signal });
    window.addEventListener('offline', handleEvent, { signal });
    window.addEventListener('resize', handleEvent, { signal });
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    mql.addEventListener?.('change', handleEvent, { signal });
  }

  const abort = (): void => {
    controller.abort();
    listeners.clear();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = (): BrowserSnapshot => snapshot;
  const getServerSnapshot = (): BrowserSnapshot => defaultSnapshot;

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot,
    abort,
  };
}

export const browserStore = createBrowserStore();

/**
 * React 19 useSyncExternalStore hook for reactive browser environment state
 */
export function useBrowser(): BrowserSnapshot {
  return useSyncExternalStore(
    browserStore.subscribe,
    browserStore.getSnapshot,
    browserStore.getServerSnapshot,
  );
}
