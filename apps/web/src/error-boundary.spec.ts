import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ErrorBoundary, ErrorBoundaryFallbackView } from './shared/ui/error-boundary/error-boundary';
import { WidgetSuspenseFallback } from './shared/ui/suspense-fallback/suspense-fallback';

describe('Functional React 19 ErrorBoundary & Suspense Fallbacks (Fault Isolation Standard)', () => {
  it('renders children when no error occurs', () => {
    const html = renderToString(
      createElement(
        ErrorBoundary,
        null,
        createElement('div', { id: 'child' }, 'Healthy Subsystem Content'),
      ),
    );

    expect(html).toContain('Healthy Subsystem Content');
  });

  it('renders cyber-tactical fallback view with fault message', () => {
    const resetSpy = vi.fn();
    const error = new Error('SIMULATED_NETWORK_FAULT_V8');

    const html = renderToString(
      createElement(ErrorBoundaryFallbackView, {
        error,
        resetErrorBoundary: resetSpy,
      }),
    );

    expect(html).toContain('RUNTIME FAULT ISOLATED');
    expect(html).toContain('Sub-System Boundary Preserved');
    expect(html).toContain('SIMULATED_NETWORK_FAULT_V8');
    expect(html).toContain('RE-INITIALIZE COMPONENT');
  });

  it('supports custom functional fallback in ErrorBoundaryFallbackView', () => {
    const resetSpy = vi.fn();
    const error = new Error('CUSTOM_ANOMALY');

    const html = renderToString(
      createElement(ErrorBoundaryFallbackView, {
        error,
        resetErrorBoundary: resetSpy,
        customFallback: (err: Error) =>
          createElement('div', { id: 'custom-fallback' }, `Recovered: ${err.message}`),
      }),
    );

    expect(html).toContain('Recovered: CUSTOM_ANOMALY');
  });

  it('supports static ReactNode fallback in ErrorBoundaryFallbackView', () => {
    const resetSpy = vi.fn();
    const error = new Error('STATIC_FALLBACK_TEST');

    const html = renderToString(
      createElement(ErrorBoundaryFallbackView, {
        error,
        resetErrorBoundary: resetSpy,
        customFallback: createElement('div', { id: 'static' }, 'Static Error View'),
      }),
    );

    expect(html).toContain('Static Error View');
  });

  it('renders WidgetSuspenseFallback with custom label and streaming indicator', () => {
    const html = renderToString(
      createElement(WidgetSuspenseFallback, {
        label: 'TESTING CONCURRENT STREAMING...',
      }),
    );

    expect(html).toContain('TESTING CONCURRENT STREAMING...');
    expect(html).toContain('CONCURRENT STREAMING • BUN 1.4 ENGINE');
  });
});
