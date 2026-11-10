import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { CreateLeadInput, LeadResponse } from './dto/lead.dto';
import { LeadService } from './lead.service';

@Resolver(() => LeadResponse)
export class LeadResolver {
  constructor(private readonly leadService: LeadService) {}

  @Query(() => [LeadResponse], { name: 'leads', description: 'Retrieve latest CRM leads' })
  async getLeads(): Promise<LeadResponse[]> {
    return this.leadService.getAllLeads();
  }

  @Query(() => LeadResponse, {
    name: 'lead',
    nullable: true,
    description: 'Retrieve single lead by ID or slug/idempotencyKey',
  })
  async getLead(@Args('id') id: string): Promise<LeadResponse | null> {
    return this.leadService.getLeadById(id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Mutation(() => LeadResponse, {
    name: 'submitLead',
    description: 'Submit intake lead with guaranteed idempotency and rate-limiting',
  })
  async submitLead(@Args('input') input: CreateLeadInput): Promise<LeadResponse> {
    return this.leadService.submitLead(input);
  }
}
