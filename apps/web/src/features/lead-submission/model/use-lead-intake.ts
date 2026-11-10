import { useCallback, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLeadSchema, type CreateLeadInput } from '@induktr/contracts';
import { useAppDispatch, useAppSelector } from '@/app/store';
import {
  selectActiveLead,
  selectIsLinkCopied,
  selectIsRehydrating,
  selectLeadErrorMessage,
  selectLeadNotFound,
  setActiveLead,
  setCopiedLink,
  setErrorMessage,
  setLeadNotFound,
  setRehydrating,
  setSlug,
  resetLeadState,
} from '@/app/store/lead-slice';
import { GET_LEAD_QUERY, graphqlClient } from '@/shared/api';
import { createCompositeSignal, useAbortController } from '@/shared/lib/async';
import { useLeadSlugQueryState } from '@/shared/lib/url';
import { useLeadMutation } from './use-lead-mutation';
import { useLeadUrlStore, leadUrlStore } from './lead-url-store';
import { generateLeadSlug } from '../lib/lead-slug';
import {
  clearLeadFromBrowserCache,
  getLeadFromBrowserCache,
  saveLeadToBrowserCache,
} from '../lib/lead-cache';

const createTimestampIso = (): string => new Date().toISOString();

export function useLeadIntake() {
  const dispatch = useAppDispatch();
  const { submitLead, fetching } = useLeadMutation();

  // 1. Reactive Typed URL Query State via nuqs with synchronous store fallback (ЗЮНУ)
  const [urlSlugQuery, setUrlSlugQuery] = useLeadSlugQueryState();
  const storeSlug = useLeadUrlStore();
  const currentSlug = urlSlugQuery || storeSlug;

  // 2. Redux Atomic Selectors (ИСРМО)
  const activeLead = useAppSelector(selectActiveLead);
  const isRehydrating = useAppSelector(selectIsRehydrating);
  const leadNotFound = useAppSelector(selectLeadNotFound);
  const errorMessage = useAppSelector(selectLeadErrorMessage);
  const copiedLink = useAppSelector(selectIsLinkCopied);

  // 3. React Hook Form with Zod schema contract
  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: {
      name: 'Alex Morgan',
      contact: '@alexmorgan',
      budget: '$5k-$10k',
      description:
        'Build an autonomous research pipeline with multi-agent orchestration, a real-time GraphQL interface, and Telegram delivery. Target: production in 6 weeks.',
      serviceType: 'FULL_CYCLE_ENGINEERING',
    },
  });

  const selectedBudget = useWatch({ control: form.control, name: 'budget' });

  const submitAbort = useAbortController();
  const permalinkAbort = useAbortController();
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  // 4. Rehydration Pipeline with AbortController & Composite Timeout (ОБТНП & TSD v27.2.2)
  useEffect(() => {
    dispatch(setSlug(currentSlug));

    if (!currentSlug) {
      return;
    }

    const controller = new AbortController();
    const { signal, cleanup } = createCompositeSignal(controller.signal, 8000);

    dispatch(setRehydrating(true));

    Promise.try(async () => {
      // Step A: Check Browser Server Cache (CacheStorage API & local mirror)
      const cached = await getLeadFromBrowserCache(currentSlug);
      if (signal.aborted) return;
      if (cached) {
        dispatch(setActiveLead(cached));
        return;
      }

      // Step B: Remote GraphQL fallback query with composite signal
      const result = await graphqlClient
        .query(GET_LEAD_QUERY, { id: currentSlug }, { fetchOptions: { signal } })
        .toPromise();

      if (signal.aborted) return;

      if (result.data?.lead) {
        const remoteLead = result.data.lead;
        const fresh = await saveLeadToBrowserCache(currentSlug, {
          leadId: remoteLead.id,
          name: remoteLead.name,
          contact: remoteLead.contact,
          budget: remoteLead.budget,
          description: remoteLead.description,
          serviceType: 'FULL_CYCLE_ENGINEERING',
          status: remoteLead.status,
          createdAt: remoteLead.createdAt,
        });
        if (!signal.aborted) {
          dispatch(setActiveLead(fresh));
        }
      } else {
        if (!signal.aborted) {
          dispatch(setLeadNotFound(true));
        }
      }
    }).catch((err: unknown) => {
      if (signal.aborted) return;
      dispatch(setErrorMessage(err instanceof Error ? err.message : 'Failed to rehydrate intake'));
      dispatch(setLeadNotFound(true));
    }).finally(() => {
      cleanup();
    });

    return () => {
      controller.abort();
      cleanup();
    };
  }, [currentSlug, dispatch]);

  // 5. Form Submission Pipeline via Promise.try with AbortController (ОБТНП Standard)
  const onSubmit = useCallback(
    async (data: CreateLeadInput) => {
      dispatch(setErrorMessage(null));
      const controller = submitAbort.renew();
      const { signal, cleanup } = createCompositeSignal(controller.signal, 12000);

      await Promise.try(async () => {
        // Step A: Generate dynamic hash slug for incoming lead
        const dynamicSlug = generateLeadSlug();

        // Step B: Submit to API with idempotencyKey = dynamicSlug
        const response = await submitLead(
          {
            name: data.name,
            contact: data.contact,
            budget: data.budget,
            description: data.description,
            serviceType: data.serviceType ?? 'FULL_CYCLE_ENGINEERING',
            referrer: typeof window !== 'undefined' ? window.location.href : undefined,
            idempotencyKey: dynamicSlug,
          },
          { signal },
        );

        if (signal.aborted) return;

        // Step C: Persist in Browser Server Cache
        const cached = await saveLeadToBrowserCache(dynamicSlug, {
          leadId: response?.id || dynamicSlug,
          name: data.name,
          contact: data.contact,
          budget: data.budget,
          description: data.description,
          serviceType: data.serviceType ?? 'FULL_CYCLE_ENGINEERING',
          status: response?.status || 'NEW',
          createdAt: response?.createdAt || createTimestampIso(),
        });

        if (signal.aborted) return;

        // Step D: Commit to Redux and sync external URL
        dispatch(setActiveLead(cached));
        leadUrlStore.setSlug(dynamicSlug);
        void setUrlSlugQuery(dynamicSlug);
      }).catch((err: unknown) => {
        if (signal.aborted) return;
        dispatch(setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch intake protocol'));
      }).finally(() => {
        cleanup();
      });
    },
    [dispatch, submitAbort, submitLead, setUrlSlugQuery],
  );

  // 6. Copy Permalink Action with AbortController-managed timeout
  const onCopyPermalink = useCallback(() => {
    if (typeof window === 'undefined' || !currentSlug) return;
    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    const controller = permalinkAbort.renew();

    Promise.try(async () => {
      const url = `${window.location.origin}/?tab=intake&lead=${encodeURIComponent(currentSlug)}`;
      await navigator.clipboard.writeText(url);
      if (controller.signal.aborted) return;
      dispatch(setCopiedLink(true));

      copyTimerRef.current = setTimeout(() => {
        copyTimerRef.current = null;
        if (!controller.signal.aborted) {
          dispatch(setCopiedLink(false));
        }
      }, 2200);

      controller.signal.addEventListener(
        'abort',
        () => {
          if (copyTimerRef.current !== null) {
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = null;
          }
        },
        { once: true },
      );
    }).catch((err: unknown) => {
      if (controller.signal.aborted) return;
      dispatch(setErrorMessage(err instanceof Error ? err.message : 'Clipboard access denied'));
    });
  }, [currentSlug, dispatch, permalinkAbort]);

  // 7. Reset Terminal Action via Promise.try (ОБТНП)
  const onResetTerminal = useCallback(() => {
    submitAbort.abort();
    permalinkAbort.abort();

    Promise.try(async () => {
      if (currentSlug) {
        await clearLeadFromBrowserCache(currentSlug);
      }
      leadUrlStore.setSlug(null);
      void setUrlSlugQuery(null);
      dispatch(resetLeadState());
      form.reset();
    }).catch((err: unknown) => {
      dispatch(setErrorMessage(err instanceof Error ? err.message : 'Failed to reset terminal'));
    });
  }, [currentSlug, dispatch, form, permalinkAbort, submitAbort, setUrlSlugQuery]);

  return {
    // Redux State
    activeLead,
    currentSlug,
    isRehydrating,
    leadNotFound,
    errorMessage,
    copiedLink,
    isSubmitting: form.formState.isSubmitting || fetching,
    errors: form.formState.errors,
    selectedBudget,

    // Form Controls
    register: form.register,
    handleSubmit: form.handleSubmit,
    setValue: form.setValue,

    // Actions
    onSubmit,
    onCopyPermalink,
    onResetTerminal,
  };
}
