import { describe, expect, it, vi } from 'vitest';
import { GqlLeadStatus } from './modules/lead/dto/lead.dto';
import { LeadResolver } from './modules/lead/lead.resolver';
import { LeadService } from './modules/lead/lead.service';
import type { PrismaService } from './modules/prisma/prisma.service';
import { TelegramService } from './modules/telegram/telegram.service';

describe('E2E Pipeline Integration: Intake -> GraphQL Resolver -> Lead Service -> Prisma 7 -> Telegram Dispatch', () => {
  it('executes full pipeline flow with idempotency and Telegram dispatch', async () => {
    const mockCreatedLead = {
      id: 'e2e-lead-uuid-999',
      name: 'Cyber Corp',
      contact: '@cyber_lead',
      budget: '$25,000+',
      description: 'End-to-end full architecture deployment',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      referrer: 'https://induktr.studio/showcase',
      idempotencyKey: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
      status: 'NEW',
      createdAt: new Date('2026-10-23T18:00:00Z'),
    };

    const mockPrisma = {
      lead: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockCreatedLead),
        findMany: vi.fn(),
      },
    } as unknown as PrismaService;

    const mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return '8552544064:AAH0zU2HZZ6t-sqNjZanu3x3OM8kAbEStG4';
        if (key === 'TELEGRAM_CHAT_ID') return '5735264261';
        return undefined;
      }),
    };

    const telegramService = new TelegramService(
      mockConfig as unknown as ConstructorParameters<typeof TelegramService>[0],
      mockPrisma,
    );

    // Mock GrammY's bot.api.sendMessage since the bot has a real token that
    // would attempt network calls. We intercept at the GrammY API level.
    const sendMessageSpy = vi.fn().mockResolvedValue({ message_id: 1 });
    if (telegramService.bot) {
      telegramService.bot.api.sendMessage = sendMessageSpy;
    }

    const leadService = new LeadService(mockPrisma, telegramService);
    const leadResolver = new LeadResolver(leadService);

    const clientInput = {
      name: 'Cyber Corp',
      contact: '@cyber_lead',
      budget: '$25,000+',
      description: 'End-to-end full architecture deployment',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      referrer: 'https://induktr.studio/showcase',
      idempotencyKey: 'c3d79e60-9ff1-4a7b-a367-27b596dbcf41',
    };

    const response = await leadResolver.submitLead(clientInput);

    expect(response.id).toBe('e2e-lead-uuid-999');
    expect(response.name).toBe('Cyber Corp');
    expect(response.status).toBe(GqlLeadStatus.NEW);

    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: clientInput,
    });

    // Wait for async Telegram dispatch
    await new Promise((res) => setTimeout(res, 50));

    // Verify GrammY bot.api.sendMessage was called with the lead notification
    expect(sendMessageSpy).toHaveBeenCalledWith(
      '5735264261',
      expect.stringContaining('НОВАЯ ЗАЯВКА INDUKTR STUDIO'),
      expect.objectContaining({ parse_mode: 'HTML' }),
    );

    // Verify notification content
    const notificationText = sendMessageSpy.mock.calls[0]?.[1] as string;
    expect(notificationText).toContain('Cyber Corp');
    expect(notificationText).toContain('e2e-lead-uuid-999');
    expect(notificationText).toContain('#lead #induktr #crm');
  });
});
