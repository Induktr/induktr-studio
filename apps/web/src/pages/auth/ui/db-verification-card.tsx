import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DbVerificationSchema,
  type DbVerificationInput,
} from '../model/auth-schema';

interface DbVerificationCardProps {
  readonly isLoading: boolean;
  readonly onVerify: (data: DbVerificationInput) => void;
  readonly onSimulateUnregistered: () => void;
}

export const DbVerificationCard: FC<DbVerificationCardProps> = ({
  isLoading,
  onVerify,
  onSimulateUnregistered,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DbVerificationInput>({
    resolver: zodResolver(DbVerificationSchema),
    defaultValues: {
      identifier: 'alexmorgan',
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="p-5 rounded-md bg-bg-surface border border-border-subtle flex flex-col gap-2">
        <div className="font-extrabold text-[0.95rem] text-text-primary">
          Database Identity Existence Check
        </div>
        <p className="m-0 text-[0.85rem] text-text-secondary">
          Enter an identifier to query PostgreSQL: if the user exists in the database, you will be routed directly to the{' '}
          <span className="text-accent-cyan font-semibold">Client Hub</span>. If not found, you will be routed to the{' '}
          <span className="text-accent-cyan font-semibold">Intake Onboarding Protocol</span> to register.
        </p>
      </div>

      <form onSubmit={handleSubmit(onVerify)} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="db-identifier"
            className="mono flex justify-between text-xs text-accent-cyan mb-1.5"
          >
            <span>TELEGRAM ID / USERNAME / EMAIL</span>
            {errors.identifier && (
              <span className="text-accent-danger text-[0.68rem]">
                {errors.identifier.message}
              </span>
            )}
          </label>
          <input
            id="db-identifier"
            type="text"
            {...register('identifier')}
            placeholder="e.g. alexmorgan or 123456789 or alex@orbit.build"
            className={`mono w-full px-4 py-3 rounded-md bg-bg-surface text-text-primary text-[0.85rem] outline-none focus:border-accent-cyan transition-colors ${
              errors.identifier ? 'border border-accent-danger' : 'border border-border-subtle'
            }`}
          />
        </div>

        {/* Quick Test Presets */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="mono text-text-tertiary self-center text-[0.72rem]">QUICK TEST:</span>
          <button
            type="button"
            onClick={() => setValue('identifier', 'alexmorgan')}
            className="mono px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-accent-cyan hover:bg-sky-500/20 cursor-pointer"
          >
            alexmorgan (Exists)
          </button>
          <button
            type="button"
            onClick={() => setValue('identifier', 'nonexistent_client_99')}
            className="mono px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-accent-warning hover:bg-amber-500/20 cursor-pointer"
          >
            nonexistent_client_99 (Not In DB)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="mono p-3.5 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-[0.85rem] cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'QUERYING DB...' : 'VERIFY IN DATABASE →'}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onSimulateUnregistered}
            className="mono p-3.5 rounded-md bg-bg-surface border border-border-subtle text-text-secondary font-bold text-[0.85rem] cursor-pointer hover:text-text-primary hover:border-accent-warning transition-colors"
          >
            TEST "NOT IN DB" FLOW ↗
          </button>
        </div>
      </form>
    </div>
  );
};
