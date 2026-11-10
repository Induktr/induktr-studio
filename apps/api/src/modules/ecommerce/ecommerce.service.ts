import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHmac } from 'crypto';
import {
  CreateCustomOrderSchema,
  InitPurchaseSchema,
  ProductResponseSchema,
  PurchaseResponseSchema,
  SystemShowcaseResponseSchema,
} from '@induktr/contracts';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateCustomOrderInput,
  CustomOrderResponse,
  MilestoneResponse,
  ProductResponse,
  PurchaseResponse,
  SystemShowcaseResponse,
} from './dto/ecommerce.dto';
import { GqlMilestoneStatus, GqlOrderStatus, GqlProductType } from './dto/ecommerce.dto';

@Injectable()
export class EcommerceService {
  private readonly logger = new Logger(EcommerceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProducts(): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => {
      const featuresArray = Array.isArray(p.features)
        ? (p.features as string[])
        : typeof p.features === 'string'
        ? (JSON.parse(p.features) as string[])
        : [];

      const validated = ProductResponseSchema.parse({
        id: p.id,
        slug: p.slug,
        title: p.title,
        type: p.type,
        priceUsd: p.priceUsd,
        description: p.description,
        tier: p.tier,
        badge: p.badge,
        version: p.version,
        fileSize: p.fileSize,
        componentCount: p.componentCount,
        features: featuresArray,
        artifactKey: p.artifactKey,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
      });
      return validated as unknown as ProductResponse;
    });
  }

  async getUserPurchases(userId: string): Promise<PurchaseResponse[]> {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    return purchases.map((item) => {
      const p = item.product;
      const featuresArray = p && Array.isArray(p.features)
        ? (p.features as string[])
        : p && typeof p.features === 'string'
        ? (JSON.parse(p.features) as string[])
        : [];

      const validated = PurchaseResponseSchema.parse({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        amountUsd: item.amountUsd,
        status: item.status,
        downloadUrl: item.downloadUrl,
        createdAt: item.createdAt.toISOString(),
        product: p
          ? {
              id: p.id,
              slug: p.slug,
              title: p.title,
              type: p.type,
              priceUsd: p.priceUsd,
              description: p.description,
              tier: p.tier,
              badge: p.badge,
              version: p.version,
              fileSize: p.fileSize,
              componentCount: p.componentCount,
              features: featuresArray,
              artifactKey: p.artifactKey,
              isActive: p.isActive,
              createdAt: p.createdAt.toISOString(),
            }
          : undefined,
      });
      return validated as unknown as PurchaseResponse;
    });
  }

  async getUserOrders(userId: string): Promise<CustomOrderResponse[]> {
    const orders = await this.prisma.customOrder.findMany({
      where: { userId },
      include: { milestones: { orderBy: { step: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => {
      let milestonesList: MilestoneResponse[] = [];

      if (Array.isArray(o.milestones)) {
        milestonesList = o.milestones.map((m) => ({
          id: m.id,
          orderId: m.orderId,
          step: m.step,
          title: m.title,
          description: m.description,
          status: m.status as unknown as GqlMilestoneStatus,
          completedAt: m.completedAt ? m.completedAt.toISOString() : undefined,
          createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: m.updatedAt ? m.updatedAt.toISOString() : new Date().toISOString(),
        }));
      } else if (typeof o.milestones === 'string') {
        try {
          const parsed = JSON.parse(o.milestones) as Array<{
            id?: string;
            step?: number;
            title: string;
            description?: string;
            status?: string;
            completedAt?: string;
          }>;
          milestonesList = parsed.map((item, idx) => ({
            id: item.id || `m-${idx + 1}`,
            step: item.step ?? idx + 1,
            title: item.title,
            description: item.description,
            status: (item.status as GqlMilestoneStatus) || GqlMilestoneStatus.PENDING,
            completedAt: item.completedAt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        } catch {
          milestonesList = [];
        }
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        userId: o.userId,
        title: o.title,
        budgetUsd: o.budgetUsd,
        status: o.status as unknown as GqlOrderStatus,
        sprint: o.sprint ?? undefined,
        deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString() : undefined,
        nextReviewDate: o.nextReviewDate ? o.nextReviewDate.toISOString() : undefined,
        milestones: milestonesList,
        createdAt: o.createdAt.toISOString(),
      } as unknown as CustomOrderResponse;
    });
  }

  async createCustomOrder(userId: string, rawInput: CreateCustomOrderInput): Promise<CustomOrderResponse> {
    const input = CreateCustomOrderSchema.parse(rawInput);
    const orderNumber = `IND-${Math.floor(100 + Math.random() * 900)}`;

    const order = await this.prisma.customOrder.create({
      data: {
        userId,
        orderNumber,
        title: input.title,
        budgetUsd: input.budgetUsd,
        status: 'PENDING',
        milestones: {
          create: [
            { step: 1, title: 'Intake & Architecture Specs', description: 'Intake and architecture specifications', status: 'IN_PROGRESS' },
            { step: 2, title: 'Prototype & Design System', description: 'Prototype and interactive design tokens', status: 'PENDING' },
            { step: 3, title: 'Full Stack Delivery & Deployment', description: 'Production staging verification and deployment', status: 'PENDING' },
          ],
        },
      },
      include: { milestones: { orderBy: { step: 'asc' } } },
    });

    type MilestoneRecord = {
      id?: string;
      orderId?: string;
      step: number;
      title: string;
      description?: string;
      status: string;
      completedAt?: Date | string | null;
      createdAt?: Date | string;
      updatedAt?: Date | string;
    };

    const rawMilestones: MilestoneRecord[] = typeof (order as unknown as { milestones?: unknown }).milestones === 'string'
      ? (JSON.parse((order as unknown as { milestones: string }).milestones) as MilestoneRecord[])
      : Array.isArray((order as unknown as { milestones?: unknown }).milestones)
        ? ((order as unknown as { milestones: MilestoneRecord[] }).milestones)
        : [];

    const milestonesList: MilestoneResponse[] = rawMilestones.map((m) => ({
      id: m.id || `ms-${m.step}`,
      orderId: m.orderId || order.id,
      step: m.step,
      title: m.title,
      description: m.description,
      status: m.status as unknown as GqlMilestoneStatus,
      completedAt: m.completedAt ? (m.completedAt instanceof Date ? m.completedAt.toISOString() : String(m.completedAt)) : undefined,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : (m.createdAt ? String(m.createdAt) : order.createdAt.toISOString()),
      updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : (m.updatedAt ? String(m.updatedAt) : order.createdAt.toISOString()),
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      title: order.title,
      budgetUsd: order.budgetUsd,
      status: order.status as unknown as GqlOrderStatus,
      sprint: order.sprint ?? undefined,
      deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString() : undefined,
      nextReviewDate: order.nextReviewDate ? order.nextReviewDate.toISOString() : undefined,
      milestones: milestonesList,
      createdAt: order.createdAt.toISOString(),
    } as unknown as CustomOrderResponse;
  }

  async initPurchase(userId: string, rawProductId: string): Promise<PurchaseResponse> {
    const { productId } = InitPurchaseSchema.parse({ productId: rawProductId });

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        userId,
        productId,
        amountUsd: product.priceUsd,
        status: 'PAID', // Instant test provisioning in development
        downloadUrl: `https://cdn.induktr.studio/artifacts/${product.slug}.zip`,
      },
      include: { product: true },
    });

    const featuresArray = Array.isArray(product.features)
      ? (product.features as string[])
      : typeof product.features === 'string'
      ? (JSON.parse(product.features) as string[])
      : [];

    const validated = PurchaseResponseSchema.parse({
      id: purchase.id,
      userId: purchase.userId,
      productId: purchase.productId,
      amountUsd: purchase.amountUsd,
      status: purchase.status,
      downloadUrl: purchase.downloadUrl,
      createdAt: purchase.createdAt.toISOString(),
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        type: product.type as unknown as GqlProductType,
        priceUsd: product.priceUsd,
        description: product.description,
        tier: product.tier,
        badge: product.badge,
        version: product.version,
        fileSize: product.fileSize,
        componentCount: product.componentCount,
        features: featuresArray,
        artifactKey: product.artifactKey,
        isActive: product.isActive,
        createdAt: product.createdAt.toISOString(),
      },
    });

    return validated as unknown as PurchaseResponse;
  }

  async generateDigitalDownloadUrl(purchaseId: string, userId: string): Promise<string> {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, userId, status: 'PAID' },
      include: { product: true },
    });

    if (!purchase) {
      throw new NotFoundException('Paid purchase not found or unauthorized');
    }

    this.logger.log(`Generated secure presigned URL for purchase ${purchase.id}`);
    const secret = process.env.DOWNLOAD_SIGNING_SECRET || 'induktr_digital_signature_secret_v2';
    const expiresAt = Date.now() + 3600 * 1000;
    const payload = `${purchase.id}:${userId}:${expiresAt}`;
    let signature: string;
    if (typeof Bun !== 'undefined' && Bun.CryptoHasher) {
      signature = new Bun.CryptoHasher('sha256', secret).update(payload).digest('base64url');
    } else {
      signature = createHmac('sha256', secret).update(payload).digest('base64url');
    }
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
    return `https://cdn.induktr.studio/artifacts/${purchase.product.slug}.zip?token=${token}`;
  }

  async getSystemShowcases(): Promise<SystemShowcaseResponse[]> {
    const showcases = await this.prisma.systemShowcase.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return showcases.map((s) => {
      const validated = SystemShowcaseResponseSchema.parse({
        id: s.id,
        slug: s.slug,
        number: s.number,
        category: s.category,
        title: s.title,
        tagline: s.tagline,
        description: s.description,
        topology: typeof s.topology === 'string' ? s.topology : JSON.stringify(s.topology),
        metrics: typeof s.metrics === 'string' ? s.metrics : JSON.stringify(s.metrics),
        recentLog: s.recentLog,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      });
      return validated as unknown as SystemShowcaseResponse;
    });
  }
}
