import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Header } from './header';

describe('Header Widget & Accessible Auth Pill (ЗЮНУ & А11Y Standard)', () => {
  it('renders interactive authentication required button when user is unauthenticated', () => {
    const onTabChange = vi.fn();
    const html = renderToString(
      createElement(Header, {
        activeTab: 'studio',
        onTabChange,
        userVerified: false,
      }),
    );

    expect(html).toContain('AUTHENTICATION REQUIRED');
    expect(html).toContain('aria-label="AUTHENTICATION REQUIRED"');
    expect(html).toContain('type="button"');
  });

  it('renders interactive verified profile button when user is authenticated', () => {
    const onTabChange = vi.fn();
    const html = renderToString(
      createElement(Header, {
        activeTab: 'client-hub',
        onTabChange,
        userVerified: true,
        username: 'ALEX MORGAN',
      }),
    );

    expect(html).toContain('ALEX MORGAN / VERIFIED');
    expect(html).toContain('aria-label="ALEX MORGAN / VERIFIED"');
    expect(html).toContain('text-accent-green');
  });

  it('renders active lead order badge when activeLeadSlug is present', () => {
    const onTabChange = vi.fn();
    const html = renderToString(
      createElement(Header, {
        activeTab: 'intake',
        onTabChange,
        activeLeadSlug: 'lead-a1b2c3d4',
      }),
    );

    expect(html).toContain('ORDER:');
    expect(html).toContain('lead-a1b2c3d4');
  });

  it('renders all 5 center navigation items with Store and Cases', () => {
    const onTabChange = vi.fn();
    const html = renderToString(
      createElement(Header, {
        activeTab: 'store',
        onTabChange,
      }),
    );

    expect(html).toContain('Studio');
    expect(html).toContain('Store');
    expect(html).toContain('Cases');
    expect(html).toContain('Systems');
    expect(html).toContain('Client Hub');
  });
});
