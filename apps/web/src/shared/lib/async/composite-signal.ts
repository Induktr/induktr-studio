import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

export function createCompositeSignal(
  externalSignal?: AbortSignal | null,
  timeoutMs?: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const onExternalAbort = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  if (typeof timeoutMs === "number" && timeoutMs > 0) {
    timerId = setTimeout(() => {
      timerId = null;
      controller.abort(new DOMException("Operation timed out", "TimeoutError"));
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  return {
    signal: controller.signal,
    cleanup,
  };
}

export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const renew = useCallback((): AbortController => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const newController = new AbortController();
    controllerRef.current = newController;
    return newController;
  }, []);

  const getSignal = useCallback((): AbortSignal => {
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController();
    }
    return controllerRef.current.signal;
  }, []);

  const abort = useCallback((reason?: unknown) => {
    if (controllerRef.current && !controllerRef.current.signal.aborted) {
      controllerRef.current.abort(reason);
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      if (controllerRef.current && !controllerRef.current.signal.aborted) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return useMemo(
    () => ({
      renew,
      getSignal,
      abort,
      controllerRef,
    }),
    [renew, getSignal, abort],
  );
}
