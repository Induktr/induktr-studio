import type React from 'react';
import { useEffect, useRef } from 'react';
import { telemetryEngine } from '@/shared/lib/stores/telemetry-store';

/**
 * Isolated HUD Radar & Telemetry Display (Zero-Re-render Fiber Architecture)
 * Bypasses React Fiber reconciliation via useRef direct DOM mutations for high-frequency 60 FPS animations.
 * Ensures the parent Hero widget and all static copy render exactly once.
 */
export const HeroHudDisplay: React.FC = () => {
  const radarNeedleRef = useRef<SVGGElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const radarNeedle = radarNeedleRef.current;
    const coords = coordsRef.current;

    const controller = new AbortController();
    const { signal } = controller;

    const unsubscribe = telemetryEngine.subscribe(() => {
      if (signal.aborted) return;
      const snap = telemetryEngine.getSnapshot();
      if (radarNeedle) {
        radarNeedle.setAttribute('transform', `rotate(${snap.hudAngle}, 190, 120)`);
      }
      if (coords) {
        coords.textContent = `X ${snap.coordX.toFixed(4)} / Y 0.0000`;
      }
    });

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);

  const initial = telemetryEngine.getSnapshot();

  return (
    <div className="card-layer relative p-6 aspect-[1.25/1] min-h-[380px] flex flex-col justify-between bg-[radial-gradient(circle_at_60%_50%,rgba(56,189,248,0.05)_0%,var(--bg-card)_75%)] overflow-hidden">
      <div className="mono flex justify-between items-center text-[0.72rem] tracking-wider z-10">
        <span className="text-text-secondary">FIG. 01 / AUTONOMOUS CORE</span>
        <span className="text-accent-cyan font-bold">SIM: ON</span>
      </div>

      <div className="relative w-full h-[240px] flex items-center justify-center">
        <svg className="absolute w-full h-full overflow-visible pointer-events-none">
          <circle cx="50%" cy="50%" r="105" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="50%" cy="50%" r="75" fill="none" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
          <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <g ref={radarNeedleRef} transform={`rotate(${initial.hudAngle}, 190, 120)`}>
            <line x1="190" y1="120" x2="295" y2="120" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
          </g>
        </svg>

        <div className="w-[125px] h-[110px] rounded-xl border border-accent-cyan bg-[#0a0d14]/92 shadow-[0_0_25px_rgba(56,189,248,0.25)] flex flex-col items-center justify-center gap-1.5 z-20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span className="mono text-[0.72rem] font-extrabold tracking-wider text-text-primary">
            INDY / CORE
          </span>
          <span className="mono text-[0.65rem] text-accent-cyan font-semibold">
            16.6ms / CYCLE
          </span>
        </div>

        <div className="mono absolute top-[22px] left-5 px-2.5 py-1 rounded bg-slate-900/80 border border-border-subtle text-[0.68rem] flex items-center gap-1.5 text-accent-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
          INPUT / 01
        </div>

        <div className="mono absolute top-5 right-[25px] px-2.5 py-1 rounded bg-purple-400/10 border border-purple-400/30 text-[0.68rem] flex items-center gap-1.5 text-accent-purple">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
          AGENT / 08
        </div>

        <div className="mono absolute bottom-[22px] left-5 px-2.5 py-1 rounded bg-slate-900/80 border border-border-subtle text-[0.68rem] flex items-center gap-1.5 text-accent-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
          MEMORY
        </div>

        <div className="mono absolute bottom-[22px] right-[25px] px-2.5 py-1 rounded bg-green-400/10 border border-green-400/30 text-[0.68rem] flex items-center gap-1.5 text-accent-green">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          ACTUATION
        </div>
      </div>

      <div className="mono flex justify-between items-center text-[0.72rem] tracking-wider z-10">
        <span ref={coordsRef} className="text-text-tertiary">
          X {initial.coordX.toFixed(4)} / Y 0.0000
        </span>
        <span className="text-accent-green flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_5px_var(--accent-green)]" />
          ALL SYSTEMS NOMINAL
        </span>
      </div>
    </div>
  );
};
