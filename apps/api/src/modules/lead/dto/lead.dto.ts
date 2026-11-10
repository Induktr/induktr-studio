import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { createZodDto } from 'nestjs-zod';
import { CreateLeadSchema, LeadResponseSchema } from '@induktr/contracts';

export enum GqlLeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

registerEnumType(GqlLeadStatus, {
  name: 'LeadStatus',
});

@InputType()
export class CreateLeadInput extends createZodDto(CreateLeadSchema) {
  @Field()
  name!: string;

  @Field()
  contact!: string;

  @Field()
  budget!: string;

  @Field()
  description!: string;

  @Field({ defaultValue: 'FULL_CYCLE_ENGINEERING', nullable: true })
  serviceType?: string;

  @Field({ nullable: true })
  referrer?: string;

  @Field({ nullable: true })
  idempotencyKey?: string;
}

@ObjectType()
export class LeadResponse extends createZodDto(LeadResponseSchema) {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  contact!: string;

  @Field()
  budget!: string;

  @Field()
  description!: string;

  @Field(() => GqlLeadStatus)
  status!: GqlLeadStatus;

  @Field()
  createdAt!: string;
}
