import { describe, expect, it, vi } from 'vitest';
import { GqlOrderStatus, GqlProductType } from './dto/ecommerce.dto';
import { EcommerceResolver } from './ecommerce.resolver';
import type { EcommerceService } from './ecommerce.service';

describe('EcommerceResolver', () => {
  const mockEcommerceService = {
    getProducts: vi.fn(),
    getUserPurchases: vi.fn(),
    getUserOrders: vi.fn(),
    createCustomOrder: vi.fn(),
    initPurchase: vi.fn(),
    generateDigitalDownloadUrl: vi.fn(),
    getSystemShowcases: vi.fn(),
  } as unknown as EcommerceService;

  const resolver = new EcommerceResolver(mockEcommerceService);

  it('delegates getProducts to EcommerceService', async () => {
    const mockList = [
      {
        id: 'p-1',
        slug: 'kit',
        title: 'Kit',
        type: GqlProductType.UI_KIT,
        priceUsd: 199,
        description: 'Test',
        createdAt: new Date().toISOString(),
      },
    ];
    vi.mocked(mockEcommerceService.getProducts).mockResolvedValue(mockList);

    const result = await resolver.getProducts();
    expect(result).toEqual(mockList);
    expect(mockEcommerceService.getProducts).toHaveBeenCalledTimes(1);
  });

  it('delegates getMyPurchases using authenticated user ID', async () => {
    vi.mocked(mockEcommerceService.getUserPurchases).mockResolvedValue([]);

    const result = await resolver.getMyPurchases({ id: 'user-777' });
    expect(result).toEqual([]);
    expect(mockEcommerceService.getUserPurchases).toHaveBeenCalledWith('user-777');
  });

  it('delegates createCustomOrder using authenticated user ID', async () => {
    const expected = {
      id: 'ord-1',
      userId: 'user-777',
      title: 'DevOps & CI/CD',
      budgetUsd: 5000,
      status: GqlOrderStatus.PENDING,
      milestones: [],
      createdAt: new Date().toISOString(),
    };
    vi.mocked(mockEcommerceService.createCustomOrder).mockResolvedValue(expected);

    const result = await resolver.createCustomOrder(
      { title: 'DevOps & CI/CD', budgetUsd: 5000 },
      { id: 'user-777' },
    );
    expect(result).toEqual(expected);
  });

  it('delegates getSystemShowcases to EcommerceService', async () => {
    const mockShowcases = [
      {
        id: 'sc-1',
        slug: 'autonomous-ai-swarm',
        number: '001',
        category: 'AGENTIC INFRASTRUCTURE',
        title: 'Autonomous AI Swarm',
        tagline: 'Complexity. Orchestrated.',
        description: 'Coordinated agent network',
        topology: '{}',
        metrics: '{}',
        recentLog: 'ok',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    vi.mocked(mockEcommerceService.getSystemShowcases).mockResolvedValue(mockShowcases);

    const result = await resolver.getSystemShowcases();
    expect(result).toEqual(mockShowcases);
    expect(mockEcommerceService.getSystemShowcases).toHaveBeenCalledTimes(1);
  });
});
