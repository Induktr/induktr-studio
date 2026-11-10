import type { FC } from 'react';
import type { CachedLeadData } from '../lib/lead-cache';

export interface LeadDossierViewProps {
  readonly lead: CachedLeadData;
  readonly isCopied: boolean;
  readonly onCopy: () => void;
  readonly onReset: () => void;
}

export const LeadDossierView: FC<LeadDossierViewProps> = ({
  lead,
  isCopied,
  onCopy,
  onReset,
}) => {
  return (
    <div className="p-8 sm:p-7 flex flex-col gap-5">
      {/* Top Status Header */}
      <div className="p-3.5 sm:px-4 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" />
          <span className="mono text-accent-green text-[0.85rem] font-bold">
            ✓ PROTOCOL ENGAGED // {lead.status}
          </span>
        </div>
        <span className="mono text-text-tertiary text-[0.72rem]">
          HASH: {lead.slug}
        </span>
      </div>

      {/* Structured Intake Dossier */}
      <div className="mono grid grid-cols-2 gap-3.5 text-[0.78rem] p-4 rounded-md bg-[#0a0f19]/60 border border-border-subtle">
        <div>
          <div className="text-text-tertiary text-[0.68rem]">CLIENT IDENTITY</div>
          <div className="text-text-primary font-semibold mt-1">
            {lead.name}
          </div>
        </div>

        <div>
          <div className="text-text-tertiary text-[0.68rem]">PRIMARY CONTACT</div>
          <div className="text-accent-cyan font-semibold mt-1">
            {lead.contact}
          </div>
        </div>

        <div>
          <div className="text-text-tertiary text-[0.68rem]">BUDGET TIER</div>
          <div className="text-text-primary font-semibold mt-1">
            {lead.budget}
          </div>
        </div>

        <div>
          <div className="text-text-tertiary text-[0.68rem]">SERVICE PIPELINE</div>
          <div className="text-text-primary font-semibold mt-1">
            {lead.serviceType}
          </div>
        </div>

        <div className="col-span-2">
          <div className="text-text-tertiary text-[0.68rem]">SYSTEM SPECIFICATION</div>
          <div className="text-text-secondary mt-1 leading-normal">
            {lead.description}
          </div>
        </div>
      </div>

      {/* Telemetry & Cache Proof */}
      <div className="mono text-[0.72rem] text-text-tertiary flex flex-col gap-1.5">
        <div>• Cache Layer: Browser CacheStorage (TTL: 24h instant rehydration)</div>
        <div>• Redirection: Static URL Slug permalink locked</div>
        <div>• Telegram Dispatch: Delivered to engineering core via webhook</div>
      </div>

      {/* Interactive Actions */}
      <div className="flex gap-3 mt-2 flex-wrap">
        <button
          type="button"
          onClick={onCopy}
          className={`mono flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[0.78rem] font-semibold cursor-pointer transition-all ${
            isCopied
              ? 'bg-green-500/15 text-accent-green border border-accent-green'
              : 'bg-bg-card text-accent-cyan border border-sky-400/40 hover:bg-sky-400/10'
          }`}
        >
          {isCopied ? '✓ PERMALINK COPIED' : '⎘ COPY SLUG PERMALINK'}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="mono px-4 py-2.5 rounded-md bg-transparent text-text-secondary border border-border-subtle text-[0.78rem] cursor-pointer hover:bg-white/5 transition-colors"
        >
          + NEW BRIEF
        </button>
      </div>
    </div>
  );
};
