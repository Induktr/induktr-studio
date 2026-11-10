import { type FC, Suspense } from 'react';
import { useLeadIntake } from '../model/use-lead-intake';
import { LeadEngagementOverview } from './lead-engagement-overview';
import { TerminalWindow } from './terminal-window';
import { TerminalRehydratingView, TerminalNotFoundView } from './terminal-state-view';
import { LeadDossierView } from './lead-dossier-view';
import { LeadTerminalForm } from './lead-terminal-form';
import { ErrorBoundary } from '@/shared/ui';

export const LeadForm: FC = () => {
  const {
    activeLead,
    currentSlug,
    isRehydrating,
    leadNotFound,
    errorMessage,
    copiedLink,
    isSubmitting,
    errors,
    selectedBudget,
    register,
    handleSubmit,
    setValue,
    onSubmit,
    onCopyPermalink,
    onResetTerminal,
  } = useLeadIntake();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-12 items-start w-full">
      <LeadEngagementOverview />

      <TerminalWindow slug={currentSlug}>
        <ErrorBoundary key={currentSlug || 'form'}>
          <Suspense fallback={<TerminalRehydratingView message="PREPARING INTAKE CONSOLE STREAM..." />}>
            {isRehydrating && <TerminalRehydratingView />}

            {!isRehydrating && leadNotFound && (
              <TerminalNotFoundView slug={currentSlug} onReset={onResetTerminal} />
            )}

            {!isRehydrating && !leadNotFound && activeLead && (
              <LeadDossierView
                lead={activeLead}
                isCopied={copiedLink}
                onCopy={onCopyPermalink}
                onReset={onResetTerminal}
              />
            )}

            {!isRehydrating && !leadNotFound && !activeLead && (
              <LeadTerminalForm
                register={register}
                handleSubmit={handleSubmit}
                setValue={setValue}
                errors={errors}
                selectedBudget={selectedBudget}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                onSubmit={onSubmit}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </TerminalWindow>
    </div>
  );
};
