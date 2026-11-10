import type React from 'react';

export interface WidgetSuspenseFallbackProps {
  label?: string;
  height?: string;
}

/**
 * Tactical Suspense Fallback (React 19 Concurrent Streaming & Hydration Standard)
 * Styled with pure TailwindCSS utility classes.
 */
export const WidgetSuspenseFallback: React.FC<WidgetSuspenseFallbackProps> = ({
  label = 'HYDRATING SYSTEM STREAM // AWAITING PAYLOAD...',
  height,
}) => {
  return (
    <div
      className={`card-layer glow-cyan rounded-2xl border border-sky-400/25 bg-[#0a0f19]/70 flex flex-col items-center justify-center gap-5 p-8 relative overflow-hidden ${
        height ? '' : 'min-h-[380px]'
      }`}
      style={height ? { minHeight: height } : undefined}
    >
      {/* Dynamic Scanline Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-cyan)] to-transparent animate-[scanline_2s_ease-in-out_infinite]" />

      <div className="w-9 h-9 border-2 border-sky-400/15 border-t-[var(--accent-cyan)] rounded-full animate-spin" />

      <div className="text-center flex flex-col gap-1.5">
        <div className="mono text-[0.78rem] text-accent-cyan tracking-wider font-bold">
          {label}
        </div>
        <div className="mono text-[0.7rem] text-text-tertiary tracking-normal">
          CONCURRENT STREAMING • BUN 1.4 ENGINE
        </div>
      </div>
    </div>
  );
};

export const TerminalSuspenseFallback: React.FC = () => {
  return (
    <WidgetSuspenseFallback
      label="ESTABLISHING TERMINAL PROTOCOL // INITIALIZING CONSOLE STREAM..."
      height="480px"
    />
  );
};
