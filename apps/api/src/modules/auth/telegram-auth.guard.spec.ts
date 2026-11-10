import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { TelegramAuthGuard } from './telegram-auth.guard';

describe('TelegramAuthGuard', () => {
  const BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

  function createMockContext(headers: Record<string, string | undefined>): {
    context: ExecutionContext;
    req: Record<string, unknown>;
  } {
    const req: Record<string, unknown> = { headers };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getType: () => 'http',
      getClass: () => TelegramAuthGuard,
      getHandler: () => ({}),
      getArgs: () => [req],
      getArgByIndex: () => req,
      switchToRpc: () => ({}) as never,
      switchToWs: () => ({}) as never,
    } as unknown as ExecutionContext;

    return { context, req };
  }

  function generateValidInitData(overrides: { authDateOffsetSec?: number; botToken?: string } = {}): string {
    const token = overrides.botToken ?? BOT_TOKEN;
    const authDate = Math.floor(Date.now() / 1000) - (overrides.authDateOffsetSec ?? 0);
    const userPayload = JSON.stringify({
      id: 99999,
      first_name: 'Nikita',
      username: 'founder_tech',
      malicious_field: 'INJECTION_ATTEMPT',
    });

    const params = new URLSearchParams({
      auth_date: String(authDate),
      query_id: 'AAG7U18_AAAAAD',
      user: userPayload,
    });

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(token).digest();
    const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    params.set('hash', hash);

    return params.toString();
  }

  it('throws UnauthorizedException when initData header is missing', () => {
    const mockConfig = { get: () => BOT_TOKEN } as unknown as ConfigService;
    const guard = new TelegramAuthGuard(mockConfig);
    const { context } = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when TELEGRAM_BOT_TOKEN is not configured', () => {
    const mockConfig = { get: () => undefined } as unknown as ConfigService;
    const guard = new TelegramAuthGuard(mockConfig);
    const { context } = createMockContext({
      'x-telegram-init-data': 'auth_date=1&hash=abc',
    });

    expect(() => guard.canActivate(context)).toThrow('TELEGRAM_BOT_TOKEN not configured');
  });

  it('rejects initData older than 86400 seconds (replay attack protection)', () => {
    const mockConfig = { get: () => BOT_TOKEN } as unknown as ConfigService;
    const guard = new TelegramAuthGuard(mockConfig);

    // 86500 seconds old
    const expiredInitData = generateValidInitData({ authDateOffsetSec: 86500 });
    const { context } = createMockContext({
      'x-telegram-init-data': expiredInitData,
    });

    expect(() => guard.canActivate(context)).toThrow('Invalid Telegram cryptographic signature');
  });

  it('validates fresh signature and parses req.user using strict whitelist', () => {
    const mockConfig = { get: () => BOT_TOKEN } as unknown as ConfigService;
    const guard = new TelegramAuthGuard(mockConfig);

    const validInitData = generateValidInitData({ authDateOffsetSec: 10 });
    const { context, req } = createMockContext({
      authorization: `Bearer ${validInitData}`,
    });

    const allowed = guard.canActivate(context);
    expect(allowed).toBe(true);

    const parsedUser = req.user as Record<string, unknown>;
    expect(parsedUser).toBeDefined();
    expect(parsedUser.id).toBe(99999);
    expect(parsedUser.first_name).toBe('Nikita');
    expect(parsedUser.username).toBe('founder_tech');
    // Ensure undeclared fields are dropped by pickWhiteList
    expect(parsedUser.malicious_field).toBeUndefined();
    expect(Object.getPrototypeOf(parsedUser)).toBeNull();
  });
});
