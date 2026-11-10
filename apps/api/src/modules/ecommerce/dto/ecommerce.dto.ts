import { Field, Float, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import {
  AuthResponseSchema,
  CheckUserResponseSchema,
  CreateCustomOrderSchema,
  CustomOrderResponseSchema,
  InitPurchaseSchema,
  MilestoneResponseSchema,
  ProductResponseSchema,
  PurchaseResponseSchema,
  RegisterUserSchema,
  SystemShowcaseResponseSchema,
  TelegramAuthSchema,
  UserProfileSchema,
} from '@induktr/contracts';

export enum GqlOrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(GqlOrderStatus, {
  name: 'OrderStatus',
});

export enum GqlProductType {
  UI_KIT = 'UI_KIT',
  CHEATSHEET_HIGH_LEVEL = 'CHEATSHEET_HIGH_LEVEL',
  CHEATSHEET_LOW_LEVEL = 'CHEATSHEET_LOW_LEVEL',
  CONSULTATION_AUDIT = 'CONSULTATION_AUDIT',
}

registerEnumType(GqlProductType, {
  name: 'ProductType',
});

export enum GqlUserRole {
  CLIENT = 'CLIENT',
  STUDIO_LEAD = 'STUDIO_LEAD',
  ADMIN = 'ADMIN',
}

registerEnumType(GqlUserRole, {
  name: 'UserRole',
});

export enum GqlMilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

registerEnumType(GqlMilestoneStatus, {
  name: 'MilestoneStatus',
});

@ObjectType()
export class UserResponse extends createZodDto(UserProfileSchema) {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  telegramId?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => GqlUserRole)
  role!: GqlUserRole;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class ProductResponse extends createZodDto(ProductResponseSchema) {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  title!: string;

  @Field(() => GqlProductType)
  type!: GqlProductType;

  @Field(() => Float)
  priceUsd!: number;

  @Field()
  description!: string;

  @Field({ nullable: true })
  tier?: string;

  @Field({ nullable: true })
  badge?: string;

  @Field({ nullable: true })
  version?: string;

  @Field({ nullable: true })
  fileSize?: string;

  @Field(() => Int, { nullable: true })
  componentCount?: number;

  @Field(() => [String], { nullable: true })
  features?: string[];

  @Field({ nullable: true })
  artifactKey?: string;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class PurchaseResponse extends createZodDto(PurchaseResponseSchema) {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => ProductResponse, { nullable: true })
  product?: ProductResponse;

  @Field(() => Float)
  amountUsd!: number;

  @Field(() => GqlOrderStatus)
  status!: GqlOrderStatus;

  @Field({ nullable: true })
  downloadUrl?: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class MilestoneResponse extends createZodDto(MilestoneResponseSchema) {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  step!: number;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GqlMilestoneStatus)
  status!: GqlMilestoneStatus;

  @Field({ nullable: true })
  completedAt?: string;

  @Field({ nullable: true })
  createdAt?: string;

  @Field({ nullable: true })
  updatedAt?: string;
}

@ObjectType()
export class CustomOrderResponse extends createZodDto(CustomOrderResponseSchema) {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  orderNumber?: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  title!: string;

  @Field(() => Float)
  budgetUsd!: number;

  @Field(() => GqlOrderStatus)
  status!: GqlOrderStatus;

  @Field({ nullable: true })
  sprint?: string;

  @Field({ nullable: true })
  deliveryDate?: string;

  @Field({ nullable: true })
  nextReviewDate?: string;

  @Field(() => [MilestoneResponse], { defaultValue: [] })
  milestones!: MilestoneResponse[];

  @Field()
  createdAt!: string;
}

@ObjectType()
export class SystemShowcaseResponse extends createZodDto(SystemShowcaseResponseSchema) {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  number!: string;

  @Field()
  category!: string;

  @Field()
  title!: string;

  @Field()
  tagline!: string;

  @Field()
  description!: string;

  @Field()
  topology!: string;

  @Field()
  metrics!: string;

  @Field()
  recentLog!: string;

  @Field(() => Int)
  sortOrder!: number;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

@InputType()
export class CreateCustomOrderInput extends createZodDto(CreateCustomOrderSchema) {
  @Field()
  title!: string;

  @Field(() => Float)
  budgetUsd!: number;
}

@InputType()
export class InitPurchaseInput extends createZodDto(InitPurchaseSchema) {
  @Field(() => ID)
  productId!: string;
}

@InputType()
export class TelegramAuthInput extends createZodDto(TelegramAuthSchema) {
  @Field()
  initData!: string;
}

@ObjectType()
export class AuthResponse extends createZodDto(AuthResponseSchema) {
  @Field()
  token!: string;

  @Field(() => UserResponse)
  user!: UserResponse;
}

@ObjectType()
export class CheckUserResponse extends createZodDto(CheckUserResponseSchema) {
  @Field(() => Boolean)
  exists!: boolean;

  @Field(() => UserResponse, { nullable: true })
  user?: UserResponse | null;
}

@InputType()
export class RegisterUserInput extends createZodDto(RegisterUserSchema) {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  telegramId?: string;
}
