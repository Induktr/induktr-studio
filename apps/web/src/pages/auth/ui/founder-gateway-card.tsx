import type { FC } from 'react';

interface FounderGatewayCardProps {
  readonly isLoading: boolean;
  readonly onVerifiedClick: () => void;
  readonly onUnregisteredClick: () => void;
}

export const FounderGatewayCard: FC<FounderGatewayCardProps> = ({
  isLoading,
  onVerifiedClick,
  onUnregisteredClick,
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Option 1: Existing Database User */}
      <div className="p-5 rounded-md bg-bg-surface border border-sky-400/30 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-extrabold text-[0.95rem] text-text-primary">
              Alex Morgan / Orbit Founder Profile
            </div>
            <div className="mono text-xs text-accent-cyan mt-0.5">
              ● VERIFIED IN DATABASE • 2 OWNED ASSETS • 3/4 MILESTONES
            </div>
          </div>
          <span className="mono text-[0.68rem] px-2 py-0.5 rounded bg-green-500/15 border border-green-500/30 text-accent-green font-bold">
            EXISTS IN DB
          </span>
        </div>
        <p className="m-0 text-[0.85rem] text-text-secondary">
          Simulates an existing, registered client with recorded transactions and active telemetry. Routes straight to Client Hub.
        </p>

        <button
          type="button"
          disabled={isLoading}
          onClick={onVerifiedClick}
          className="mono p-3 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-[0.85rem] shadow-[0_4px_16px_rgba(38,181,244,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
        >
          {isLoading ? 'INITIALIZING...' : 'INITIALIZE AS ALEX MORGAN (EXISTS IN DB) →'}
        </button>
      </div>

      {/* Option 2: Unregistered Visitor (Not in Database) */}
      <div className="p-5 rounded-md bg-bg-surface border border-amber-500/30 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-extrabold text-[0.95rem] text-text-primary">
              Unregistered Visitor Simulation
            </div>
            <div className="mono text-xs text-accent-warning mt-0.5">
              ○ NOT IN DATABASE • NO PREVIOUS COMMITS
            </div>
          </div>
          <span className="mono text-[0.68rem] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-accent-warning font-bold">
            NOT IN DB
          </span>
        </div>
        <p className="m-0 text-[0.85rem] text-text-secondary">
          Simulates a visitor who does not exist in the database. Verifies automatic routing to the Intake Onboarding view.
        </p>

        <button
          type="button"
          disabled={isLoading}
          onClick={onUnregisteredClick}
          className="mono p-3 rounded-md bg-amber-500/15 border border-amber-500/40 text-accent-warning font-extrabold text-[0.85rem] hover:bg-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          {isLoading ? 'VERIFYING...' : 'TEST UNREGISTERED VISITOR (ROUTE TO INTAKE) ↗'}
        </button>
      </div>
    </div>
  );
};
