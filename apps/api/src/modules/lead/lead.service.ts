import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { Database, type Statement } from 'bun:sqlite';
import {
  CreateLeadSchema,
  LeadResponseSchema,
  pickWhiteList,
  safeCycleProofSerialize,
} from '@induktr/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import type { CreateLeadInput, LeadResponse } from './dto/lead.dto';

export const MAX_IDEMPOTENCY_ENTRIES = 10_000;
export const TTL_MS = 86_400_000; // 24 hours

interface CachedLeadRow {
  lead_json: string;
  created_at: number;
}

@Injectable()
export class LeadService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LeadService.name);
  private db: Database | null = null;
  private selectCacheStmt: Statement<CachedLeadRow, [string]> | null = null;
  private insertCacheStmt: Statement<void, [string, string, number]> | null = null;
  private deleteExpiredStmt: Statement<void, [number]> | null = null;
  private pruneLimitStmt: Statement<void, [number]> | null = null;
  private countCacheStmt: Statement<{ count: number }, []> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {
    this.initCache();
  }

  onModuleInit(): void {
    this.initCache();
  }

  onModuleDestroy(): void {
    try {
      if (this.selectCacheStmt?.finalize) this.selectCacheStmt.finalize();
      if (this.insertCacheStmt?.finalize) this.insertCacheStmt.finalize();
      if (this.deleteExpiredStmt?.finalize) this.deleteExpiredStmt.finalize();
      if (this.countCacheStmt?.finalize) this.countCacheStmt.finalize();
      if (this.pruneLimitStmt?.finalize) this.pruneLimitStmt.finalize();

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
    } catch (err) {
      this.logger.error('Error during SQLite L1 cache destruction', err);
    }
  }

  private initCache(): void {
    if (this.db) return;
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
      this.selectCacheStmt = this.db.prepare<CachedLeadRow, [string]>(
        'SELECT lead_json, created_at FROM idempotency_cache WHERE key = ?',
      );
      this.insertCacheStmt = this.db.prepare<void, [string, string, number]>(
        'INSERT OR REPLACE INTO idempotency_cache VALUES (?, ?, ?)',
      );
      this.deleteExpiredStmt = this.db.prepare<void, [number]>(
        'DELETE FROM idempotency_cache WHERE created_at < ?',
      );
      this.countCacheStmt = this.db.prepare<{ count: number }, []>(
        'SELECT count(*) as count FROM idempotency_cache',
      );
      this.pruneLimitStmt = this.db.prepare<void, [number]>(
        'DELETE FROM idempotency_cache WHERE key IN (SELECT key FROM idempotency_cache ORDER BY created_at ASC LIMIT ?)',
      );
    } catch (err) {
      this.logger.error('Failed to initialize in-memory SQLite L1 cache', err);
    }
  }

  private pruneCache(): void {
    if (!this.deleteExpiredStmt || !this.countCacheStmt || !this.pruneLimitStmt) return;
    try {
      const expirationThreshold = Date.now() - TTL_MS;
      this.deleteExpiredStmt.run(expirationThreshold);

      const countResult = this.countCacheStmt.get();
      const currentCount = countResult?.count ?? 0;
      if (currentCount > MAX_IDEMPOTENCY_ENTRIES) {
        const excess = currentCount - MAX_IDEMPOTENCY_ENTRIES;
        this.pruneLimitStmt.run(excess);
      }
    } catch (err) {
      this.logger.warn('Failed to prune SQLite L1 cache', err);
    }
  }

  private writeToL1Cache(key: string, data: LeadResponse): void {
    if (this.insertCacheStmt) {
      try {
        this.pruneCache();
        this.insertCacheStmt.run(
          key,
          safeCycleProofSerialize(data),
          Date.now(),
        );
      } catch (err) {
        this.logger.warn(`Failed to write to L1 cache for key ${key}`, err);
      }
    }
  }

  async submitLead(rawInput: CreateLeadInput): Promise<LeadResponse> {
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
              this.logger.log(
                `L1 SQLite cache hit for idempotency key ${input.idempotencyKey}`,
              );
              return LeadResponseSchema.parse(
                JSON.parse(cached.lead_json),
              ) as unknown as LeadResponse;
            } else {
              // Expired entry
              this.pruneCache();
            }
          }
        } catch (err) {
          this.logger.warn(
            `L1 cache lookup failed for key ${input.idempotencyKey}`,
            err,
          );
        }
      }

      const existing = await this.prisma.lead.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        this.logger.warn(
          `Idempotency key ${input.idempotencyKey} matched existing lead ${existing.id}`,
        );
        const validatedOutput = LeadResponseSchema.parse({
          id: existing.id,
          name: existing.name,
          contact: existing.contact,
          budget: existing.budget,
          description: existing.description,
          status: existing.status,
          createdAt: existing.createdAt.toISOString(),
        }) as unknown as LeadResponse;

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
        .catch((err: unknown) => {
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
    }) as unknown as LeadResponse;

    if (input.idempotencyKey) {
      this.writeToL1Cache(input.idempotencyKey, validatedLead);
    }

    return validatedLead;
  }

  async getAllLeads(): Promise<LeadResponse[]> {
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
      return validated as unknown as LeadResponse;
    });
  }

  async getLeadById(idOrSlug: string): Promise<LeadResponse | null> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { idempotencyKey: idOrSlug },
        ],
      },
    });

    if (!lead) return null;

    const validated = LeadResponseSchema.parse({
      id: lead.id,
      name: lead.name,
      contact: lead.contact,
      budget: lead.budget,
      description: lead.description,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
    });

    return validated as unknown as LeadResponse;
  }
}
