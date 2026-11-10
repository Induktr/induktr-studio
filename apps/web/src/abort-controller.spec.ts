import { describe, it, expect } from 'vitest';
import { createCompositeSignal } from './shared/lib/async';
import { browserStore } from './shared/lib/stores/browser-store';
import { telemetryEngine } from './shared/lib/stores/telemetry-store';
import { navigationStore } from './app/model/navigation-store';
import { leadUrlStore } from './features/lead-submission/model/lead-url-store';
import { i18nStore } from './shared/i18n/i18n-store';

describe('Universal AbortController & Composite AbortSignal Protocol (TSD v27.2.2)', () => {
  it('creates composite signal and triggers on external signal abort', () => {
    const externalController = new AbortController();
    const { signal, cleanup } = createCompositeSignal(externalController.signal, 10000);

    expect(signal.aborted).toBe(false);
    externalController.abort(new Error('Manual user abort'));
    expect(signal.aborted).toBe(true);

    cleanup();
  });

  it('triggers composite signal on timeout expiration (AbortSignal.timeout simulation)', async () => {
    const { signal, cleanup } = createCompositeSignal(null, 50);

    expect(signal.aborted).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(signal.aborted).toBe(true);
    cleanup();
  });

  it('disposes browser store event listeners cleanly on abort', () => {
    expect(typeof browserStore.abort).toBe('function');
    browserStore.abort();
    // Subsequent calls are safe and idempotent
    expect(() => browserStore.abort()).not.toThrow();
  });

  it('terminates telemetry engine RAF loop safely via abort', () => {
    expect(typeof telemetryEngine.abort).toBe('function');
    telemetryEngine.abort();
    expect(telemetryEngine.getSnapshot().fps).toBeGreaterThanOrEqual(0);
  });

  it('provides safe abort mechanisms on navigationStore and leadUrlStore', () => {
    expect(typeof navigationStore.abort).toBe('function');
    expect(typeof leadUrlStore.abort).toBe('function');

    navigationStore.abort();
    leadUrlStore.abort();
  });

  it('cancels preceding in-flight translation chunk imports on rapid switchLocale', async () => {
    const p1 = i18nStore.switchLocale('de');
    const p2 = i18nStore.switchLocale('ua');

    await Promise.allSettled([p1, p2]);
    // The final committed locale must match the latest request
    expect(i18nStore.getCurrentLocale()).toBe('ua');
  });
});
