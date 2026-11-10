import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BOT_COMMANDS, TelegramService, WEBAPP_URL } from './telegram.service';

/** Minimal mock for PrismaService used by TelegramService. */
interface MockPrismaForService {
  lead: { findUnique: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
}

function mockBotMethods(service: TelegramService) {
  if (!service.bot) return;

  service.bot.api.setMyCommands = vi.fn().mockResolvedValue(true);
  service.bot.api.setChatMenuButton = vi.fn().mockResolvedValue(true);
  service.bot.api.getMe = vi.fn().mockResolvedValue({
    id: 12345,
    is_bot: true,
    first_name: 'InduktrBot',
    username: 'induktr_bot',
  });
  service.bot.api.deleteWebhook = vi.fn().mockResolvedValue(true);
  service.bot.api.sendMessage = vi.fn().mockResolvedValue({ message_id: 1 });
  service.bot.start = vi.fn().mockImplementation(async ({ onStart }) => {
    if (onStart) {
      onStart({
        id: 12345,
        is_bot: true,
        first_name: 'InduktrBot',
        username: 'induktr_bot',
      });
    }
  });
  service.bot.stop = vi.fn().mockResolvedValue(undefined);
}

describe('TelegramService', () => {
  let mockConfig: ConfigService;
  let mockPrisma: MockPrismaForService;
  let service: TelegramService;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:FAKE_TOKEN';
        if (key === 'TELEGRAM_CHAT_ID') return '987654321';
        return undefined;
      }),
    } as unknown as ConfigService;

    mockPrisma = {
      lead: { findUnique: vi.fn() },
      user: { findUnique: vi.fn() },
    };

    service = new TelegramService(mockConfig, mockPrisma as never);
    mockBotMethods(service);
  });

  it('escapes HTML special characters and constructs formatted message', () => {
    const message = service.buildNotificationMessage({
      id: 'test-lead-id',
      name: '<script>alert("hack")</script> & Bob',
      contact: 'test@example.com > lead',
      budget: '$10,000+',
      description: 'Needs <b>super</b> fast & reactive UI',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      referrer: 'https://twitter.com/induktr?utm=1&val=2',
    });

    expect(message).toContain('&lt;script&gt;alert("hack")&lt;/script&gt; &amp; Bob');
    expect(message).toContain('test@example.com &gt; lead');
    expect(message).toContain('Needs &lt;b&gt;super&lt;/b&gt; fast &amp; reactive UI');
    expect(message).toContain(
      '🌐 <b>Источник (Referrer):</b> https://twitter.com/induktr?utm=1&amp;val=2',
    );
    expect(message).toContain('🏷 #lead #induktr #crm #full_cycle_engineering');
    expect(message).toContain('<code>test-lead-id</code>');
  });

  it('emits stub notification when credentials are not configured', async () => {
    const unconfiguredConfig = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const unconfiguredService = new TelegramService(unconfiguredConfig, mockPrisma as never);

    const result = await unconfiguredService.sendLeadNotification({
      id: 'lead-dummy',
      name: 'No Bot Token Client',
      contact: '@test',
      budget: '$2,000',
      description: 'Test stub',
      serviceType: 'UI_KIT',
    });

    expect(result).toBe(true);
  });

  it('sends lead notification via GrammY bot.api.sendMessage', async () => {
    const result = await service.sendLeadNotification({
      id: 'lead-real',
      name: 'Induktr Client',
      contact: '@induktr_client',
      budget: '$5,000+',
      description: 'Full stack project',
      serviceType: 'FULL_CYCLE_ENGINEERING',
    });

    expect(result).toBe(true);
    expect(service.bot?.api.sendMessage).toHaveBeenCalledWith(
      '987654321',
      expect.stringContaining('НОВАЯ ЗАЯВКА INDUKTR STUDIO v2.0'),
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('creates Bot instance when token is provided', () => {
    expect(service.bot).toBeDefined();
  });

  it('does not create Bot instance when token is missing', () => {
    const noTokenConfig = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const noTokenService = new TelegramService(noTokenConfig, mockPrisma as never);
    expect(noTokenService.bot).toBeUndefined();
  });

  it('escapeHtml is accessible and correct', () => {
    expect(service.escapeHtml('<b>test</b> & "quotes"')).toBe(
      '&lt;b&gt;test&lt;/b&gt; &amp; "quotes"',
    );
  });

  /* ──────── Hybrid Polling & Webhook Runtime Tests ──────── */

  it('starts polling and deletes webhook when mode is polling', async () => {
    const pollingConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:FAKE_TOKEN';
        if (key === 'TELEGRAM_MODE') return 'polling';
        return undefined;
      }),
    } as unknown as ConfigService;

    const pollingService = new TelegramService(pollingConfig, mockPrisma as never);
    mockBotMethods(pollingService);

    await pollingService.onModuleInit();

    expect(pollingService.bot?.api.deleteWebhook).toHaveBeenCalledWith({
      drop_pending_updates: false,
    });
    expect(pollingService.bot?.start).toHaveBeenCalledWith(
      expect.objectContaining({ onStart: expect.any(Function) }),
    );
    expect(pollingService.isPollingActive).toBe(true);
  });

  it('tolerates deleteWebhook error before starting polling', async () => {
    const pollingConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:FAKE_TOKEN';
        if (key === 'TELEGRAM_MODE') return 'polling';
        return undefined;
      }),
    } as unknown as ConfigService;

    const pollingService = new TelegramService(pollingConfig, mockPrisma as never);
    mockBotMethods(pollingService);
    if (pollingService.bot) {
      pollingService.bot.api.deleteWebhook = vi
        .fn()
        .mockRejectedValue(new Error('Webhook deletion timeout'));
    }

    await pollingService.onModuleInit();

    expect(pollingService.bot?.start).toHaveBeenCalled();
    expect(pollingService.isPollingActive).toBe(true);
  });

  it('runs in webhook mode without deleteWebhook or bot.start when TELEGRAM_MODE=webhook', async () => {
    const webhookConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:FAKE_TOKEN';
        if (key === 'TELEGRAM_MODE') return 'webhook';
        return undefined;
      }),
    } as unknown as ConfigService;

    const webhookService = new TelegramService(webhookConfig, mockPrisma as never);
    mockBotMethods(webhookService);

    await webhookService.onModuleInit();

    expect(webhookService.bot?.api.deleteWebhook).not.toHaveBeenCalled();
    expect(webhookService.bot?.start).not.toHaveBeenCalled();
    expect(webhookService.isPollingActive).toBe(false);
  });

  it('stops polling gracefully onModuleDestroy when polling was active', async () => {
    const pollingConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:FAKE_TOKEN';
        if (key === 'TELEGRAM_MODE') return 'polling';
        return undefined;
      }),
    } as unknown as ConfigService;

    const pollingService = new TelegramService(pollingConfig, mockPrisma as never);
    mockBotMethods(pollingService);

    await pollingService.onModuleInit();
    expect(pollingService.isPollingActive).toBe(true);

    await pollingService.onModuleDestroy();
    expect(pollingService.bot?.stop).toHaveBeenCalledTimes(1);
    expect(pollingService.isPollingActive).toBe(false);
  });

  it('does not call bot.stop onModuleDestroy if not running in polling mode', async () => {
    const webhookConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '123456:FAKE_TOKEN';
        if (key === 'TELEGRAM_MODE') return 'webhook';
        return undefined;
      }),
    } as unknown as ConfigService;

    const webhookService = new TelegramService(webhookConfig, mockPrisma as never);
    mockBotMethods(webhookService);

    await webhookService.onModuleInit();
    await webhookService.onModuleDestroy();

    expect(webhookService.bot?.stop).not.toHaveBeenCalled();
  });

  /* ──────── Metadata Sync & Exponential Backoff Tests ──────── */

  it('registers commands and chat menu button on successful syncBotMetadata', async () => {
    await service.syncBotMetadata();

    expect(service.bot?.api.setMyCommands).toHaveBeenCalledWith([...BOT_COMMANDS]);
    expect(service.bot?.api.setChatMenuButton).toHaveBeenCalledWith({
      menu_button: {
        type: 'web_app',
        text: 'Studio ⚡',
        web_app: { url: WEBAPP_URL },
      },
    });
    expect(service.bot?.api.getMe).toHaveBeenCalled();
  });

  it('retries on network failure or 504 Gateway Timeout and succeeds on subsequent attempt', async () => {
    if (service.bot) {
      service.bot.api.setMyCommands = vi
        .fn()
        .mockRejectedValueOnce(new Error('504 Gateway Timeout'))
        .mockResolvedValueOnce(true);
    }

    await service.syncBotMetadata(3, 1);

    expect(service.bot?.api.setMyCommands).toHaveBeenCalledTimes(2);
    expect(service.bot?.api.setChatMenuButton).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries and logs error without throwing unhandled exception', async () => {
    if (service.bot) {
      service.bot.api.setMyCommands = vi
        .fn()
        .mockRejectedValue(new Error('Persistent 504 Gateway Timeout'));
    }

    // Should complete cleanly without rejecting
    await expect(service.syncBotMetadata(3, 1)).resolves.toBeUndefined();
    expect(service.bot?.api.setMyCommands).toHaveBeenCalledTimes(3);
  });

  /* ──────── Graceful Handling when Bot Token Unconfigured ──────── */

  it('noop for lifecycle methods and sync when bot is not configured', async () => {
    const noTokenConfig = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const noTokenService = new TelegramService(noTokenConfig, mockPrisma as never);

    await expect(noTokenService.onModuleInit()).resolves.toBeUndefined();
    await expect(noTokenService.syncBotMetadata()).resolves.toBeUndefined();
    await expect(noTokenService.onModuleDestroy()).resolves.toBeUndefined();
  });
});
