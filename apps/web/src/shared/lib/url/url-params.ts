/**
 * ============================================================================
 * Induktr Studio v2.0 — Typed URL Query Engine (nuqs + React Router)
 * Replaces fragile raw `new URLSearchParams()` with validated nuqs parsers.
 * Eliminates type coercion bugs, invalid tab crashes, and teardown desyncs.
 * ============================================================================
 */
import {
  createParser,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
  createSerializer,
} from 'nuqs';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/shared/i18n';

export type AppTab =
  | 'studio'
  | 'store'
  | 'cases'
  | 'systems'
  | 'client-hub'
  | 'intake'
  | 'auth'
  | 'knowledge';

export const VALID_TABS: readonly AppTab[] = [
  'studio',
  'store',
  'cases',
  'systems',
  'client-hub',
  'intake',
  'auth',
  'knowledge',
];

export type AuthMethod = 'telegram' | 'verify-db' | 'demo' | 'token';

export const VALID_AUTH_METHODS: readonly AuthMethod[] = [
  'telegram',
  'verify-db',
  'demo',
  'token',
];

export type ClientHubSection = 'overview' | 'assets' | 'milestones' | 'billing' | 'support';

export const VALID_CLIENT_HUB_SECTIONS: readonly ClientHubSection[] = [
  'overview',
  'assets',
  'milestones',
  'billing',
  'support',
];

export const VALID_LOCALES: readonly SupportedLocale[] = SUPPORTED_LOCALES;

/**
 * Type-Safe Client Hub Section Parser with fallback to 'overview'
 */
export const clientHubSectionParser = parseAsStringEnum<ClientHubSection>(
  VALID_CLIENT_HUB_SECTIONS as ClientHubSection[],
)
  .withDefault('overview')
  .withOptions({
    shallow: true,
    history: 'push',
  });

/**
 * Type-Safe Tab Parser with fallback to 'auth'
 * Replaces untyped `searchParams.get('tab')`
 */
export const tabParser = parseAsStringEnum<AppTab>(VALID_TABS as AppTab[])
  .withDefault('auth')
  .withOptions({
    shallow: true,
    history: 'push',
  });

/**
 * Type-Safe Auth Method Parser
 */
export const authMethodParser = parseAsStringEnum<AuthMethod>(VALID_AUTH_METHODS as AuthMethod[])
  .withDefault('telegram')
  .withOptions({
    shallow: true,
    history: 'push',
  });

/**
 * Type-Safe Redirect Tab Parser
 */
export const redirectParser = parseAsStringEnum<AppTab>(VALID_TABS as AppTab[])
  .withOptions({
    shallow: true,
  });

export const LEAD_SLUG_REGEX =
  /^(?:lead-[a-f0-9]{8,16}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/i;

/**
 * Type-Safe Lead Slug Parser with Strict Validation
 * Replaces plain parseAsString with regex-validated parser
 */
export const leadSlugParser = createParser({
  parse: (query: string) => {
    const trimmed = query.trim();
    return LEAD_SLUG_REGEX.test(trimmed) ? trimmed.toLowerCase() : null;
  },
  serialize: (value: string) => value,
}).withOptions({
  shallow: true,
  history: 'push',
});

/**
 * Type-Safe Locale Query Parser
 */
export const localeParser = parseAsStringEnum<SupportedLocale>(VALID_LOCALES as SupportedLocale[])
  .withOptions({
    shallow: true,
  });

/**
 * Centralized App Search Params Schema for nuqs
 */
export const appUrlSearchParams = {
  tab: tabParser,
  section: clientHubSectionParser,
  lead: leadSlugParser,
  lang: localeParser,
  method: authMethodParser,
  redirect: redirectParser,
};

export const serializeAppUrlParams = createSerializer(appUrlSearchParams);

/**
 * React Hook for Client Hub Sub-Section via nuqs
 */
export function useClientHubSectionQueryState() {
  return useQueryState('section', clientHubSectionParser);
}

/**
 * React Hook for Atomic Tab URL Navigation via nuqs
 */
export function useTabQueryState() {
  return useQueryState('tab', tabParser);
}

/**
 * React Hook for Auth Sub-Method in URL via nuqs
 */
export function useAuthMethodQueryState() {
  return useQueryState('method', authMethodParser);
}

/**
 * React Hook for Redirect Destination in URL via nuqs
 */
export function useRedirectQueryState() {
  return useQueryState('redirect', redirectParser);
}

/**
 * React Hook for Lead Slug in URL via nuqs
 */
export function useLeadSlugQueryState() {
  return useQueryState('lead', leadSlugParser);
}

/**
 * Unified Hook for all App URL Parameters
 */
export function useAppUrlParams() {
  return useQueryStates(appUrlSearchParams);
}
