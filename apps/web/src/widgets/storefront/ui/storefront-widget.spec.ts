import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useQuery } from 'urql';
import { StorefrontWidget } from './storefront-widget';

vi.mock('urql', async (importOriginal) => {
  const actual = await importOriginal<typeof import('urql')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('StorefrontWidget Category Filters & Rich Fallbacks', () => {
  it('renders category filter tabs with dynamic counts and rich turnkey products', () => {
    vi.mocked(useQuery).mockReturnValue([
      {
        data: null,
        fetching: false,
        stale: false,
        hasNext: false,
      },
      vi.fn(),
    ] as unknown as ReturnType<typeof useQuery>);

    const html = renderToString(createElement(StorefrontWidget, {}));

    // Check Filter tabs
    expect(html).toContain('ALL');
    expect(html).toContain('APPS &amp; SITES');
    expect(html).toContain('UI KITS');
    expect(html).toContain('CHEATSHEETS');
    expect(html).toContain('SERVICES');

    // Check Fallback Products
    expect(html).toContain('Sovereign SaaS Starter Platform');
    expect(html).toContain('High-Performance Headless Storefront');
    expect(html).toContain('Modular UI Kit v2.0');
    expect(html).toContain('Architecture Cheatsheets v1.4');
    expect(html).toContain('Full-Cycle Architecture Audit &amp; Consultation');

    // Check CTAs
    expect(html).toContain('Telegram Checkout ✈');
    expect(html).toContain('Buy &amp; Customize ⚡');
    expect(html).toContain('Card &amp; Crypto 💳');
  });
});
