import type { FC, ReactNode } from 'react';

interface BiDiTelemetryProps {
  readonly label?: string;
  readonly value: ReactNode;
  readonly className?: string;
}

/**
 * BiDi Telemetry Register (doc-loc1n.md §3.5)
 * Guarantees strict left-to-right reading order for technical metrics,
 * frame rates, code blocks, and hashes regardless of document RTL direction.
 */
export const BiDiTelemetry: FC<BiDiTelemetryProps> = ({
  label,
  value,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {label && (
        <span className="text-xs text-text-secondary text-start">
          {label}
        </span>
      )}
      <bdi
        dir="ltr"
        className="mono text-xs font-semibold text-accent-cyan tabular-nums"
      >
        {value}
      </bdi>
    </div>
  );
};
