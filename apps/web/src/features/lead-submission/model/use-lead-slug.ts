import { parseAsString, useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { isValidLeadSlug } from '../lib/lead-slug';

/**
 * URL state hook for dynamic/static lead slug management via nuqs.
 * Synchronizes ?lead=<slug> with browser URL and history.
 */
export function useLeadSlug() {
  const [slug, setSlugState] = useQueryState(
    'lead',
    parseAsString.withDefault('').withOptions({
      history: 'push',
      shallow: false,
      scroll: false,
    }),
  );

  const setLeadSlug = useCallback(
    async (nextSlug: string | null) => {
      if (!nextSlug) {
        await setSlugState(null);
        return;
      }
      await setSlugState(nextSlug);
    },
    [setSlugState],
  );

  const isValid = isValidLeadSlug(slug);

  return {
    leadSlug: slug || null,
    isValidSlug: isValid,
    setLeadSlug,
  };
}
