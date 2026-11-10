import type { FC } from 'react';
import { HeroHudDisplay } from './hero-hud-display';

interface HeroProps {
  readonly onOpenTerminal?: () => void;
  readonly onViewBlueprint?: () => void;
}

/**
 * Hero Widget (React Fiber Deterministic Static Shell)
 * Completely isolated from animation telemetry — renders exactly once without unnecessary re-renders.
 */
export const Hero: FC<HeroProps> = ({ onOpenTerminal, onViewBlueprint }) => {
  return (
    <section className="flex flex-col gap-12 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-12 items-center">
        <div className="flex flex-col gap-6">
          <div className="mono flex items-center gap-3 text-xs tracking-wider text-accent-cyan font-semibold">
            <span>INDEPENDENT ENGINEERING LAB</span>
            <span className="text-text-tertiary">───</span>
            <span className="text-text-secondary">02 SLOTS / Q4</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight m-0 text-text-primary">
            Engineering Autonomous Systems With Sub-16.6ms Velocity
          </h1>

          <p className="text-[1.1rem] text-text-secondary leading-relaxed m-0 max-w-[520px]">
            Autonomous intelligence. High-throughput interfaces. Precision-built systems for founders
            who refuse latency.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              type="button"
              onClick={onOpenTerminal}
              className="mono inline-flex items-center gap-2.5 px-6 py-3.5 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-[0.9rem] cursor-pointer tracking-normal shadow-[0_4px_18px_rgba(38,181,244,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(38,181,244,0.5)] transition-all"
            >
              Open Terminal
              <span className="font-black">&gt;_</span>
            </button>

            <button
              type="button"
              onClick={onViewBlueprint}
              className="mono inline-flex items-center gap-2.5 px-6 py-3.5 rounded-md bg-bg-card text-text-primary font-bold border border-border-card text-[0.9rem] cursor-pointer tracking-normal hover:border-accent-cyan transition-colors"
            >
              View Blueprint
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 5V2H5M11 2H14V5M14 11V14H11M5 14H2V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mono text-[0.72rem] text-text-tertiary tracking-wider mt-2">
            FSD 2.1 ARCHITECTURE / BUN RUNTIME / HUMAN-LED ENGINEERING
          </div>
        </div>

        {/* Isolated Animation UI Element (useRef DOM binding) */}
        <HeroHudDisplay />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card-layer p-5 sm:px-6 flex justify-between items-center">
          <div>
            <div className="mono text-[0.7rem] text-text-tertiary tracking-wider mb-1.5">
              01 / COLD-START
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-text-primary">
              &lt;10ms
            </div>
            <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1.5">
              ISOLATE BOOT → READY
            </div>
          </div>
          <svg width="80" height="42" viewBox="0 0 100 45" fill="none">
            <path d="M 0 35 L 50 35 L 55 5 L 60 35 L 100 35" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="card-layer p-5 sm:px-6 flex justify-between items-center">
          <div>
            <div className="mono text-[0.7rem] text-text-tertiary tracking-wider mb-1.5">
              02 / P95 API
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-text-primary">
              &lt;25ms
            </div>
            <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1.5">
              REQUEST → RESOLVED
            </div>
          </div>
          <svg width="80" height="42" viewBox="0 0 100 45" fill="none">
            <path d="M 0 35 L 20 35 L 30 18 L 40 38 L 50 8 L 65 24 L 75 14 L 85 22 L 100 20" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="card-layer p-5 sm:px-6 flex justify-between items-center">
          <div>
            <div className="mono text-[0.7rem] text-text-tertiary tracking-wider mb-1.5">
              03 / FRAME BUDGET
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-text-primary">
              16.6ms
            </div>
            <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1.5">
              ZERO GC / COMPOSITOR FIRST
            </div>
          </div>
          <svg width="80" height="42" viewBox="0 0 100 45" fill="none">
            <path d="M 0 35 L 12 35 L 12 10 L 32 10 L 32 35 L 48 35 L 48 10 L 68 10 L 68 35 L 84 35 L 84 10 L 100 10" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  );
};
