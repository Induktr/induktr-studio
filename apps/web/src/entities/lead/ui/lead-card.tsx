import type { Lead } from '../model/types';
import type { FC } from 'react';

interface LeadCardProps {
  readonly lead: Lead;
}

export const LeadCard: FC<LeadCardProps> = ({ lead }) => {
  return (
    <div className="p-5 rounded-[10px] bg-bg-surface border border-border-subtle">
      <div className="flex justify-between items-center mb-2">
        <h4 className="m-0 text-[1.1rem] font-bold text-text-primary">{lead.name}</h4>
        <span className="text-xs px-2 py-1 rounded-full bg-bg-card text-accent-cyan border border-border-subtle font-medium">
          {lead.status}
        </span>
      </div>
      <p className="m-0 mb-2 text-text-secondary text-[0.85rem]">
        <strong className="text-text-primary">Contact:</strong> {lead.contact} | <strong className="text-text-primary">Budget:</strong> {lead.budget}
      </p>
      <p className="m-0 text-[0.9rem] text-text-primary">
        {lead.description || "Don't typing description yet."}
      </p>
    </div>
  );
};
