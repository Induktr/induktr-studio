import { useSyncExternalStore } from 'react';

export interface TelemetrySnapshot {
  readonly hudAngle: number;
  readonly coordX: number;
  readonly coordY: number;
  readonly fps: number;
  readonly pulseTick: number;
  readonly equalizerBars: readonly number[];
}

export interface TelemetryEngine {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => TelemetrySnapshot;
  readonly getServerSnapshot: () => TelemetrySnapshot;
  readonly destroy: () => void;
  readonly abort: () => void;
}

export const STATIC_BASE_BARS = [20, 35, 45, 28, 55, 38, 70, 60, 48, 65, 80, 52, 90, 75, 85, 95] as const;
const BARS_COUNT = STATIC_BASE_BARS.length;

// Pre-baked Float32Array(256) Sine LUT to eliminate 60Hz Math.sin allocations/computations
export const SIN_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  SIN_LUT[i] = Math.sin((i / 256) * Math.PI * 2);
}

function fastSin(rad: number): number {
  const norm = (rad / (Math.PI * 2)) % 1;
  const idx = Math.floor((norm < 0 ? norm + 1 : norm) * 256) & 255;
  return SIN_LUT[idx] ?? 0;
}

const SERVER_SNAPSHOT: TelemetrySnapshot = Object.freeze({
  hudAngle: 0,
  coordX: 0.0166,
  coordY: 0.0000,
  fps: 60,
  pulseTick: 0,
  equalizerBars: Object.freeze([...STATIC_BASE_BARS]),
});

interface MutableTelemetrySnapshot {
  hudAngle: number;
  coordX: number;
  coordY: number;
  fps: number;
  pulseTick: number;
  equalizerBars: readonly number[];
}

/**
 * Functional Telemetry Engine Factory
 * Zero-allocation 60Hz functional RAF telemetry engine utilizing SIN_LUT,
 * pre-allocated double-buffer snapshots, and reference-counted RAF scheduling.
 */
export function createTelemetryEngine(): TelemetryEngine {
  const listeners = new Set<() => void>();

  const barsA: number[] = Array.from(STATIC_BASE_BARS);
  const barsB: number[] = Array.from(STATIC_BASE_BARS);

  const snapshotA: MutableTelemetrySnapshot = {
    hudAngle: 0,
    coordX: 0.0166,
    coordY: 0.0000,
    fps: 60,
    pulseTick: 0,
    equalizerBars: barsA,
  };

  const snapshotB: MutableTelemetrySnapshot = {
    hudAngle: 0,
    coordX: 0.0166,
    coordY: 0.0000,
    fps: 60,
    pulseTick: 0,
    equalizerBars: barsB,
  };

  let activeSnapshot: TelemetrySnapshot = snapshotA;
  let useBufferA = true;
  let currentFps = 60;

  const controller = new AbortController();
  let rafId: number | null = null;
  let t = 0;

  const stop = (): void => {
    if (rafId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      rafId = null;
    }
  };

  const start = (): void => {
    if (rafId !== null) return;
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = lastTime;

    const loop = (now: number): void => {
      if (controller.signal.aborted || listeners.size === 0) {
        rafId = null;
        return;
      }

      t += 0.018;
      frameCount++;

      if (now - lastFpsUpdate >= 1000) {
        currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      useBufferA = !useBufferA;
      const targetSnapshot = useBufferA ? snapshotA : snapshotB;
      const targetBars = useBufferA ? barsA : barsB;

      for (let idx = 0; idx < BARS_COUNT; idx++) {
        const baseH = STATIC_BASE_BARS[idx] ?? 0;
        targetBars[idx] = Math.min(100, Math.max(15, baseH + fastSin(t * 3 + idx) * 16));
      }

      targetSnapshot.hudAngle = (targetSnapshot.hudAngle + 0.35) % 360;
      targetSnapshot.coordX = 0.0166 + fastSin(t) * 0.0008;
      targetSnapshot.coordY = 0.0000 + fastSin(t * 1.5) * 0.0004;
      targetSnapshot.fps = currentFps;
      targetSnapshot.pulseTick = (targetSnapshot.pulseTick + 1) % 100;

      activeSnapshot = targetSnapshot;

      for (const listener of listeners) {
        listener();
      }

      if (!controller.signal.aborted && listeners.size > 0) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    };

    rafId = requestAnimationFrame(loop);
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      start();
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stop();
      }
    };
  };

  const getSnapshot = (): TelemetrySnapshot => activeSnapshot;
  const getServerSnapshot = (): TelemetrySnapshot => SERVER_SNAPSHOT;

  const destroy = (): void => {
    controller.abort();
    stop();
  };

  const abort = (): void => {
    destroy();
    listeners.clear();
  };

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot,
    destroy,
    abort,
  };
}

export const telemetryEngine = createTelemetryEngine();
export const telemetryStore = telemetryEngine;

/**
 * React 19 Concurrent-safe Hook via useSyncExternalStore
 * Binds directly to the zero-allocation RAF telemetry stream without useEffect re-render lag
 */
export function useTelemetry(): TelemetrySnapshot {
  return useSyncExternalStore(
    telemetryEngine.subscribe,
    telemetryEngine.getSnapshot,
    telemetryEngine.getServerSnapshot,
  );
}
