/**
 * ============================================================================
 * Induktr Studio v2.0 — Scheduler & V8 Task Orchestrator
 * Based on Notion Standard: [JS-CORE] 22. Scheduler API & RequestIdleCallback
 * ============================================================================
 * Principle:
 * 1. Background computation & matrix pre-baking happens in requestIdleCallback (rIC).
 * 2. ZERO DOM MUTATIONS inside rIC (prevents layout invalidation before render).
 * 3. DOM transforms are dispatched strictly in requestAnimationFrame (rAF) at vsync.
 */

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface WindowWithIdleCallback {
  requestIdleCallback?(callback: IdleRequestCallback, options?: { timeout: number }): number;
  cancelIdleCallback?(handle: number): void;
}

/**
 * Schedule non-critical work during idle periods between frame renders with AbortSignal cancellation
 */
export function scheduleLowPriorityTask(
  taskFn: () => void,
  timeoutMs = 2000,
  signal?: AbortSignal,
): () => void {
  if (signal?.aborted) {
    return () => {};
  }

  const win = typeof window !== 'undefined' ? (window as unknown as WindowWithIdleCallback) : undefined;
  let handle: number | null = null;
  let timerHandle: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (handle !== null && win && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(handle);
      handle = null;
    }
    if (timerHandle !== null) {
      clearTimeout(timerHandle);
      timerHandle = null;
    }
  };

  if (signal) {
    signal.addEventListener('abort', cancel, { once: true });
  }

  if (win && typeof win.requestIdleCallback === 'function') {
    handle = win.requestIdleCallback(
      (deadline: IdleDeadline) => {
        if (signal?.aborted) return;
        // Execute work in chunks while frame deadline has remaining budget
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          taskFn();
        }
      },
      { timeout: timeoutMs }
    );
  } else {
    // Fallback for environments lacking requestIdleCallback
    timerHandle = setTimeout(() => {
      if (signal?.aborted) return;
      taskFn();
    }, 50);
  }

  return cancel;
}

/**
 * High-Priority Compositor Tick (rAF) for applying pre-calculated matrices
 */
export function scheduleRenderFrame(
  renderFn: (timestamp: number) => void,
  signal?: AbortSignal,
): number {
  if (signal?.aborted) {
    return -1;
  }

  const wrappedFn = (timestamp: number) => {
    if (signal?.aborted) return;
    renderFn(timestamp);
  };

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    const id = window.requestAnimationFrame(wrappedFn);
    if (signal) {
      signal.addEventListener('abort', () => window.cancelAnimationFrame(id), { once: true });
    }
    return id;
  }

  const timerId = setTimeout(() => wrappedFn(performance.now()), 16) as unknown as number;
  if (signal) {
    signal.addEventListener('abort', () => clearTimeout(timerId), { once: true });
  }
  return timerId;
}

export function cancelRenderFrame(handle: number): void {
  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(handle);
  } else {
    clearTimeout(handle);
  }
}
