import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8';
import {
  VALID_TABS,
  VALID_AUTH_METHODS,
  VALID_LOCALES,
  tabParser,
  authMethodParser,
  redirectParser,
  leadSlugParser,
  localeParser,
  serializeAppUrlParams,
  useTabQueryState,
  useAuthMethodQueryState,
  useRedirectQueryState,
  useLeadSlugQueryState,
  useAppUrlParams,
} from './url-params';

describe('Typed URL Query Engine (nuqs + React Router Standard)', () => {
  describe('Schema & Parser Invariants', () => {
    it('defines the canonical set of valid application tabs', () => {
      expect(VALID_TABS).toEqual([
        'studio',
        'store',
        'cases',
        'systems',
        'client-hub',
        'intake',
        'auth',
        'knowledge',
      ]);
    });

    it('defines the canonical set of supported locales', () => {
      expect(VALID_LOCALES).toEqual(['en', 'ua', 'de', 'ar', 'es']);
    });

    it('defines the canonical set of valid auth methods', () => {
      expect(VALID_AUTH_METHODS).toEqual([
        'telegram',
        'verify-db',
        'demo',
        'token',
      ]);
    });

    it('parses valid tab parameters correctly', () => {
      for (const tab of VALID_TABS) {
        expect(tabParser.parseServerSide(tab)).toBe(tab);
      }
    });

    it('parses valid auth methods and falls back to "telegram" on invalid input', () => {
      for (const method of VALID_AUTH_METHODS) {
        expect(authMethodParser.parseServerSide(method)).toBe(method);
      }
      expect(authMethodParser.parseServerSide('unknown_method')).toBe('telegram');
      expect(authMethodParser.parseServerSide('')).toBe('telegram');
      expect(authMethodParser.parseServerSide(undefined)).toBe('telegram');
    });

    it('parses valid redirect tabs and returns null for invalid tabs', () => {
      for (const tab of VALID_TABS) {
        expect(redirectParser.parseServerSide(tab)).toBe(tab);
      }
      expect(redirectParser.parseServerSide('invalid_tab')).toBeNull();
      expect(redirectParser.parseServerSide('')).toBeNull();
      expect(redirectParser.parseServerSide(undefined)).toBeNull();
    });

    it('sanitizes and falls back to default "auth" on invalid or malicious tabs', () => {
      expect(tabParser.parseServerSide('malicious_injection')).toBe('auth');
      expect(tabParser.parseServerSide('unknown_view')).toBe('auth');
      expect(tabParser.parseServerSide('../etc/passwd')).toBe('auth');
      expect(tabParser.parseServerSide('')).toBe('auth');
      expect(tabParser.parseServerSide(undefined)).toBe('auth');
    });

    it('parses valid lead slug parameters and UUIDv4 queries', () => {
      const slug = 'lead-a1b2c3d4e5';
      expect(leadSlugParser.parseServerSide(slug)).toBe(slug);
      expect(leadSlugParser.parseServerSide('lead-a1b2c3d4')).toBe('lead-a1b2c3d4');
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(leadSlugParser.parseServerSide(uuid)).toBe(uuid);
      expect(leadSlugParser.parseServerSide('')).toBeNull();
      expect(leadSlugParser.parseServerSide(undefined)).toBeNull();
      expect(leadSlugParser.parseServerSide('<script>alert(1)</script>')).toBeNull();
      expect(leadSlugParser.parseServerSide('invalid')).toBeNull();
    });

    it('rejects malicious or malformed lead slug queries', () => {
      expect(leadSlugParser.parseServerSide('<script>alert(1)</script>')).toBeNull();
      expect(leadSlugParser.parseServerSide('invalid')).toBeNull();
      expect(leadSlugParser.parseServerSide('lead-short')).toBeNull();
      expect(leadSlugParser.parseServerSide('lead-toolong123456789012345')).toBeNull();
      expect(leadSlugParser.parseServerSide('lead-xyz!@#$')).toBeNull();
    });

    it('parses supported locales and rejects unsupported ones', () => {
      expect(localeParser.parseServerSide('en')).toBe('en');
      expect(localeParser.parseServerSide('ua')).toBe('ua');
      expect(localeParser.parseServerSide('de')).toBe('de');
      expect(localeParser.parseServerSide('ar')).toBe('ar');
      expect(localeParser.parseServerSide('es')).toBe('es');

      // Unsupported locales parse to null
      expect(localeParser.parseServerSide('fr')).toBeNull();
      expect(localeParser.parseServerSide('it')).toBeNull();
      expect(localeParser.parseServerSide('invalid')).toBeNull();
    });
  });

  describe('Serializer Capabilities (serializeAppUrlParams)', () => {
    it('serializes complete multi-parameter query state into URL query string', () => {
      const query = serializeAppUrlParams({
        tab: 'systems',
        lead: 'lead-a1b2c3d4',
        lang: 'ua',
        method: 'verify-db',
        redirect: 'client-hub',
      });

      expect(query).toContain('tab=systems');
      expect(query).toContain('lead=lead-a1b2c3d4');
      expect(query).toContain('lang=ua');
      expect(query).toContain('method=verify-db');
      expect(query).toContain('redirect=client-hub');
      expect(query.startsWith('?')).toBe(true);
    });

    it('omits null/undefined parameters from the serialized output', () => {
      const query = serializeAppUrlParams({
        tab: 'knowledge',
        lead: null,
        lang: null,
      });

      expect(query).toContain('tab=knowledge');
      expect(query).not.toContain('lead=');
      expect(query).not.toContain('lang=');
    });
  });

  describe('React Router & NuqsAdapter Memory Rendering', () => {
    function TestConsumer() {
      const [tab] = useTabQueryState();
      const [lead] = useLeadSlugQueryState();
      return createElement(
        'div',
        { 'data-testid': 'query-state' },
        `ACTIVE_TAB:${tab}|ACTIVE_LEAD:${lead ?? 'NONE'}`,
      );
    }

    function TestMultiConsumer() {
      const [params] = useAppUrlParams();
      return createElement(
        'div',
        { 'data-testid': 'multi-state' },
        `TAB:${params.tab}|LEAD:${params.lead ?? 'NONE'}|LANG:${params.lang ?? 'NONE'}`,
      );
    }

    function TestAuthConsumer() {
      const [method] = useAuthMethodQueryState();
      const [redirect] = useRedirectQueryState();
      return createElement(
        'div',
        { 'data-testid': 'auth-state' },
        `METHOD:${method}|REDIRECT:${redirect ?? 'NONE'}`,
      );
    }

    it('renders and consumes typed URL parameters within MemoryRouter + NuqsAdapter', () => {
      const html = renderToString(
        createElement(
          MemoryRouter,
          { initialEntries: ['/?tab=systems&lead=lead-a1b2c3d4'] },
          createElement(
            NuqsAdapter,
            null,
            createElement(TestConsumer),
          ),
        ),
      );

      expect(html).toContain('ACTIVE_TAB:systems');
      expect(html).toContain('ACTIVE_LEAD:lead-a1b2c3d4');
    });

    it('automatically sanitizes invalid tabs to "auth" during memory rendering', () => {
      const html = renderToString(
        createElement(
          MemoryRouter,
          { initialEntries: ['/?tab=ILLEGAL_HACK_PARAM'] },
          createElement(
            NuqsAdapter,
            null,
            createElement(TestConsumer),
          ),
        ),
      );

      expect(html).toContain('ACTIVE_TAB:auth');
      expect(html).toContain('ACTIVE_LEAD:NONE');
    });

    it('renders and consumes auth method and redirect query states correctly', () => {
      const html = renderToString(
        createElement(
          MemoryRouter,
          { initialEntries: ['/?tab=auth&method=demo&redirect=client-hub'] },
          createElement(
            NuqsAdapter,
            null,
            createElement(TestAuthConsumer),
          ),
        ),
      );

      expect(html).toContain('METHOD:demo');
      expect(html).toContain('REDIRECT:client-hub');
    });

    it('renders combined multi-parameter hook useAppUrlParams correctly', () => {
      const html = renderToString(
        createElement(
          MemoryRouter,
          { initialEntries: ['/?tab=knowledge&lead=lead-a1b2c3d4&lang=de'] },
          createElement(
            NuqsAdapter,
            null,
            createElement(TestMultiConsumer),
          ),
        ),
      );

      expect(html).toContain('TAB:knowledge');
      expect(html).toContain('LEAD:lead-a1b2c3d4');
      expect(html).toContain('LANG:de');
    });
  });
});
