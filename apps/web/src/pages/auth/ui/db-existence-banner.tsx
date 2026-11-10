import type { FC } from 'react';

interface DbExistenceBannerProps {
  readonly userExistsInDb: boolean | null;
  readonly identifier?: string | null;
  readonly isLoading?: boolean;
}

export const DbExistenceBanner: FC<DbExistenceBannerProps> = ({
  userExistsInDb,
  identifier,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="mono p-3 rounded-md bg-sky-500/10 border border-sky-500/30 text-accent-cyan text-xs flex items-center justify-between animate-pulse">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-cyan animate-ping" />
          QUERYING POSTGRESQL CLUSTER // VERIFYING USER EXISTENCE...
        </span>
        <span className="text-[0.68rem] opacity-75">PRISMA 7 POOL</span>
      </div>
    );
  }

  if (userExistsInDb === true) {
    return (
      <div className="mono p-3.5 rounded-md bg-green-500/10 border border-green-500/30 text-accent-green text-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-bold">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" />
            USER RECORD FOUND IN DATABASE
          </span>
          <span className="text-[0.7rem] bg-green-500/20 px-2 py-0.5 rounded">
            DB_EXISTS: TRUE
          </span>
        </div>
        <p className="m-0 text-text-secondary text-[0.78rem]">
          Identity <span className="text-text-primary font-semibold">{identifier || 'current session'}</span> confirmed in PostgreSQL.
          Routing sovereign session to Client Hub workspace.
        </p>
      </div>
    );
  }

  if (userExistsInDb === false) {
    return (
      <div className="mono p-3.5 rounded-md bg-amber-500/10 border border-amber-500/35 text-accent-warning text-xs flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-bold">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-warning shadow-[0_0_8px_var(--accent-warning)]" />
            RECORD NOT FOUND IN STUDIO DATABASE
          </span>
          <span className="text-[0.7rem] bg-amber-500/20 px-2 py-0.5 rounded text-accent-warning">
            DB_EXISTS: FALSE
          </span>
        </div>
        <p className="m-0 text-text-secondary text-[0.78rem]">
          Identifier <span className="text-text-primary font-semibold">{identifier || 'unregistered guest'}</span> does not exist in PostgreSQL.
          Redirecting to Intake Onboarding Protocol to provision sovereign identity.
        </p>
      </div>
    );
  }

  return null;
};
