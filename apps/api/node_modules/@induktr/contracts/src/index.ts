import { z } from 'zod';

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const CreateLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  contact: z.string().min(3, 'Contact handle/email required').max(150),
  budget: z.string().min(1, 'Budget is required'),
  description: z.string().min(5, 'Brief description required').max(2000),
  serviceType: z.string().optional(),
  referrer: z.string().optional(),
  idempotencyKey: z
    .string()
    .regex(
      /^(?:lead-[a-f0-9]{8,16}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/i,
      'Must be valid lead slug or UUID'
    )
    .optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const LeadResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  budget: z.string(),
  description: z.string(),
  status: LeadStatusSchema,
  createdAt: z.string(),
});
export type LeadResponse = z.infer<typeof LeadResponseSchema>;

export const UserRoleSchema = z.enum(['CLIENT', 'STUDIO_LEAD', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export interface TelegramInitDataUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export const UserProfileSchema = z.object({
  id: z.string(),
  telegramId: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  role: UserRoleSchema,
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const TelegramAuthSchema = z.object({
  initData: z.string().min(1, 'Telegram initData is required'),
});
export type TelegramAuthInput = z.infer<typeof TelegramAuthSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserProfileSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const ProductTypeSchema = z.enum([
  'UI_KIT',
  'CHEATSHEET_HIGH_LEVEL',
  'CHEATSHEET_LOW_LEVEL',
  'CONSULTATION_AUDIT',
]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const ProductCategorySchema = z.enum([
  'ALL',
  'APPS_TEMPLATES',
  'UI_KITS',
  'CHEATSHEETS',
  'SERVICES',
]);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  type: ProductTypeSchema,
  priceUsd: z.number(),
  description: z.string(),
  tier: z.string().optional(),
  badge: z.string().optional(),
  version: z.string().optional(),
  fileSize: z.string().nullable().optional(),
  componentCount: z.number().nullable().optional(),
  features: z.union([z.string(), z.array(z.string())]).optional(),
  artifactKey: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string(),
});
export type ProductResponse = z.infer<typeof ProductResponseSchema>;

export const ProductItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  type: z.string(),
  priceUsd: z.number(),
  description: z.string(),
  tier: z.string().optional(),
  badge: z.string().optional(),
  version: z.string().optional(),
  fileSize: z.string().nullable().optional(),
  componentCount: z.number().nullable().optional(),
  features: z.array(z.string()).optional(),
  category: ProductCategorySchema.optional(),
  artifactKey: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type ProductItem = z.infer<typeof ProductItemSchema>;

export const CaseStudyCategorySchema = z.enum([
  'ALL',
  'PRODUCTION_CASES',
  'STUDIO_LIFE',
  'RD_LAB',
]);
export type CaseStudyCategory = z.infer<typeof CaseStudyCategorySchema>;

export const CaseStudyMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  accent: z.enum(['cyan', 'purple', 'green']).optional(),
});
export type CaseStudyMetric = z.infer<typeof CaseStudyMetricSchema>;

export const CaseStudyItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: CaseStudyCategorySchema,
  badge: z.string(),
  tagline: z.string(),
  date: z.string().optional(),
  readingTime: z.string().optional(),
  readTime: z.string().optional(),
  metrics: z.array(CaseStudyMetricSchema).optional(),
  technologies: z.array(z.string()).optional(),
  stack: z.array(z.string()).optional(),
  image: z.string(),
  blueprintTitle: z.string(),
  challenge: z.string().optional(),
  summary: z.string().optional(),
  architecture: z.union([z.string(), z.array(z.string())]).optional(),
  architectureHighlights: z.array(z.string()).optional(),
  impact: z.union([z.string(), z.array(z.string())]).optional(),
});
export type CaseStudyItem = z.infer<typeof CaseStudyItemSchema>;

export const AffineMatrixSchema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);
export type AffineMatrix = z.infer<typeof AffineMatrixSchema>;

export const OrderStatusSchema = z.enum(['PENDING', 'PAID', 'DELIVERED', 'CANCELLED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const MilestoneStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export type MilestoneStatus = z.infer<typeof MilestoneStatusSchema>;

export const MilestoneResponseSchema = z.object({
  id: z.string(),
  orderId: z.string().optional(),
  step: z.number(),
  title: z.string(),
  description: z.string().optional(),
  status: MilestoneStatusSchema,
  completedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type MilestoneResponse = z.infer<typeof MilestoneResponseSchema>;

export const InitPurchaseSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});
export type InitPurchaseInput = z.infer<typeof InitPurchaseSchema>;

export const PurchaseResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  product: ProductResponseSchema.optional(),
  amountUsd: z.number(),
  status: OrderStatusSchema,
  downloadUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type PurchaseResponse = z.infer<typeof PurchaseResponseSchema>;

export interface PurchaseContract {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  amountUsd: number;
  downloadUrl?: string;
  status: OrderStatus;
  purchasedAt: string;
}

export const CreateCustomOrderSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  budgetUsd: z.number().positive('Budget must be positive'),
});
export type CreateCustomOrderInput = z.infer<typeof CreateCustomOrderSchema>;

export const CustomOrderResponseSchema = z.object({
  id: z.string(),
  orderNumber: z.string().optional(),
  userId: z.string(),
  title: z.string(),
  budgetUsd: z.number(),
  status: OrderStatusSchema,
  sprint: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  nextReviewDate: z.string().nullable().optional(),
  milestones: z.union([z.string(), z.array(MilestoneResponseSchema)]).default('[]'),
  createdAt: z.string(),
});
export type CustomOrderResponse = z.infer<typeof CustomOrderResponseSchema>;

export interface CustomOrderContract {
  id: string;
  userId: string;
  title: string;
  budgetUsd: number;
  status: OrderStatus;
  milestones: { title: string; completed: boolean }[];
  createdAt: string;
}

export const SystemShowcaseResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  number: z.string(),
  category: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  topology: z.string(),
  metrics: z.string(),
  recentLog: z.string(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SystemShowcaseResponse = z.infer<typeof SystemShowcaseResponseSchema>;

export const CheckUserResponseSchema = z.object({
  exists: z.boolean(),
  user: UserProfileSchema.nullable().optional(),
});
export type CheckUserResponse = z.infer<typeof CheckUserResponseSchema>;

export const RegisterUserSchema = z.object({
  username: z.string().optional(),
  firstName: z.string().optional(),
  email: z.string().optional(),
  telegramId: z.string().optional(),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const SupportedLocaleSchema = z.enum(['en', 'ua', 'de', 'ar', 'es']);
export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'ua', 'de', 'ar', 'es'] as const;
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export * from './objects';
