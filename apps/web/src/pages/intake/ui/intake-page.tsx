import type { FC } from 'react';
import { useAppSelector } from '@/app/store';
import { selectUserExistsInDb, selectVerifiedIdentifier } from '@/app/store/auth-slice';
import { LeadForm } from '@/features/lead-submission';

export const IntakePage: FC = () => {
  const userExistsInDb = useAppSelector(selectUserExistsInDb);
  const identifier = useAppSelector(selectVerifiedIdentifier);

  return (
    <div className="w-full py-4 flex flex-col gap-6">
      {userExistsInDb === false && (
        <div className="max-w-[780px] mx-auto w-full p-4 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="mono text-xs font-bold text-accent-warning flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-warning animate-pulse" />
              ONBOARDING PROTOCOL ACTIVATED // USER NOT FOUND IN DATABASE
            </div>
            <p className="m-0 text-text-secondary text-[0.82rem] leading-normal">
              Identity <span className="text-text-primary font-semibold">{identifier || 'Guest'}</span> was not found in the studio database registry.
              Submit your engineering brief below to automatically provision your sovereign client profile and session.
            </p>
          </div>
          <span className="mono text-[0.68rem] px-2 py-0.5 rounded bg-amber-500/20 text-accent-warning font-semibold whitespace-nowrap">
            ONBOARDING
          </span>
        </div>
      )}

      <LeadForm />
    </div>
  );
};

