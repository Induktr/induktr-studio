import type { FC } from 'react';

interface FooterProps {
  readonly subtext?: string;
}

export const Footer: FC<FooterProps> = ({
  subtext = 'INDUKTR® / ENGINEERED IN THE LAB. BUILT FOR THE FIELD.',
}) => {
  return (
    <footer className="px-8 py-5 border-t border-border-subtle flex justify-between items-center text-text-tertiary bg-bg-primary mt-auto">
      <div className="mono text-[0.72rem] tracking-wider">
        {subtext}
      </div>
      <div className="mono text-[0.72rem] tracking-wider">
        ILLUSTRATIVE TELEMETRY • STUDIO v2.0
      </div>
    </footer>
  );
};
