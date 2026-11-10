import { describe, expect, it, vi } from 'vitest';
import { GqlLeadStatus } from './dto/lead.dto';
import { LeadResolver } from './lead.resolver';
import type { LeadService } from './lead.service';

describe('LeadResolver', () => {
  const mockLeadService = {
    getAllLeads: vi.fn(),
    submitLead: vi.fn(),
    getLeadById: vi.fn(),
  } as unknown as LeadService;

  const resolver = new LeadResolver(mockLeadService);

  it('retrieves leads from lead service', async () => {
    const mockList = [
      {
        id: 'lead-1',
        name: 'Alex',
        contact: '@alex',
        budget: '$5,000+',
        description: 'Need full redesign',
        status: GqlLeadStatus.NEW,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(mockLeadService.getAllLeads).mockResolvedValue(mockList);

    const result = await resolver.getLeads();
    expect(result).toEqual(mockList);
    expect(mockLeadService.getAllLeads).toHaveBeenCalledTimes(1);
  });

  it('submits a lead through lead service', async () => {
    const input = {
      name: 'Elena',
      contact: 'elena@example.com',
      budget: '$10,000+',
      description: 'Design system and high-perf web app',
      serviceType: 'FULL_CYCLE_ENGINEERING',
      idempotencyKey: 'idem-123',
    };

    const expectedResponse = {
      id: 'lead-2',
      ...input,
      status: GqlLeadStatus.NEW,
      createdAt: new Date().toISOString(),
    };

    vi.mocked(mockLeadService.submitLead).mockResolvedValue(expectedResponse);

    const result = await resolver.submitLead(input);
    expect(result).toEqual(expectedResponse);
    expect(mockLeadService.submitLead).toHaveBeenCalledWith(input);
  });

  it('queries a single lead by id or slug', async () => {
    const expected = {
      id: 'lead-99',
      name: 'Dynamic Client',
      contact: '@client',
      budget: '$5k-$10k',
      description: 'Test',
      status: GqlLeadStatus.NEW,
      createdAt: new Date().toISOString(),
    };

    vi.mocked(mockLeadService.getLeadById).mockResolvedValue(expected);

    const result = await resolver.getLead('lead-slug-1');
    expect(result).toEqual(expected);
    expect(mockLeadService.getLeadById).toHaveBeenCalledWith('lead-slug-1');
  });
});
