import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EcommerceResolver } from './ecommerce.resolver';
import { EcommerceService } from './ecommerce.service';

@Module({
  imports: [PrismaModule],
  providers: [EcommerceService, EcommerceResolver],
  exports: [EcommerceService],
})
export class EcommerceModule {}
