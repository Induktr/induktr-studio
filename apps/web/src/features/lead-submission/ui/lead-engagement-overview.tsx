import type { FC } from 'react';

export interface LeadEngagementOverviewProps {
  readonly stepIndex?: string;
  readonly headline?: string;
  readonly description?: string;
  readonly engagementTier?: string;
  readonly responseWindow?: string;
  readonly firstDeliverable?: string;
  readonly privacyText?: string;
}

export const LeadEngagementOverview: FC<LeadEngagementOverviewProps> = ({
  stepIndex = '01 / ESTABLISH CONNECTION',
  headline = 'Your next system starts here.',
  description = "A direct line to the engineering lab. Share your constraints. We'll design the architecture around them.",
  engagementTier = '$3,000 ── $10,000+',
  responseWindow = 'Within 1 business day',
  firstDeliverable = 'Architecture & scope review',
  privacyText = 'Private by design. Your brief stays between you and the lab.',
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mono text-xs text-accent-cyan tracking-wider font-semibold mb-2">
          {stepIndex}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4 text-text-primary">
          {headline}
        </h2>
        <p className="text-text-secondary text-[1.05rem] leading-relaxed m-0">
          {description}
        </p>
      </div>

      {/* Engagement Parameters */}
      <div className="flex flex-col gap-5 border-t border-border-subtle pt-6">
        <div>
          <div className="mono text-[0.68rem] text-text-tertiary tracking-wider">
            ENGAGEMENT
          </div>
          <div className="text-xl font-extrabold text-text-primary mt-1">
            {engagementTier}
          </div>
        </div>

        <div>
          <div className="mono text-[0.68rem] text-text-tertiary tracking-wider">
            RESPONSE WINDOW
          </div>
          <div className="text-[1.05rem] font-semibold text-text-primary mt-1">
            {responseWindow}
          </div>
        </div>

        <div>
          <div className="mono text-[0.68rem] text-text-tertiary tracking-wider">
            FIRST DELIVERABLE
          </div>
          <div className="text-[1.05rem] font-semibold text-text-primary mt-1">
            {firstDeliverable}
          </div>
        </div>
      </div>

      {/* Privacy Shield Box */}
      <div className="card-layer p-5 flex items-center gap-4 bg-slate-900/40">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-cyan shrink-0"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-[0.85rem] text-text-secondary leading-normal">
          {privacyText}
        </span>
      </div>
    </div>
  );
};
