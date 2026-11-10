import type { ReactNode } from 'react';
import { ErrorBoundary as CoreErrorBoundary, type FallbackProps, useErrorBoundary } from 'react-error-boundary';

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  readonly onReset?: () => void;
  readonly onError?: (error: Error, info: { componentStack?: string | null }) => void;
}

export interface ErrorBoundaryFallbackViewProps {
  readonly error: Error;
  readonly resetErrorBoundary: () => void;
  readonly customFallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error(String(error) || 'Unknown runtime error');
}

/**
 * Cyber-tactical Fault Isolation View (Functional Component)
 * Styled with TailwindCSS utility classes.
 */
export function ErrorBoundaryFallbackView({
  error,
  resetErrorBoundary,
  customFallback,
}: ErrorBoundaryFallbackViewProps): ReactNode {
  if (typeof customFallback === 'function') {
    return customFallback(error, resetErrorBoundary);
  }
  if (customFallback) {
    return customFallback;
  }

  return (
    <div className="card-layer glow-cyan px-8 py-10 rounded-2xl border border-red-500/40 bg-slate-900/85 text-center flex flex-col items-center gap-4 my-8">
      <div className="mono text-[0.8rem] text-accent-danger tracking-wider font-bold">
        ⚠ RUNTIME FAULT ISOLATED // COMPONENT DEFECT
      </div>

      <h3 className="text-xl font-bold text-text-primary m-0">
        Sub-System Boundary Preserved
      </h3>

      <p className="mono text-text-secondary text-[0.85rem] max-w-[520px] m-0 bg-black/40 px-4 py-3 rounded-md border border-border-subtle break-words">
        {error.message || 'Unknown runtime anomaly'}
      </p>

      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mono mt-2 px-6 py-2.5 rounded-md bg-bg-card text-accent-cyan border border-accent-cyan text-[0.8rem] font-bold cursor-pointer tracking-wider hover:bg-accent-cyan/10 transition-colors"
      >
        RE-INITIALIZE COMPONENT ↺
      </button>
    </div>
  );
}

/**
 * Functional Error Boundary (Zero-Cascade Containment Standard)
 * Replaces class components with pure functional react-error-boundary composition.
 */
export function ErrorBoundary({
  children,
  fallback,
  onReset,
  onError,
}: ErrorBoundaryProps): ReactNode {
  return (
    <CoreErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }: FallbackProps) => (
        <ErrorBoundaryFallbackView
          error={toError(error)}
          resetErrorBoundary={resetErrorBoundary}
          customFallback={fallback}
        />
      )}
      onReset={onReset}
      onError={(error, info) => onError?.(toError(error), info)}
    >
      {children}
    </CoreErrorBoundary>
  );
}

export { useErrorBoundary };
