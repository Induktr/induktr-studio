import { describe, expect, it, vi } from 'vitest';
import { GqlUserRole } from '../ecommerce/dto/ecommerce.dto';
import { AuthResolver } from './auth.resolver';
import type { AuthService } from './auth.service';

describe('AuthResolver', () => {
  const mockAuthService = {
    getMe: vi.fn(),
    authenticateWithTelegram: vi.fn(),
    checkUserExists: vi.fn(),
    registerUser: vi.fn(),
    loginAsDemoFounder: vi.fn(),
  } as unknown as AuthService;

  const resolver = new AuthResolver(mockAuthService);

  it('delegates getMe to AuthService with user id', async () => {
    const mockUser = {
      id: 'usr-1',
      telegramId: '999',
      username: 'client',
      firstName: 'Alex',
      role: GqlUserRole.CLIENT,
      createdAt: new Date().toISOString(),
    };
    vi.mocked(mockAuthService.getMe).mockResolvedValue(mockUser);

    const result = await resolver.getMe({ id: 'usr-1' });
    expect(result).toEqual(mockUser);
    expect(mockAuthService.getMe).toHaveBeenCalledWith('usr-1');
  });

  it('delegates authenticateWithTelegram to AuthService', async () => {
    const mockAuthResponse = {
      token: 'session-token-xyz',
      user: {
        id: 'usr-1',
        role: GqlUserRole.CLIENT,
        createdAt: new Date().toISOString(),
      },
    };
    vi.mocked(mockAuthService.authenticateWithTelegram).mockResolvedValue(mockAuthResponse);

    const result = await resolver.authenticateWithTelegram({ initData: 'query_id=123&hash=abc' });
    expect(result).toEqual(mockAuthResponse);
    expect(mockAuthService.authenticateWithTelegram).toHaveBeenCalledWith('query_id=123&hash=abc');
  });

  it('delegates checkUserExists to AuthService', async () => {
    const mockCheckResult = { exists: true, user: null };
    vi.mocked(mockAuthService.checkUserExists).mockResolvedValue(mockCheckResult);

    const result = await resolver.checkUserExists('user-handle');
    expect(result).toEqual(mockCheckResult);
    expect(mockAuthService.checkUserExists).toHaveBeenCalledWith('user-handle');
  });

  it('delegates registerUser to AuthService', async () => {
    const mockRegisterResult = {
      token: 'session-token-reg',
      user: {
        id: 'usr-new',
        role: GqlUserRole.CLIENT,
        createdAt: new Date().toISOString(),
      },
    };
    vi.mocked(mockAuthService.registerUser).mockResolvedValue(mockRegisterResult);

    const result = await resolver.registerUser({ username: 'reg_user' });
    expect(result).toEqual(mockRegisterResult);
    expect(mockAuthService.registerUser).toHaveBeenCalledWith({ username: 'reg_user' });
  });

  it('delegates loginAsDemoFounder to AuthService', async () => {
    const mockFounderResponse = {
      token: 'session-founder-token',
      user: {
        id: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
        telegramId: '123456789',
        username: 'alexmorgan',
        firstName: 'Alex Morgan',
        email: 'alex@orbit.build',
        role: GqlUserRole.CLIENT,
        createdAt: new Date().toISOString(),
      },
    };
    vi.mocked(mockAuthService.loginAsDemoFounder).mockResolvedValue(mockFounderResponse);

    const result = await resolver.loginAsDemoFounder();
    expect(result).toEqual(mockFounderResponse);
    expect(mockAuthService.loginAsDemoFounder).toHaveBeenCalledTimes(1);
  });
});
