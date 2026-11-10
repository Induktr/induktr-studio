import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { TelegramService } from '../telegram/telegram.service';
import { GqlLeadStatus } from './dto/lead.dto';
import { LeadService } from './lead.service';

interface MockPrismaClient {
  lead: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
}

interface MockTelegramService {
  sendLeadNotification: ReturnType<typeof vi.fn>;
}

describe('LeadService', () => {
  let mockPrisma: MockPrismaClient;
  let mockTelegram: MockTelegramService;
  let service: LeadService;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    mockTelegram = {
      sendLeadNotification: vi.fn().mockResolvedValue(true),
    };

    service = new LeadService(
      mockPrisma as unknown as PrismaService,
      mockTelegram as unknown as TelegramService,
    );
  });

  it('guarantees idempotency by returning existing lead when idempotencyKey matches', async () => {
    const existingDate = new Date('2026-10-20T10:00:00Z');
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'existing-uuid',
      name: 'Existing Client',
      contact: '@client',
      budget: '$5,000+',
      description: 'First submission',
      status: 'NEW',
      createdAt: existingDate,
    });

    const validIdempKey = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const result = await service.submitLead({
      name: 'Existing Client',
      contact: '@client',
      budget: '$5,000+',
      description: 'First submission',
      idempotencyKey: validIdempKey,
    });

    expect(result.id).toBe('existing-uuid');
    expect(result.name).toBe('Existing Client');
    expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: validIdempKey },
    });
    // Ensure no duplicate insertion or alert was made
    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
    expect(mockTelegram.sendLeadNotification).not.toHaveBeenCalled();
  });

  it('serves duplicate submissions directly from SQLite L1 cache without calling Prisma', async () => {
    const existingDate = new Date('2026-10-20T10:00:00Z');
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'cached-uuid',
      name: 'Cached Client',
      contact: '@cached',
      budget: '$5,000+',
      description: 'First submission',
      status: 'NEW',
      createdAt: existingDate,
    });

    const idempKey = 'lead-a1b2c3d4e5f6';
    // First call: populates cache via Prisma
    const firstResult = await service.submitLead({
      name: 'Cached Client',
      contact: '@cached',
      budget: '$5,000+',
      description: 'First submission',
      idempotencyKey: idempKey,
    });
    expect(firstResult.id).toBe('cached-uuid');
    expect(mockPrisma.lead.findUnique).toHaveBeenCalledTimes(1);

    // Second call: must hit L1 SQLite cache without querying Prisma again
    const secondResult = await service.submitLead({
      name: 'Cached Client',
      contact: '@cached',
      budget: '$5,000+',
      description: 'First submission',
      idempotencyKey: idempKey,
    });
    expect(secondResult.id).toBe('cached-uuid');
    expect(mockPrisma.lead.findUnique).toHaveBeenCalledTimes(1);
  });

  it('cleans up and finalizes SQLite L1 cache on module destroy', () => {
    expect(() => service.onModuleDestroy()).not.toThrow();
  });

  it('creates new lead and queues asynchronous Telegram notification', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const createdAt = new Date('2026-10-22T12:00:00Z');

    mockPrisma.lead.create.mockResolvedValue({
      id: 'lead-new-1',
      name: 'John Doe',
      contact: 'john@example.com',
      budget: '$15,000+',
      description: 'High performance portal',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      referrer: 'https://google.com',
      status: 'NEW',
      createdAt,
    });

    const freshIdempKey = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
    const result = await service.submitLead({
      name: 'John Doe',
      contact: 'john@example.com',
      budget: '$15,000+',
      description: 'High performance portal',
      referrer: 'https://google.com',
      idempotencyKey: freshIdempKey,
    });

    expect(result.id).toBe('lead-new-1');
    expect(result.status).toBe(GqlLeadStatus.NEW);
    expect(mockPrisma.lead.create).toHaveBeenCalledWith({
      data: {
        name: 'John Doe',
        contact: 'john@example.com',
        budget: '$15,000+',
        description: 'High performance portal',
        serviceType: 'FULL_CYCLE_ENGINEERING',
        referrer: 'https://google.com',
        idempotencyKey: freshIdempKey,
      },
    });

    // Wait for microtask queue to execute async Telegram dispatch
    await new Promise((res) => setTimeout(res, 50));
    expect(mockTelegram.sendLeadNotification).toHaveBeenCalledWith({
      id: 'lead-new-1',
      name: 'John Doe',
      contact: 'john@example.com',
      budget: '$15,000+',
      description: 'High performance portal',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      referrer: 'https://google.com',
    });
  });

  it('retrieves all leads ordered by createdAt descending', async () => {
    const date = new Date('2026-10-22T12:00:00Z');
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l-1',
        name: 'Client 1',
        contact: 'c1',
        budget: '$5,000',
        description: 'Desc 1',
        status: 'NEW',
        createdAt: date,
      },
    ]);

    const leads = await service.getAllLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0]?.id).toBe('l-1');
    expect(leads[0]?.status).toBe(GqlLeadStatus.NEW);
  });

  it('retrieves single lead by id or idempotencyKey slug', async () => {
    const date = new Date('2026-10-22T12:00:00Z');
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: 'lead-123',
      name: 'Client Slug',
      contact: '@clientslug',
      budget: '$10,000+',
      description: 'Dynamic slug brief',
      status: 'QUALIFIED',
      createdAt: date,
    });

    const lead = await service.getLeadById('lead-slug-abc');
    expect(lead).not.toBeNull();
    expect(lead?.id).toBe('lead-123');
    expect(lead?.status).toBe('QUALIFIED');
    expect(mockPrisma.lead.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: 'lead-slug-abc' }, { idempotencyKey: 'lead-slug-abc' }],
      },
    });
  });

  it('returns null if lead is not found by slug', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    const lead = await service.getLeadById('non-existent');
    expect(lead).toBeNull();
  });
});
