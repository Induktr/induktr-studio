import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { GqlOrderStatus, GqlProductType } from './dto/ecommerce.dto';
import { EcommerceService } from './ecommerce.service';

interface MockPrismaEcommerceClient {
  product: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  purchase: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  customOrder: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  systemShowcase: {
    findMany: ReturnType<typeof vi.fn>;
  };
}

describe('EcommerceService', () => {
  let mockPrisma: MockPrismaEcommerceClient;
  let service: EcommerceService;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      purchase: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      customOrder: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      systemShowcase: {
        findMany: vi.fn(),
      },
    };

    service = new EcommerceService(mockPrisma as unknown as PrismaService);
  });

  it('retrieves products ordered by creation date', async () => {
    const now = new Date('2026-10-23T12:00:00Z');
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 'prod-1',
        slug: 'quantum-ui-kit',
        title: 'Quantum UI Kit',
        type: 'UI_KIT',
        priceUsd: 149.0,
        description: 'OKLCH vector-accelerated component library',
        tier: 'TIER 01 / INTERFACE ENGINEERING',
        badge: 'FIG + TSX',
        version: '1.0.0',
        fileSize: '12 MB',
        componentCount: 30,
        features: ['Token engine'],
        artifactKey: 'quantum-ui-kit.zip',
        isActive: true,
        createdAt: now,
      },
    ]);

    const products = await service.getProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.id).toBe('prod-1');
    expect(products[0]?.type).toBe(GqlProductType.UI_KIT);
    expect(products[0]?.priceUsd).toBe(149.0);
  });

  it('retrieves user purchases with associated product details', async () => {
    const now = new Date('2026-10-23T12:00:00Z');
    mockPrisma.purchase.findMany.mockResolvedValue([
      {
        id: 'pur-1',
        userId: 'user-uuid-1',
        productId: 'prod-1',
        amountUsd: 149.0,
        status: 'PAID',
        downloadUrl: 'https://cdn.induktr.studio/artifacts/quantum-ui-kit.zip',
        createdAt: now,
        product: {
          id: 'prod-1',
          slug: 'quantum-ui-kit',
          title: 'Quantum UI Kit',
          type: 'UI_KIT',
          priceUsd: 149.0,
          description: 'OKLCH vector-accelerated component library',
          tier: 'TIER 01 / INTERFACE ENGINEERING',
          badge: 'FIG + TSX',
          version: '1.0.0',
          fileSize: '12 MB',
          componentCount: 30,
          features: ['Token engine'],
          artifactKey: 'quantum-ui-kit.zip',
          isActive: true,
          createdAt: now,
        },
      },
    ]);

    const purchases = await service.getUserPurchases('user-uuid-1');
    expect(purchases).toHaveLength(1);
    expect(purchases[0]?.id).toBe('pur-1');
    expect(purchases[0]?.status).toBe(GqlOrderStatus.PAID);
    expect(purchases[0]?.product?.slug).toBe('quantum-ui-kit');
  });

  it('creates custom order with default milestones structure', async () => {
    const now = new Date('2026-10-23T12:00:00Z');
    mockPrisma.customOrder.create.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'IND-999',
      userId: 'user-uuid-1',
      title: 'High Load Exchange MVP',
      budgetUsd: 12000,
      status: 'PENDING',
      milestones: [
        {
          id: 'm-1',
          orderId: 'order-1',
          step: 1,
          title: 'Intake & Architecture Specs',
          description: 'Intake and architecture specifications',
          status: 'IN_PROGRESS',
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      createdAt: now,
    });

    const order = await service.createCustomOrder('user-uuid-1', {
      title: 'High Load Exchange MVP',
      budgetUsd: 12000,
    });

    expect(order.id).toBe('order-1');
    expect(order.status).toBe(GqlOrderStatus.PENDING);
    expect(order.milestones).toHaveLength(1);
    expect(mockPrisma.customOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-uuid-1',
          title: 'High Load Exchange MVP',
          budgetUsd: 12000,
          status: 'PENDING',
        }),
      }),
    );
  });

  it('generates digital download URL for paid purchases with HMAC signature', async () => {
    mockPrisma.purchase.findFirst.mockResolvedValue({
      id: 'pur-1',
      userId: 'user-uuid-1',
      status: 'PAID',
      product: { slug: 'quantum-ui-kit' },
    });

    const url = await service.generateDigitalDownloadUrl('pur-1', 'user-uuid-1');
    expect(url).toContain('https://cdn.induktr.studio/artifacts/quantum-ui-kit.zip?token=');
    const tokenPart = url.split('token=')[1];
    expect(tokenPart).toBeDefined();
    const [payloadB64, signature] = (tokenPart ?? '').split('.');
    expect(payloadB64).toBeDefined();
    expect(signature).toBeDefined();
    expect(signature?.length).toBeGreaterThan(10);
  });

  it('retrieves active system showcases sorted by sortOrder', async () => {
    const now = new Date('2026-10-23T12:00:00Z');
    mockPrisma.systemShowcase.findMany.mockResolvedValue([
      {
        id: 'sc-1',
        slug: 'autonomous-ai-swarm',
        number: '001',
        category: 'AGENTIC INFRASTRUCTURE',
        title: 'Autonomous AI Swarm',
        tagline: 'Complexity. Orchestrated.',
        description: 'A coordinated agent network',
        topology: { nodes: 4 },
        metrics: { fps: 60 },
        recentLog: '[14:32:08] task.complete',
        sortOrder: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const showcases = await service.getSystemShowcases();
    expect(showcases).toHaveLength(1);
    expect(showcases[0]?.slug).toBe('autonomous-ai-swarm');
    expect(showcases[0]?.number).toBe('001');
    expect(showcases[0]?.topology).toBe(JSON.stringify({ nodes: 4 }));
  });
});
