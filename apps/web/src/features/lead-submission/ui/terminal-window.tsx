import type { ReactNode, FC } from 'react';

export interface TerminalWindowProps {
  readonly title?: string;
  readonly slug?: string | null;
  readonly children: ReactNode;
}

export const TerminalWindow: FC<TerminalWindowProps> = ({
  title = 'indy@induktr-studio: ~/intake-protocol',
  slug,
  children,
}) => {
  const fullTitle = slug ? `${title}/${slug}` : title;

  return (
    <div className="card-layer glow-cyan border border-sky-400/35 rounded-2xl overflow-hidden bg-bg-surface shadow-[0_0_35px_rgba(56,189,248,0.12)]">
      {/* macOS Terminal Title Bar */}
      <div className="px-5 py-3.5 bg-[#0a0d14]/95 border-b border-border-subtle flex items-center gap-4">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <span className="mono text-[0.78rem] text-text-secondary">
          {fullTitle}
        </span>
      </div>

      {children}
    </div>
  );
};
