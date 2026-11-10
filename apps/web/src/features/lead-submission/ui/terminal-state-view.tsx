import type { FC } from 'react';

export interface TerminalRehydratingViewProps {
  readonly message?: string;
}

export const TerminalRehydratingView: FC<TerminalRehydratingViewProps> = ({
  message = 'REHYDRATING INTAKE RECORD FROM BROWSER SERVER CACHE...',
}) => {
  return (
    <div className="py-14 px-8 text-center flex flex-col gap-4 items-center">
      <div className="w-7 h-7 border-2 border-sky-400/20 border-t-accent-cyan rounded-full animate-spin" />
      <div className="mono text-accent-cyan text-[0.85rem]">
        {message}
      </div>
    </div>
  );
};

export interface TerminalNotFoundViewProps {
  readonly slug: string | null;
  readonly onReset: () => void;
}

export const TerminalNotFoundView: FC<TerminalNotFoundViewProps> = ({
  slug,
  onReset,
}) => {
  return (
    <div className="py-12 px-8 text-center flex flex-col gap-4 items-center">
      <div className="mono text-accent-danger text-base font-bold">
        ⚠ Brief Session Not Found or Expired
      </div>
      <p className="text-text-secondary m-0 text-[0.88rem] max-w-[380px]">
        The lead slug <span className="mono text-accent-cyan">{slug}</span> is no longer available in the local browser server cache or remote database.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mono mt-3 px-5 py-2.5 rounded-md bg-bg-card text-accent-cyan border border-accent-cyan text-xs cursor-pointer hover:bg-accent-cyan/10 transition-colors"
      >
        Initialize New Brief
      </button>
    </div>
  );
};
