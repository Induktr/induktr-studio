import { beforeEach, describe, expect, it } from 'vitest';
import {
  generateLeadSlug,
  isValidLeadSlug,
  formatLeadSlug,
} from './features/lead-submission/lib/lead-slug';
import {
  saveLeadToBrowserCache,
  getLeadFromBrowserCache,
  clearLeadFromBrowserCache,
  getLastActiveLeadSlug,
  pruneExpiredEntries,
} from './features/lead-submission/lib/lead-cache';
import { GET_LEAD_QUERY } from './shared/api';

describe('Dynamic Lead Slugs & Browser Server Cache', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('generates cryptographic/deterministic slugs in correct format', () => {
    const slug1 = generateLeadSlug();
    const slug2 = generateLeadSlug();

    expect(slug1).toMatch(/^lead-[a-f0-9]{8,16}$/i);
    expect(slug2).toMatch(/^lead-[a-f0-9]{8,16}$/i);
    expect(slug1).not.toBe(slug2);
  });

  it('validates lead slug syntax with strict regex', () => {
    expect(isValidLeadSlug('lead-a7f92e41')).toBe(true);
    expect(isValidLeadSlug('lead-12345678')).toBe(true);
    expect(isValidLeadSlug('invalid-slug')).toBe(false);
    expect(isValidLeadSlug('')).toBe(false);
    expect(isValidLeadSlug(null)).toBe(false);
    expect(isValidLeadSlug(undefined)).toBe(false);
  });

  it('formats lead slug into high-visibility tactical uppercase', () => {
    expect(formatLeadSlug('lead-a7f92e41')).toBe('LEAD-A7F92E41');
  });

  it('stores and retrieves lead payload from browser cache with TTL', async () => {
    const slug = 'lead-test9999';
    const sampleData = {
      leadId: 'uuid-test-lead',
      name: 'Alex Morgan',
      contact: '@alexmorgan',
      budget: '$5k-$10k',
      description: 'Autonomous multi-agent research pipeline',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      status: 'NEW',
      createdAt: '2026-10-26T12:00:00.000Z',
    };

    const cached = await saveLeadToBrowserCache(slug, sampleData, 5000);
    expect(cached.slug).toBe(slug);
    expect(cached.name).toBe('Alex Morgan');
    expect(cached.expiresAt).toBeGreaterThan(Date.now());
    expect(Object.isFrozen(cached)).toBe(true);

    // Retrieve from cache
    const retrieved = await getLeadFromBrowserCache(slug);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.slug).toBe(slug);
    expect(retrieved?.contact).toBe('@alexmorgan');
    expect(retrieved?.budget).toBe('$5k-$10k');
    expect(Object.isFrozen(retrieved)).toBe(true);
    expect(getLastActiveLeadSlug()).toBe(slug);
  });

  it('expires and removes stale cached leads past TTL', async () => {
    const slug = 'lead-expired11';
    const sampleData = {
      leadId: 'uuid-expired',
      name: 'Old Lead',
      contact: '@old',
      budget: '$3k-$5k',
      description: 'Old brief',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      status: 'NEW',
      createdAt: '2026-10-20T12:00:00.000Z',
    };

    // Save with negative TTL (already expired)
    await saveLeadToBrowserCache(slug, sampleData, -1000);

    const retrieved = await getLeadFromBrowserCache(slug);
    expect(retrieved).toBeNull();
  });

  it('clears lead and removes active session tracker', async () => {
    const slug = 'lead-toclear22';
    await saveLeadToBrowserCache(slug, {
      leadId: 'uuid-toclear',
      name: 'Clear Me',
      contact: '@clear',
      budget: '$10k+',
      description: 'Brief',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      status: 'QUALIFIED',
      createdAt: '2026-10-26T12:00:00.000Z',
    });

    expect(getLastActiveLeadSlug()).toBe(slug);

    await clearLeadFromBrowserCache(slug);
    const retrieved = await getLeadFromBrowserCache(slug);
    expect(retrieved).toBeNull();
    expect(getLastActiveLeadSlug()).toBeNull();
  });

  it('includes GET_LEAD_QUERY for zero-divergence GraphQL queries', () => {
    expect(GET_LEAD_QUERY).toContain('query GetLead');
    expect(GET_LEAD_QUERY).toContain('lead(id: $id)');
    expect(GET_LEAD_QUERY).toContain('status');
  });

  it('manages lead intake state via Redux Toolkit atomic selectors (ИСРМО standard)', async () => {
    const { store } = await import('./app/store');
    const {
      setSlug,
      setActiveLead,
      setCopiedLink,
      resetLeadState,
      selectActiveLead,
      selectCurrentLeadSlug,
      selectIsLinkCopied,
    } = await import('./app/store/lead-slice');

    store.dispatch(setSlug('lead-redux-test'));
    expect(selectCurrentLeadSlug(store.getState())).toBe('lead-redux-test');

    const sampleLead = {
      slug: 'lead-redux-test',
      leadId: 'id-123',
      name: 'Redux User',
      contact: '@redux',
      budget: '$10k+',
      description: 'Pipeline',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      status: 'NEW',
      createdAt: '2026-10-26T12:00:00Z',
      cachedAt: Date.now(),
      expiresAt: Date.now() + 100000,
    };

    store.dispatch(setActiveLead(sampleLead));
    expect(selectActiveLead(store.getState())?.name).toBe('Redux User');

    store.dispatch(setCopiedLink(true));
    expect(selectIsLinkCopied(store.getState())).toBe(true);

    store.dispatch(resetLeadState());
    expect(selectActiveLead(store.getState())).toBeNull();
    expect(selectCurrentLeadSlug(store.getState())).toBeNull();
    expect(selectIsLinkCopied(store.getState())).toBe(false);
  });

  it('provides zero-tearing external URL snapshot via leadUrlStore (ЗЮНУ standard)', async () => {
    const { leadUrlStore } = await import('./features/lead-submission/model/lead-url-store');

    expect(typeof leadUrlStore.subscribe).toBe('function');
    expect(typeof leadUrlStore.getSnapshot).toBe('function');
    expect(typeof leadUrlStore.getServerSnapshot).toBe('function');
    expect(leadUrlStore.getServerSnapshot()).toBeNull();
  });

  it('actively prunes expired entries from browser cache storage mirror', async () => {
    const expiredSlug = 'lead-expired111';
    const validSlug = 'lead-valid222';
    const sampleData = {
      leadId: 'uuid-prune',
      name: 'Prune Test',
      contact: '@prune',
      budget: '$5k-$10k',
      description: 'Pruning test',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      status: 'NEW',
      createdAt: '2026-10-26T12:00:00.000Z',
    };

    await saveLeadToBrowserCache(expiredSlug, sampleData, -1000);
    await saveLeadToBrowserCache(validSlug, sampleData, 60000);

    pruneExpiredEntries();

    expect(await getLeadFromBrowserCache(expiredSlug)).toBeNull();
    const validResult = await getLeadFromBrowserCache(validSlug);
    expect(validResult).not.toBeNull();
    expect(validResult?.slug).toBe(validSlug);
  });

  it('manages application tab navigation via Redux navigationSlice and navigationStore', async () => {
    const { store } = await import('./app/store');
    const { setActiveTab, selectActiveTab, selectFooterSubtext } = await import('./app/store/navigation-slice');
    const { navigationStore } = await import('./app/model/navigation-store');

    store.dispatch(setActiveTab('knowledge'));
    expect(selectActiveTab(store.getState())).toBe('knowledge');
    expect(selectFooterSubtext(store.getState())).toContain('KNOWLEDGE');

    store.dispatch(setActiveTab('studio'));
    expect(selectActiveTab(store.getState())).toBe('studio');
    expect(selectFooterSubtext(store.getState())).toContain('ENGINEERED IN THE LAB');

    expect(typeof navigationStore.subscribe).toBe('function');
    expect(typeof navigationStore.getSnapshot).toBe('function');
    expect(typeof navigationStore.navigate).toBe('function');
    expect(navigationStore.getServerSnapshot().tab).toBe('studio');
  });

  it('manages URL lead slug subscription via createLeadUrlStore without throwaway array allocations', async () => {
    const { createLeadUrlStore } = await import('./features/lead-submission/model/lead-url-store');
    const store = createLeadUrlStore();

    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount++;
    });

    expect(store.getSnapshot()).toBeNull();
    expect(store.getServerSnapshot()).toBeNull();

    store.setSlug('lead-abc12345');
    expect(notificationCount).toBe(1);
    unsubscribe();
    store.abort();
  });
});
