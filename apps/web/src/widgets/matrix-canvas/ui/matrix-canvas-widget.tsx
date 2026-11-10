import type React from 'react';
import { useEffect, useRef } from 'react';
import { globalMatrixEngine } from '@/shared/lib/anim/matrix-engine';
import { cancelRenderFrame, scheduleRenderFrame } from '@/shared/lib/anim/scheduler';

export const MatrixCanvasWidget: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const controller = new AbortController();
    const { signal } = controller;

    let animId: number;
    const entityId = 1;

    const tick = (timestamp: number) => {
      if (signal.aborted) {
        return;
      }

      const angle = (timestamp * 0.001) % (Math.PI * 2);
      const scale = 1 + 0.08 * Math.sin(timestamp * 0.003);

      globalMatrixEngine.setTransform(entityId, 0, 0, scale, scale, angle);
      globalMatrixEngine.applyToElement(entityId, el);

      if (!signal.aborted) {
        animId = scheduleRenderFrame(tick);
      }
    };

    animId = scheduleRenderFrame(tick);

    return () => {
      controller.abort();
      cancelRenderFrame(animId);
    };
  }, []);

  return (
    <div className="p-8 rounded-xl bg-bg-surface border border-border-subtle flex flex-col items-center justify-center min-h-[260px]">
      <div
        ref={boxRef}
        className="w-[90px] h-[90px] rounded-2xl bg-gradient-to-br from-accent-cyan to-blue-500 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.35)] will-change-transform"
      >
        <span className="mono text-black font-black text-[0.85rem]">F32-MAT</span>
      </div>
      <p className="mono mt-6 text-xs text-text-secondary text-center">
        Linear Algebra Transform Matrix (Float32Array) • V8 Idle Scheduler • Zero GC Overhead
      </p>
    </div>
  );
};
