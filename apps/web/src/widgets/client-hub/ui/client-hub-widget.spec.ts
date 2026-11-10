import { describe, expect, it, vi } from 'vitest';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { Provider as ReduxProvider } from 'react-redux';
import { useQuery } from 'urql';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer, type AuthState } from '@/app/store/auth-slice';
import { navigationReducer } from '@/app/store/navigation-slice';
import { useClientHubSectionQueryState } from '@/shared/lib/url';
import { ClientHubWidget } from './client-hub-widget';

vi.mock('urql', async (importOriginal) => {
  const actual = await importOriginal<typeof import('urql')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('@/shared/lib/url', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/url')>();
  return {
    ...actual,
    useClientHubSectionQueryState: vi.fn(() => ['overview', vi.fn()]),
  };
});

// Type-safe Redux Provider wrapper for server-side React 19 test harness
const TestReduxProvider = ReduxProvider as unknown as ComponentType<{
  store: unknown;
  children?: ReactNode;
}>;

describe('ClientHubWidget & Zero-Mock SSG/PostgreSQL Separation', () => {
  const createMockStore = (user?: {
    firstName?: string;
    username?: string;
    role?: 'CLIENT' | 'ADMIN' | 'STUDIO_LEAD';
  }) => {
    const authState: AuthState = {
      isAuthenticated: Boolean(user),
      token: user ? 'mock-token' : null,
      user: user
        ? {
            id: 'usr-1',
            telegramId: '12345678',
            username: user.username ?? 'johndoe',
            firstName: user.firstName ?? 'John Doe',
            role: user.role ?? 'CLIENT',
            createdAt: '2026-10-18T10:00:00Z',
          }
        : null,
      status: 'succeeded',
      error: null,
      authMethod: 'telegram',
      userExistsInDb: Boolean(user),
      verifiedIdentifier: user?.username ?? null,
    };

    return configureStore({
      reducer: {
        auth: authReducer,
        navigation: navigationReducer,
      },
      preloadedState: {
        auth: authState,
        navigation: {
          activeTab: 'client-hub' as const,
        },
      },
    });
  };

  it('renders high-design empty states when user has 0 purchases and 0 orders (zero mock leak)', () => {
    const store = createMockStore({
      firstName: 'Elena Vance',
      username: 'elenavance',
      role: 'CLIENT',
    });

    vi.mocked(useClientHubSectionQueryState).mockReturnValue(['overview', vi.fn()]);

    vi.mocked(useQuery).mockReturnValue([
      {
        data: {
          myPurchases: [],
          myOrders: [],
        },
        fetching: false,
        stale: false,
        hasNext: false,
      },
      vi.fn(),
    ] as unknown as ReturnType<typeof useQuery>);

    const widget = createElement(ClientHubWidget, {});
    const html = renderToString(
      createElement(TestReduxProvider, { store }, widget),
    );

    // 1. Digital Assets Empty State rendered
    expect(html).toContain('NO DIGITAL ASSETS ACQUIRED YET');
    expect(html).toContain('Explore Storefront');

    // 2. Bespoke Pipeline Empty State rendered
    expect(html).toContain('NO ACTIVE BESPOKE CONTRACT');
    expect(html).toContain('Initiate Intake Protocol');

    // 3. Fallbacks should NOT leak
    expect(html).not.toContain('pur-ui-kit-demo');
    expect(html).not.toContain('pur-cheatsheets-demo');
    expect(html).not.toContain('Alex Morgan');
    expect(html).not.toContain('FOUNDER / ORBIT');

    // 4. Dynamic user header & initials
    expect(html).toContain('Elena Vance');
    expect(html).toContain('CLIENT · @elenavance');
    expect(html).toContain('EL'); // Elena -> EL

    // 5. Explicit Data Provenance badge
    expect(html).toContain('DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)');
  });

  it('renders default Studio Client when unauthenticated with no user profile', () => {
    const store = createMockStore();
    vi.mocked(useClientHubSectionQueryState).mockReturnValue(['overview', vi.fn()]);

    vi.mocked(useQuery).mockReturnValue([
      {
        data: {
          myPurchases: [],
          myOrders: [],
        },
        fetching: false,
        stale: false,
        hasNext: false,
      },
      vi.fn(),
    ] as unknown as ReturnType<typeof useQuery>);

    const widget = createElement(ClientHubWidget, {});
    const html = renderToString(
      createElement(TestReduxProvider, { store }, widget),
    );

    expect(html).toContain('Studio Client');
    expect(html).toContain('CLIENT · @unlinked');
    expect(html).toContain('SC'); // Studio Client -> SC
    expect(html).toContain('NO DIGITAL ASSETS ACQUIRED YET');
    expect(html).toContain('NO ACTIVE BESPOKE CONTRACT');
  });

  it('renders dedicated My Assets view when nuqs section is "assets"', () => {
    const store = createMockStore({
      firstName: 'Dmitry',
      username: 'dmitry_dev',
      role: 'CLIENT',
    });

    vi.mocked(useClientHubSectionQueryState).mockReturnValue(['assets', vi.fn()]);

    vi.mocked(useQuery).mockReturnValue([
      {
        data: {
          myPurchases: [
            {
              id: 'pur-101',
              userId: 'usr-1',
              productId: 'prod-1',
              amountUsd: 29,
              status: 'PAID',
              createdAt: '2026-11-01T12:00:00Z',
              product: {
                id: 'prod-1',
                slug: 'modular-ui-kit',
                title: 'Modular UI Kit',
                type: 'UI_KIT',
                priceUsd: 29,
                description: 'OKLCH Radix FSD',
                version: 'v2.0',
              },
            },
          ],
          myOrders: [],
        },
        fetching: false,
        stale: false,
        hasNext: false,
      },
      vi.fn(),
    ] as unknown as ReturnType<typeof useQuery>);

    const widget = createElement(ClientHubWidget, {});
    const html = renderToString(
      createElement(TestReduxProvider, { store }, widget),
    );

    expect(html).toContain('My Assets &amp; Deliverables');
    expect(html).toContain('Modular UI Kit');
    expect(html).toContain('DOWNLOAD ARTIFACT ⭳');
    expect(html).toContain('DM'); // Dmitry -> DM initials
  });

  it('renders dedicated Lab Support view when nuqs section is "support"', () => {
    const store = createMockStore({
      firstName: 'Alice',
      username: 'alice_arch',
      role: 'CLIENT',
    });

    vi.mocked(useClientHubSectionQueryState).mockReturnValue(['support', vi.fn()]);

    vi.mocked(useQuery).mockReturnValue([
      {
        data: { myPurchases: [], myOrders: [] },
        fetching: false,
        stale: false,
        hasNext: false,
      },
      vi.fn(),
    ] as unknown as ReturnType<typeof useQuery>);

    const widget = createElement(ClientHubWidget, {});
    const html = renderToString(
      createElement(TestReduxProvider, { store }, widget),
    );

    expect(html).toContain('Lab Support &amp; Technical Desk');
    expect(html).toContain('Telegram Lab Desk');
    expect(html).toContain('support@induktr.studio');
    expect(html).toContain('AL'); // Alice -> AL initials
  });
});
