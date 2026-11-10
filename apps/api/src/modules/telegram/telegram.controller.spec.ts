import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramController } from './telegram.controller';
import type { TelegramService } from './telegram.service';

describe('TelegramController', () => {
  let mockConfig: ConfigService;
  let mockTelegramService: { handleUpdate: ReturnType<typeof vi.fn> };
  let controller: TelegramController;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_WEBHOOK_SECRET') return 'my-secret-token-777';
        return undefined;
      }),
    } as unknown as ConfigService;

    mockTelegramService = {
      handleUpdate: vi.fn().mockResolvedValue(undefined),
    };

    controller = new TelegramController(
      mockConfig,
      mockTelegramService as unknown as TelegramService,
    );
  });

  it('rejects webhook requests when secret token is invalid or missing', async () => {
    await expect(
      controller.handleWebhook('wrong-secret', { update_id: 1 }),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      controller.handleWebhook(undefined, { update_id: 2 }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts webhook request when secret token matches', async () => {
    const response = await controller.handleWebhook('my-secret-token-777', {
      update_id: 123,
      message: {
        message_id: 1,
        chat: { id: 999, type: 'private' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(response).toEqual({ ok: true });
  });

  it('delegates update to TelegramService.handleUpdate', async () => {
    const update = {
      update_id: 124,
      message: {
        message_id: 2,
        chat: { id: 999, type: 'private' },
        date: Date.now(),
        text: '/status test-lead-77',
      },
    };

    await controller.handleWebhook('my-secret-token-777', update);

    expect(mockTelegramService.handleUpdate).toHaveBeenCalledWith(update);
  });

  it('returns ok even when handleUpdate throws', async () => {
    mockTelegramService.handleUpdate.mockRejectedValueOnce(new Error('GrammY error'));

    const response = await controller.handleWebhook('my-secret-token-777', {
      update_id: 125,
      message: {
        message_id: 3,
        chat: { id: 999, type: 'private' },
        date: Date.now(),
        text: '/bad',
      },
    });

    expect(response).toEqual({ ok: true });
  });

  it('returns ok for empty or non-object updates', async () => {
    const response = await controller.handleWebhook('my-secret-token-777', null);
    expect(response).toEqual({ ok: true });
  });

  it('skips secret check when TELEGRAM_WEBHOOK_SECRET is not configured', async () => {
    const noSecretConfig = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const openController = new TelegramController(
      noSecretConfig,
      mockTelegramService as unknown as TelegramService,
    );

    const response = await openController.handleWebhook(undefined, { update_id: 200 });
    expect(response).toEqual({ ok: true });
  });
});
