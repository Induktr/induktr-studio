import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma';

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:dummy@localhost:5432/neondb?sslmode=disable';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('[Seed] Ensuring schema structures in PostgreSQL...');

  // Create tables and enums safely if not present (Zero data loss guarantee)
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'STUDIO_LEAD', 'ADMIN');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "ProductType" AS ENUM ('UI_KIT', 'CHEATSHEET_HIGH_LEVEL', 'CHEATSHEET_LOW_LEVEL', 'CONSULTATION_AUDIT');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'DELIVERED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "telegramId" TEXT UNIQUE,
      "username" TEXT,
      "firstName" TEXT,
      "email" TEXT UNIQUE,
      "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT PRIMARY KEY,
      "slug" TEXT UNIQUE NOT NULL,
      "title" TEXT NOT NULL,
      "type" "ProductType" NOT NULL,
      "priceUsd" DOUBLE PRECISION NOT NULL,
      "description" TEXT NOT NULL,
      "tier" TEXT NOT NULL DEFAULT 'CORE',
      "badge" TEXT NOT NULL DEFAULT 'STANDARD',
      "version" TEXT NOT NULL DEFAULT '1.0.0',
      "fileSize" TEXT,
      "componentCount" INTEGER,
      "features" JSONB NOT NULL DEFAULT '[]',
      "artifactKey" TEXT NOT NULL DEFAULT '',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Purchase" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "productId" TEXT NOT NULL REFERENCES "Product"("id"),
      "amountUsd" DOUBLE PRECISION NOT NULL,
      "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
      "downloadUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "CustomOrder" (
      "id" TEXT PRIMARY KEY,
      "orderNumber" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "budgetUsd" DOUBLE PRECISION NOT NULL,
      "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
      "sprint" TEXT,
      "deliveryDate" TIMESTAMP(3),
      "nextReviewDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Milestone" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL REFERENCES "CustomOrder"("id") ON DELETE CASCADE,
      "step" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
      "completedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Milestone_orderId_step_key" UNIQUE ("orderId", "step")
    );

    CREATE TABLE IF NOT EXISTS "SystemShowcase" (
      "id" TEXT PRIMARY KEY,
      "slug" TEXT UNIQUE NOT NULL,
      "number" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "tagline" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "topology" JSONB NOT NULL,
      "metrics" JSONB NOT NULL,
      "recentLog" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "NotificationLog" (
      "id" TEXT PRIMARY KEY,
      "channel" TEXT NOT NULL,
      "recipient" TEXT NOT NULL,
      "payload" JSONB NOT NULL,
      "delivered" BOOLEAN NOT NULL DEFAULT false,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "errorMessage" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "tokenHash" TEXT UNIQUE NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[Seed] 1. Seeding studio Products (Static SSG Catalog)...');
  await prisma.product.upsert({
    where: { slug: 'modular-ui-kit' },
    update: {
      title: 'Modular UI Kit',
      type: 'UI_KIT',
      priceUsd: 29.0,
      description: 'OKLCH · Radix · FSD 2.1. 48 editable components. One coherent engineering language.',
      tier: 'TIER 01 / INTERFACE ENGINEERING',
      badge: 'FIG + TSX',
      version: 'v2.0',
      fileSize: '24.8 MB',
      componentCount: 48,
      features: [
        '48 editable components',
        'OKLCH tokens with gamut mapping',
        'Radix primitives with keyboard navigation',
        'FSD 2.1 architectural slices',
        'Commercial license included',
        'Instant zip download access',
      ],
      artifactKey: 'modular-ui-kit.zip',
      isActive: true,
    },
    create: {
      id: '4a9b2c3d-1111-4aaa-bbbb-000000000001',
      slug: 'modular-ui-kit',
      title: 'Modular UI Kit',
      type: 'UI_KIT',
      priceUsd: 29.0,
      description: 'OKLCH · Radix · FSD 2.1. 48 editable components. One coherent engineering language.',
      tier: 'TIER 01 / INTERFACE ENGINEERING',
      badge: 'FIG + TSX',
      version: 'v2.0',
      fileSize: '24.8 MB',
      componentCount: 48,
      features: [
        '48 editable components',
        'OKLCH tokens with gamut mapping',
        'Radix primitives with keyboard navigation',
        'FSD 2.1 architectural slices',
        'Commercial license included',
        'Instant zip download access',
      ],
      artifactKey: 'modular-ui-kit.zip',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'architecture-cheatsheets' },
    update: {
      title: 'Architecture Cheatsheets',
      type: 'CHEATSHEET_HIGH_LEVEL',
      priceUsd: 69.0,
      description: 'V8 Internals · Scheduler API · Event loop maps. 24 concise sheets for decisions that scale.',
      tier: 'TIER 02 / SYSTEM ARCHITECTURE',
      badge: 'PDF + MD',
      version: 'v1.4',
      fileSize: '8.2 MB',
      componentCount: 24,
      features: [
        '24 concise architecture sheets',
        'V8 runtime maps & heap memory layout',
        'Scheduler microtask pipelines',
        'Event loop execution diagrams',
        'Commercial license included',
        'Markdown & PDF bundle',
      ],
      artifactKey: 'architecture-cheatsheets.zip',
      isActive: true,
    },
    create: {
      id: '4a9b2c3d-2222-4aaa-bbbb-000000000002',
      slug: 'architecture-cheatsheets',
      title: 'Architecture Cheatsheets',
      type: 'CHEATSHEET_HIGH_LEVEL',
      priceUsd: 69.0,
      description: 'V8 Internals · Scheduler API · Event loop maps. 24 concise sheets for decisions that scale.',
      tier: 'TIER 02 / SYSTEM ARCHITECTURE',
      badge: 'PDF + MD',
      version: 'v1.4',
      fileSize: '8.2 MB',
      componentCount: 24,
      features: [
        '24 concise architecture sheets',
        'V8 runtime maps & heap memory layout',
        'Scheduler microtask pipelines',
        'Event loop execution diagrams',
        'Commercial license included',
        'Markdown & PDF bundle',
      ],
      artifactKey: 'architecture-cheatsheets.zip',
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'consultation-audit' },
    update: {
      title: 'Consultation & System Audit',
      type: 'CONSULTATION_AUDIT',
      priceUsd: 490.0,
      description: '1-on-1 Deep Dive · V8 Internals · Architecture Review & Scalability Roadmap.',
      tier: 'TIER 03 / DIRECT ADVISORY',
      badge: '1:1 LAB',
      version: 'v1.0',
      fileSize: 'Advisory Session',
      componentCount: 1,
      features: [
        '60-minute synchronous deep-dive audit session',
        'Full codebase architecture review',
        'Bottleneck identification & V8 optimization memo',
        'Actionable execution roadmap with code snippets',
        'Direct async Q&A follow-up access',
      ],
      artifactKey: 'consultation-audit.pdf',
      isActive: true,
    },
    create: {
      id: '4a9b2c3d-3333-4aaa-bbbb-000000000003',
      slug: 'consultation-audit',
      title: 'Consultation & System Audit',
      type: 'CONSULTATION_AUDIT',
      priceUsd: 490.0,
      description: '1-on-1 Deep Dive · V8 Internals · Architecture Review & Scalability Roadmap.',
      tier: 'TIER 03 / DIRECT ADVISORY',
      badge: '1:1 LAB',
      version: 'v1.0',
      fileSize: 'Advisory Session',
      componentCount: 1,
      features: [
        '60-minute synchronous deep-dive audit session',
        'Full codebase architecture review',
        'Bottleneck identification & V8 optimization memo',
        'Actionable execution roadmap with code snippets',
        'Direct async Q&A follow-up access',
      ],
      artifactKey: 'consultation-audit.pdf',
      isActive: true,
    },
  });

  console.log('[Seed] 2. Seeding SystemShowcase records...');
  await prisma.systemShowcase.upsert({
    where: { slug: 'autonomous-ai-swarm' },
    update: {
      number: '001',
      category: 'AGENTIC INFRASTRUCTURE',
      title: 'Autonomous AI Swarm',
      tagline: 'Complexity. Orchestrated.',
      description: 'A coordinated agent network that researches, reasons, and executes. One supervisor. Parallel intelligence. Traceable decisions.',
      topology: {
        supervisor: { role: 'SUPERVISOR', context: '128k', status: 'ACTIVE' },
        workers: [
          { id: 'agent-01', name: 'RESEARCH', task: 'gathering', status: 'ONLINE' },
          { id: 'agent-02', name: 'REASONING', task: 'planning', status: 'ONLINE' },
          { id: 'agent-03', name: 'EXECUTION', task: 'running', status: 'ONLINE' },
          { id: 'agent-04', name: 'VALIDATION', task: 'passing', status: 'ONLINE' },
        ],
        legend: ['EVENT BUS', 'SHARED CONTEXT'],
      },
      metrics: { fps: 60, latency: '18ms', activeAgents: 8 },
      recentLog: '[14:32:08] task.complete → deliverable.ready',
      sortOrder: 1,
      isActive: true,
    },
    create: {
      slug: 'autonomous-ai-swarm',
      number: '001',
      category: 'AGENTIC INFRASTRUCTURE',
      title: 'Autonomous AI Swarm',
      tagline: 'Complexity. Orchestrated.',
      description: 'A coordinated agent network that researches, reasons, and executes. One supervisor. Parallel intelligence. Traceable decisions.',
      topology: {
        supervisor: { role: 'SUPERVISOR', context: '128k', status: 'ACTIVE' },
        workers: [
          { id: 'agent-01', name: 'RESEARCH', task: 'gathering', status: 'ONLINE' },
          { id: 'agent-02', name: 'REASONING', task: 'planning', status: 'ONLINE' },
          { id: 'agent-03', name: 'EXECUTION', task: 'running', status: 'ONLINE' },
          { id: 'agent-04', name: 'VALIDATION', task: 'passing', status: 'ONLINE' },
        ],
        legend: ['EVENT BUS', 'SHARED CONTEXT'],
      },
      metrics: { fps: 60, latency: '18ms', activeAgents: 8 },
      recentLog: '[14:32:08] task.complete → deliverable.ready',
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.systemShowcase.upsert({
    where: { slug: 'high-throughput-graphql' },
    update: {
      number: '002',
      category: 'DATA PLANE',
      title: 'High-Throughput GraphQL',
      tagline: 'Persisted queries. Batched resolvers. A data layer built to stay ahead of demand.',
      description: 'Persisted queries. Batched resolvers. A data layer built to stay ahead of demand.',
      topology: {
        layers: ['QUERY', 'RESOLVER', 'CACHE'],
        pipeline: ['persisted_document', 'dataloader_batch', 'l1_l2_cache'],
      },
      metrics: { fps: 60, p95Latency: '12ms P95', throughputRps: 45000 },
      recentLog: '[14:32:10] batch.resolved 128 keys in 1.4ms',
      sortOrder: 2,
      isActive: true,
    },
    create: {
      slug: 'high-throughput-graphql',
      number: '002',
      category: 'DATA PLANE',
      title: 'High-Throughput GraphQL',
      tagline: 'Persisted queries. Batched resolvers. A data layer built to stay ahead of demand.',
      description: 'Persisted queries. Batched resolvers. A data layer built to stay ahead of demand.',
      topology: {
        layers: ['QUERY', 'RESOLVER', 'CACHE'],
        pipeline: ['persisted_document', 'dataloader_batch', 'l1_l2_cache'],
      },
      metrics: { fps: 60, p95Latency: '12ms P95', throughputRps: 45000 },
      recentLog: '[14:32:10] batch.resolved 128 keys in 1.4ms',
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.systemShowcase.upsert({
    where: { slug: 'omnichannel-sync' },
    update: {
      number: '003',
      category: 'EVENT DELIVERY',
      title: 'Omnichannel Sync',
      tagline: 'One event stream. Every touchpoint aligned. Idempotent delivery without duplicate actions.',
      description: 'One event stream. Every touchpoint aligned. Idempotent delivery without duplicate actions.',
      topology: {
        eventSource: 'order.paid',
        targets: [
          { channel: 'TELEGRAM', status: 'SYNCED', latency: '14ms' },
          { channel: 'WEB + CRM', status: 'SYNCED', latency: '21ms' },
        ],
      },
      metrics: { fps: 60, syncLatency: '21ms SYNC', deliveryRate: '99.99%' },
      recentLog: '[14:32:11] event.dispatched order.paid → 2 targets',
      sortOrder: 3,
      isActive: true,
    },
    create: {
      slug: 'omnichannel-sync',
      number: '003',
      category: 'EVENT DELIVERY',
      title: 'Omnichannel Sync',
      tagline: 'One event stream. Every touchpoint aligned. Idempotent delivery without duplicate actions.',
      description: 'One event stream. Every touchpoint aligned. Idempotent delivery without duplicate actions.',
      topology: {
        eventSource: 'order.paid',
        targets: [
          { channel: 'TELEGRAM', status: 'SYNCED', latency: '14ms' },
          { channel: 'WEB + CRM', status: 'SYNCED', latency: '21ms' },
        ],
      },
      metrics: { fps: 60, syncLatency: '21ms SYNC', deliveryRate: '99.99%' },
      recentLog: '[14:32:11] event.dispatched order.paid → 2 targets',
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log('[Seed] Database seeding completed successfully.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('[Seed Error]', e);
  process.exit(1);
});
