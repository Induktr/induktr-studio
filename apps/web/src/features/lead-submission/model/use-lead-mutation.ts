import { useCallback, useRef } from 'react';
import { useMutation } from 'urql';
import {
  type CreateLeadInput,
  type LeadResponse,
  SUBMIT_LEAD_MUTATION,
} from '@/shared/api';
import { createCompositeSignal } from '@/shared/lib/async';

type HandledResponse = { submitLead: LeadResponse };
type InputAction = { input: CreateLeadInput };

export function useLeadMutation() {
  const [result, executeMutation] = useMutation<
    HandledResponse,
    InputAction
  >(SUBMIT_LEAD_MUTATION);

  const activeControllerRef = useRef<AbortController | null>(null);

  const submitLead = useCallback(
    async (
      input: CreateLeadInput,
      options?: { signal?: AbortSignal; timeoutMs?: number },
    ) => {
      // Cancel previous in-flight lead submission if still running
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeControllerRef.current = controller;

      const { signal, cleanup } = createCompositeSignal(
        options?.signal ?? controller.signal,
        options?.timeoutMs ?? 15000,
      );

      try {
        const res = await Promise.try(async () => {
          if (signal.aborted) {
            throw new DOMException('Submission aborted before dispatch', 'AbortError');
          }
          return await executeMutation({ input }, { fetchOptions: { signal } });
        });

        if (res.error) {
          throw res.error;
        }
        return res.data?.submitLead;
      } finally {
        cleanup();
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
      }
    },
    [executeMutation],
  );

  return {
    submitLead,
    fetching: result.fetching,
    data: result.data?.submitLead,
    error: result.error,
  };
}
