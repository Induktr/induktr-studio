import { describe, expect, it } from 'vitest';
import { GET_LEADS_QUERY, SUBMIT_LEAD_MUTATION, graphqlClient } from './shared/api';
import { store } from './app/store';
import { logout, setCredentials } from './app/store/auth-slice';
import { telemetryEngine, SIN_LUT, STATIC_BASE_BARS } from './shared/lib/stores/telemetry-store';

describe('Web Client Toolchain & FSD Architecture', () => {
  it('initializes urql client with query and mutation capability', () => {
    expect(graphqlClient).toBeDefined();
    expect(typeof graphqlClient.executeQuery).toBe('function');
    expect(typeof graphqlClient.executeMutation).toBe('function');
  });

  it('contains valid Code-First GraphQL mutations and queries', () => {
    expect(SUBMIT_LEAD_MUTATION).toContain('mutation SubmitLead');
    expect(SUBMIT_LEAD_MUTATION).toContain('submitLead(input: $input)');
    expect(GET_LEADS_QUERY).toContain('query GetLeads');
    expect(GET_LEADS_QUERY).toContain('leads');
  });

  it('manages authentication state via Redux Toolkit store', () => {
    expect(store.getState().auth.isAuthenticated).toBe(false);

    store.dispatch(
      setCredentials({
        token: 'test_token_hex_12345',
        user: {
          id: 'user-uuid-1',
          telegramId: '123456789',
          username: 'tech_founder',
          firstName: 'Nikita',
          email: 'founder@induktr.studio',
          role: 'CLIENT',
          createdAt: new Date().toISOString(),
        },
      }),
    );

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.token).toBe('test_token_hex_12345');
    expect(store.getState().auth.user?.username).toBe('tech_founder');

    store.dispatch(logout());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.token).toBeNull();
  });

  it('provides zero-lag telemetry stream for useSyncExternalStore', () => {
    const snapshot = telemetryEngine.getSnapshot();
    expect(snapshot).toBeDefined();
    expect(typeof snapshot.hudAngle).toBe('number');
    expect(typeof snapshot.coordX).toBe('number');
    expect(Array.isArray(snapshot.equalizerBars)).toBe(true);
    expect(snapshot.equalizerBars.length).toBe(16);
    expect(SIN_LUT).toBeInstanceOf(Float32Array);
    expect(SIN_LUT.length).toBe(256);
    expect(STATIC_BASE_BARS.length).toBe(16);

    const serverSnapshot = telemetryEngine.getServerSnapshot();
    expect(serverSnapshot).toBeDefined();
    expect(Object.isFrozen(serverSnapshot)).toBe(true);
    expect(serverSnapshot.fps).toBe(60);
  });
});
