import { useSyncExternalStore } from "react";
import type { AppTab } from "../store/navigation-slice";

export interface NavigationSnapshot {
  readonly tab: AppTab;
  readonly lead: string | null;
}

export interface NavigationStore {
  readonly navigate: (tab: AppTab, lead?: string | null) => void;
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => NavigationSnapshot;
  readonly getServerSnapshot: () => NavigationSnapshot;
  readonly abort: () => void;
}

const defaultSnapshot: NavigationSnapshot = {
  tab: "auth",
  lead: null,
};

const serverSnapshot: NavigationSnapshot = {
  tab: "studio",
  lead: null,
};

export const PUBLIC_TABS: readonly AppTab[] = [
  "studio",
  "store",
  "cases",
  "systems",
  "knowledge",
  "intake",
  "auth",
];

export const PROTECTED_TABS: readonly AppTab[] = ["client-hub"];

export function isProtectedTab(tab: string | null | undefined): tab is AppTab {
  return Boolean(tab && (PROTECTED_TABS as readonly string[]).includes(tab));
}

export function isPublicTab(tab: string | null | undefined): tab is AppTab {
  return Boolean(tab && (PUBLIC_TABS as readonly string[]).includes(tab));
}

export const validTabs: readonly AppTab[] = [
  ...PUBLIC_TABS,
  ...PROTECTED_TABS,
];

export function isValidTab(val: string | null | undefined): val is AppTab {
  return Boolean(val && (validTabs as readonly string[]).includes(val));
}

function isUserAuthenticated(): boolean {
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  ) {
    try {
      return Boolean(window.localStorage.getItem("induktr_auth_token"));
    } catch {
      return false;
    }
  }
  if (
    typeof globalThis !== "undefined" &&
    (globalThis as unknown as { localStorage?: Storage }).localStorage
  ) {
    try {
      return Boolean(
        (
          globalThis as unknown as { localStorage: Storage }
        ).localStorage.getItem("induktr_auth_token"),
      );
    } catch {
      return false;
    }
  }
  return false;
}

function readLocationParams(): { rawTab: string | null; lead: string | null } {
  if (typeof window === "undefined" || !window.location) {
    return { rawTab: null, lead: null };
  }
  try {
    const search = window.location.search;
    const matchTab = search.match(/[?&]tab=([^&#]*)/);
    const matchLead = search.match(/[?&]lead=([^&#]*)/);
    return {
      rawTab: matchTab && matchTab[1] !== undefined ? decodeURIComponent(matchTab[1]) : null,
      lead: matchLead && matchLead[1] !== undefined ? decodeURIComponent(matchLead[1]) : null,
    };
  } catch {
    return { rawTab: null, lead: null };
  }
}

function computeNavigationSnapshot(): NavigationSnapshot {
  const hasToken = isUserAuthenticated();
  if (typeof window === "undefined") {
    return {
      tab: hasToken ? "client-hub" : "auth",
      lead: null,
    };
  }
  try {
    const { rawTab, lead } = readLocationParams();

    let effectiveTab: AppTab = hasToken ? "client-hub" : "auth";
    if (isValidTab(rawTab)) {
      effectiveTab = rawTab;
    } else if (lead) {
      effectiveTab = "intake";
    }

    if (!hasToken && isProtectedTab(effectiveTab)) {
      return {
        tab: "auth",
        lead,
      };
    }

    return {
      tab: effectiveTab,
      lead,
    };
  } catch {
    return defaultSnapshot;
  }
}

export function createNavigationStore(): NavigationStore {
  const listeners = new Set<() => void>();
  let snapshot: NavigationSnapshot = computeNavigationSnapshot();

  const emitChange = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const handleLocationChange = (): void => {
    const next = computeNavigationSnapshot();
    if (next.tab !== snapshot.tab || next.lead !== snapshot.lead) {
      snapshot = next;
      emitChange();
    }
  };

  const controller = new AbortController();
  const { signal } = controller;

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", handleLocationChange, { signal });
  }

  const abort = (): void => {
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", handleLocationChange);
    }
    controller.abort();
    listeners.clear();
  };

  const navigate = (tab: AppTab, lead?: string | null): void => {
    const hasToken = isUserAuthenticated();
    const isProtected = isProtectedTab(tab);
    const targetTab: AppTab = !hasToken && isProtected ? "auth" : tab;

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", targetTab);
      if (!hasToken && isProtected) {
        url.searchParams.set("redirect", tab);
      }
      if (lead !== undefined) {
        if (lead) {
          url.searchParams.set("lead", lead);
        } else {
          url.searchParams.delete("lead");
        }
      }
      window.history.pushState({}, "", url.toString());
      snapshot = computeNavigationSnapshot();
    } else {
      snapshot = { tab: targetTab, lead: lead ?? null };
    }
    emitChange();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = (): NavigationSnapshot => snapshot;
  const getServerSnapshot = (): NavigationSnapshot => serverSnapshot;

  return {
    navigate,
    subscribe,
    getSnapshot,
    getServerSnapshot,
    abort,
  };
}

export const navigationStore = createNavigationStore();

export function useNavigationSnapshot(): NavigationSnapshot {
  return useSyncExternalStore(
    navigationStore.subscribe,
    navigationStore.getSnapshot,
    navigationStore.getServerSnapshot,
  );
}
