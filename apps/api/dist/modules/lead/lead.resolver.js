var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { CreateLeadInput, LeadResponse } from './dto/lead.dto';
import { LeadService } from './lead.service';
let LeadResolver = class LeadResolver {
    leadService;
    constructor(leadService) {
        this.leadService = leadService;
    }
    async getLeads() {
        return this.leadService.getAllLeads();
    }
    async getLead(id) {
        return this.leadService.getLeadById(id);
    }
    async submitLead(input) {
        return this.leadService.submitLead(input);
    }
};
__decorate([
    Query(() => [LeadResponse], { name: 'leads', description: 'Retrieve latest CRM leads' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeadResolver.prototype, "getLeads", null);
__decorate([
    Query(() => LeadResponse, {
        name: 'lead',
        nullable: true,
        description: 'Retrieve single lead by ID or slug/idempotencyKey',
    }),
    __param(0, Args('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeadResolver.prototype, "getLead", null);
__decorate([
    Throttle({ default: { limit: 5, ttl: 60000 } }),
    Mutation(() => LeadResponse, {
        name: 'submitLead',
        description: 'Submit intake lead with guaranteed idempotency and rate-limiting',
    }),
    __param(0, Args('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateLeadInput]),
    __metadata("design:returntype", Promise)
], LeadResolver.prototype, "submitLead", null);
LeadResolver = __decorate([
    Resolver(() => LeadResponse),
    __metadata("design:paramtypes", [LeadService])
], LeadResolver);
export { LeadResolver };
