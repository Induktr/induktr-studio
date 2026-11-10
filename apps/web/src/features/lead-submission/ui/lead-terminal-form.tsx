import type { FC } from 'react';
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { CreateLeadInput } from '@induktr/contracts';

export interface LeadTerminalFormProps {
  readonly register: UseFormRegister<CreateLeadInput>;
  readonly handleSubmit: UseFormHandleSubmit<CreateLeadInput>;
  readonly setValue: UseFormSetValue<CreateLeadInput>;
  readonly errors: FieldErrors<CreateLeadInput>;
  readonly selectedBudget: string | undefined;
  readonly isSubmitting: boolean;
  readonly errorMessage: string | null;
  readonly onSubmit: (data: CreateLeadInput) => void;
}

const budgetOptions = ['$3k-$5k', '$5k-$10k', '$10k+'] as const;

export const LeadTerminalForm: FC<LeadTerminalFormProps> = ({
  register,
  handleSubmit,
  setValue,
  errors,
  selectedBudget,
  isSubmitting,
  errorMessage,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-7 flex flex-col gap-5"
    >
      {/* Terminal Init Status */}
      <div>
        <div className="mono text-xs text-accent-green font-semibold">
          ✓ Secure session initialized. Awaiting your parameters.
        </div>
        <div className="mono text-[0.7rem] text-text-tertiary mt-1">
          intake-protocol v2.0.4 / all fields required
        </div>
      </div>

      {errorMessage && (
        <div className="mono px-3.5 py-2.5 rounded bg-red-500/10 border border-red-500/30 text-accent-danger text-xs">
          Error: {errorMessage}
        </div>
      )}

      {/* Field 01: Name */}
      <div>
        <label
          htmlFor="lead-name"
          className="mono flex justify-between text-xs text-accent-cyan mb-1.5"
        >
          <span>01 Name</span>
          {errors.name && (
            <span className="text-accent-danger text-[0.68rem]">
              {errors.name.message}
            </span>
          )}
        </label>
        <input
          id="lead-name"
          type="text"
          {...register('name')}
          placeholder="Alex Morgan"
          className={`mono w-full px-4 py-3 rounded-md bg-bg-card text-text-primary text-[0.85rem] outline-none focus:border-accent-cyan transition-colors ${
            errors.name ? 'border border-accent-danger' : 'border border-border-subtle'
          }`}
        />
      </div>

      {/* Field 02: Telegram / Email */}
      <div>
        <label
          htmlFor="lead-contact"
          className="mono flex justify-between text-xs text-accent-cyan mb-1.5"
        >
          <span>02 Telegram/Email</span>
          {errors.contact && (
            <span className="text-accent-danger text-[0.68rem]">
              {errors.contact.message}
            </span>
          )}
        </label>
        <input
          id="lead-contact"
          type="text"
          {...register('contact')}
          placeholder="@alexmorgan"
          className={`mono w-full px-4 py-3 rounded-md bg-bg-card text-text-primary text-[0.85rem] outline-none focus:border-accent-cyan transition-colors ${
            errors.contact ? 'border border-accent-danger' : 'border border-border-subtle'
          }`}
        />
      </div>

      {/* Field 03: Budget Chips Selector */}
      <div>
        <div className="mono flex justify-between text-xs text-accent-cyan mb-1.5">
          <span>03 Target Budget</span>
          {errors.budget && (
            <span className="text-accent-danger text-[0.68rem]">
              {errors.budget.message}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {budgetOptions.map((tier) => {
            const isSelected = selectedBudget === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setValue('budget', tier, { shouldValidate: true })}
                className={`mono py-2.5 px-2 rounded-md text-[0.8rem] font-semibold cursor-pointer transition-all text-center ${
                  isSelected
                    ? 'bg-sky-400/15 text-accent-cyan border border-accent-cyan'
                    : 'bg-bg-card text-text-secondary border border-border-subtle hover:border-sky-400/30'
                }`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* Field 04: System Description */}
      <div>
        <label
          htmlFor="lead-description"
          className="mono flex justify-between text-xs text-accent-cyan mb-1.5"
        >
          <span>04 Architecture Brief / Scope</span>
          {errors.description && (
            <span className="text-accent-danger text-[0.68rem]">
              {errors.description.message}
            </span>
          )}
        </label>
        <textarea
          id="lead-description"
          rows={3}
          {...register('description')}
          placeholder="Describe system goals, scale targets, or current architectural bottlenecks..."
          className={`mono w-full px-4 py-3 rounded-md bg-bg-card text-text-primary text-[0.85rem] outline-none focus:border-accent-cyan transition-colors resize-y leading-relaxed ${
            errors.description ? 'border border-accent-danger' : 'border border-border-subtle'
          }`}
        />
      </div>

      {/* Action Line */}
      <div className="flex items-center justify-between mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="mono inline-flex items-center gap-2.5 px-6 py-3 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold text-[0.85rem] tracking-wider shadow-[0_4px_15px_rgba(38,181,244,0.4)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'DISPATCHING...' : 'DISPATCH INTAKE →'}
        </button>
      </div>

      {/* Command Prompt Line */}
      <div className="mono text-[0.72rem] text-text-tertiary mt-1 flex items-center gap-1.5">
        <span>❯ ready to transmit</span>
        <span className="cursor-blink text-accent-cyan font-black">
          █
        </span>
      </div>
    </form>
  );
};
