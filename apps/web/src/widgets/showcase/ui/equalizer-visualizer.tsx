import type React from 'react';
import { useEffect, useRef } from 'react';
import { telemetryEngine } from '@/shared/lib/stores/telemetry-store';

const BAR_COUNT = 16;

/**
 * Isolated Telemetry Equalizer Visualizer (Zero-Re-render Fiber Architecture)
 * Bypasses React Fiber reconciliation via useRef direct DOM mutations for the 16 audio bars.
 * Ensures the parent ShowcaseWidget and all its cards/nodes render only on explicit user interaction.
 */
export const EqualizerVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const controller = new AbortController();
    const { signal } = controller;

    const barNodes = container.children;

    const unsubscribe = telemetryEngine.subscribe(() => {
      if (signal.aborted) {
        return;
      }
      const { equalizerBars } = telemetryEngine.getSnapshot();
      const count = Math.min(barNodes.length, equalizerBars.length);
      for (let i = 0; i < count; i++) {
        const bar = barNodes[i] as HTMLElement;
        if (bar) {
          bar.style.transform = `scaleY(${((equalizerBars[i] ?? 35) / 100).toFixed(4)})`;
        }
      }
    });

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);

  const initialBars = telemetryEngine.getSnapshot().equalizerBars;

  return (
    <div ref={containerRef} className="flex items-end justify-between h-12 pt-2 gap-1">
      {Array.from({ length: BAR_COUNT }).map((_, idx) => (
        <div
          key={idx}
          className={`flex-1 h-full origin-bottom rounded-[2px] ${
            idx > 11 ? 'bg-accent-cyan' : 'bg-sky-400/45'
          }`}
          style={{ transform: `scaleY(${((initialBars[idx] ?? 35) / 100).toFixed(4)})` }}
        />
      ))}
    </div>
  );
};
