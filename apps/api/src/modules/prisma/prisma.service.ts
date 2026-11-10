import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:dummy@localhost:5432/neondb?sslmode=disable';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL via Prisma 7 engine...');
    await this.$connect();
    this.logger.log('Prisma 7 connection pool established successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Gracefully closing Prisma 7 connection pool...');
    await this.$disconnect();
    await this.pool.end();
  }
}

