var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LeadService_1;
import { Injectable, Logger, } from '@nestjs/common';
import { Database } from 'bun:sqlite';
import { CreateLeadSchema, LeadResponseSchema, pickWhiteList, safeCycleProofSerialize, } from '@induktr/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
export const MAX_IDEMPOTENCY_ENTRIES = 10_000;
export const TTL_MS = 86_400_000; // 24 hours
let LeadService = LeadService_1 = class LeadService {
    prisma;
    telegram;
    logger = new Logger(LeadService_1.name);
    db = null;
    selectCacheStmt = null;
    insertCacheStmt = null;
    deleteExpiredStmt = null;
    pruneLimitStmt = null;
    countCacheStmt = null;
    constructor(prisma, telegram) {
        this.prisma = prisma;
        this.telegram = telegram;
        this.initCache();
    }
    onModuleInit() {
        this.initCache();
    }
    onModuleDestroy() {
        try {
            if (this.selectCacheStmt?.finalize)
                this.selectCacheStmt.finalize();
            if (this.insertCacheStmt?.finalize)
                this.insertCacheStmt.finalize();
            if (this.deleteExpiredStmt?.finalize)
                this.deleteExpiredStmt.finalize();
            if (this.countCacheStmt?.finalize)
                this.countCacheStmt.finalize();
            if (this.pruneLimitStmt?.finalize)
                this.pruneLimitStmt.finalize();
            this.selectCacheStmt = null;
            this.insertCacheStmt = null;
            this.deleteExpiredStmt = null;
            this.countCacheStmt = null;
            this.pruneLimitStmt = null;
            if (this.db) {
                this.db.close();
                this.db = null;
            }
            this.logger.log('SQLite L1 cache successfully finalized and closed.');
        }
        catch (err) {
            this.logger.error('Error during SQLite L1 cache destruction', err);
        }
    }
    initCache() {
        if (this.db)
            return;
        try {
            this.db = new Database(':memory:');
            this.db.run(`
        CREATE TABLE IF NOT EXISTS idempotency_cache (
          key TEXT PRIMARY KEY,
          lead_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
            this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_idempotency_created_at
        ON idempotency_cache(created_at);
      `);
            this.selectCacheStmt = this.db.prepare('SELECT lead_json, created_at FROM idempotency_cache WHERE key = ?');
            this.insertCacheStmt = this.db.prepare('INSERT OR REPLACE INTO idempotency_cache VALUES (?, ?, ?)');
            this.deleteExpiredStmt = this.db.prepare('DELETE FROM idempotency_cache WHERE created_at < ?');
            this.countCacheStmt = this.db.prepare('SELECT count(*) as count FROM idempotency_cache');
            this.pruneLimitStmt = this.db.prepare('DELETE FROM idempotency_cache WHERE key IN (SELECT key FROM idempotency_cache ORDER BY created_at ASC LIMIT ?)');
        }
        catch (err) {
            this.logger.error('Failed to initialize in-memory SQLite L1 cache', err);
        }
    }
    pruneCache() {
        if (!this.deleteExpiredStmt || !this.countCacheStmt || !this.pruneLimitStmt)
            return;
        try {
            const expirationThreshold = Date.now() - TTL_MS;
            this.deleteExpiredStmt.run(expirationThreshold);
            const countResult = this.countCacheStmt.get();
            const currentCount = countResult?.count ?? 0;
            if (currentCount > MAX_IDEMPOTENCY_ENTRIES) {
                const excess = currentCount - MAX_IDEMPOTENCY_ENTRIES;
                this.pruneLimitStmt.run(excess);
            }
        }
        catch (err) {
            this.logger.warn('Failed to prune SQLite L1 cache', err);
        }
    }
    writeToL1Cache(key, data) {
        if (this.insertCacheStmt) {
            try {
                this.pruneCache();
                this.insertCacheStmt.run(key, safeCycleProofSerialize(data), Date.now());
            }
            catch (err) {
                this.logger.warn(`Failed to write to L1 cache for key ${key}`, err);
            }
        }
    }
    async submitLead(rawInput) {
        // Runtime input schema verification via Zod contracts
        const validatedInput = CreateLeadSchema.parse(rawInput);
        // [JS 30] Strict Whitelist Projection drops undeclared keys and prevents prototype pollution
        const input = pickWhiteList(validatedInput, [
            'name',
            'contact',
            'budget',
            'description',
            'serviceType',
            'referrer',
            'idempotencyKey',
        ]);
        // Idempotency check if key provided
        if (input.idempotencyKey) {
            // Check L1 cache before querying Prisma
            if (this.selectCacheStmt) {
                try {
                    const cached = this.selectCacheStmt.get(input.idempotencyKey);
                    if (cached?.lead_json) {
                        if (Date.now() - cached.created_at <= TTL_MS) {
                            this.logger.log(`L1 SQLite cache hit for idempotency key ${input.idempotencyKey}`);
                            return LeadResponseSchema.parse(JSON.parse(cached.lead_json));
                        }
                        else {
                            // Expired entry
                            this.pruneCache();
                        }
                    }
                }
                catch (err) {
                    this.logger.warn(`L1 cache lookup failed for key ${input.idempotencyKey}`, err);
                }
            }
            const existing = await this.prisma.lead.findUnique({
                where: { idempotencyKey: input.idempotencyKey },
            });
            if (existing) {
                this.logger.warn(`Idempotency key ${input.idempotencyKey} matched existing lead ${existing.id}`);
                const validatedOutput = LeadResponseSchema.parse({
                    id: existing.id,
                    name: existing.name,
                    contact: existing.contact,
                    budget: existing.budget,
                    description: existing.description,
                    status: existing.status,
                    createdAt: existing.createdAt.toISOString(),
                });
                this.writeToL1Cache(input.idempotencyKey, validatedOutput);
                return validatedOutput;
            }
        }
        const lead = await this.prisma.lead.create({
            data: {
                name: input.name,
                contact: input.contact,
                budget: input.budget,
                description: input.description,
                serviceType: input.serviceType ?? 'FULL_CYCLE_ENGINEERING',
                referrer: input.referrer,
                idempotencyKey: input.idempotencyKey,
            },
        });
        // Dual-Contour Async Dispatch (Does not block mutation response)
        queueMicrotask(() => {
            this.telegram
                .sendLeadNotification({
                id: lead.id,
                name: lead.name,
                contact: lead.contact,
                budget: lead.budget,
                description: lead.description,
                serviceType: lead.serviceType,
                referrer: lead.referrer ?? undefined,
            })
                .catch((err) => {
                this.logger.error(`Async Telegram alert failed for lead ${lead.id}`, err);
            });
        });
        const validatedLead = LeadResponseSchema.parse({
            id: lead.id,
            name: lead.name,
            contact: lead.contact,
            budget: lead.budget,
            description: lead.description,
            status: lead.status,
            createdAt: lead.createdAt.toISOString(),
        });
        if (input.idempotencyKey) {
            this.writeToL1Cache(input.idempotencyKey, validatedLead);
        }
        return validatedLead;
    }
    async getAllLeads() {
        const leads = await this.prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return leads.map((item) => {
            const validated = LeadResponseSchema.parse({
                id: item.id,
                name: item.name,
                contact: item.contact,
                budget: item.budget,
                description: item.description,
                status: item.status,
                createdAt: item.createdAt.toISOString(),
            });
            return validated;
        });
    }
    async getLeadById(idOrSlug) {
        const lead = await this.prisma.lead.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { idempotencyKey: idOrSlug },
                ],
            },
        });
        if (!lead)
            return null;
        const validated = LeadResponseSchema.parse({
            id: lead.id,
            name: lead.name,
            contact: lead.contact,
            budget: lead.budget,
            description: lead.description,
            status: lead.status,
            createdAt: lead.createdAt.toISOString(),
        });
        return validated;
    }
};
LeadService = LeadService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        TelegramService])
], LeadService);
export { LeadService };
