import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TokenFormSchema, type TokenFormInput } from '../model/auth-schema';

interface BearerTokenCardProps {
  readonly isLoading: boolean;
  readonly onSubmit: (data: TokenFormInput) => void;
}

export const BearerTokenCard: FC<BearerTokenCardProps> = ({
  isLoading,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TokenFormInput>({
    resolver: zodResolver(TokenFormSchema),
    defaultValues: {
      sessionToken: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="auth-token"
          className="mono flex justify-between text-xs text-accent-cyan mb-1.5"
        >
          <span>BEARER SESSION TOKEN</span>
          {errors.sessionToken && (
            <span className="text-accent-danger text-[0.68rem]">
              {errors.sessionToken.message}
            </span>
          )}
        </label>
        <input
          id="auth-token"
          type="text"
          {...register('sessionToken')}
          placeholder="ind_session_7f8a9b0c1d2e3f4a..."
          className={`mono w-full px-4 py-3 rounded-md bg-bg-surface text-text-primary text-[0.85rem] outline-none focus:border-accent-cyan transition-colors ${
            errors.sessionToken
              ? 'border border-accent-danger'
              : 'border border-border-subtle'
          }`}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mono p-3.5 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-[0.85rem] cursor-pointer hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? 'ATTACHING TOKEN...' : 'ATTACH SESSION TOKEN →'}
      </button>
    </form>
  );
};
